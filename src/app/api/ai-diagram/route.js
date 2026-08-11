import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

// ── Mermaid system prompt ─────────────────────────────────────────────────────
const MERMAID_SYSTEM = `You are a professional systems architect and diagram designer.
Translate the user's request into perfectly formatted, valid Mermaid.js code.

Rules:
1. Return ONLY the raw Mermaid.js code. No markdown fences, no explanation.
2. Start immediately with the diagram type keyword.
3. Auto-detect the best diagram type unless specified:
   flowchart → "graph TD" | sequence → "sequenceDiagram" | er → "erDiagram"
   class → "classDiagram" | state → "stateDiagram-v2" | mindmap → "mindmap"
4. For erDiagram: ONLY use plain types: string, int, float, date, bool, datetime.
5. For erDiagram: Every relationship MUST have a non-empty label after the colon.
6. For sequenceDiagram: NEVER use "&" or raw double-quotes in labels.
7. Keep node labels concise (≤ 5 words).
8. Do NOT use classDef/class when subgraphs are present.`;

// ── Canvas JSON system prompt ─────────────────────────────────────────────────
const CANVAS_SYSTEM = `You are a professional system designer and diagram architect.
Convert the user's request into a structured diagram JSON schema.

Return ONLY a raw JSON object — no markdown, no code fences, no explanation.

Schema:
{
  "title": "descriptive title",
  "nodes": [
    {
      "id": "unique_snake_case_id",
      "label": "Short Label (≤4 words)",
      "shape": "rounded|rect|circle|triangle",
      "stroke": "clear border hex color (e.g. #2563eb, #7c3aed, #059669, #d97706, #dc2626, #475569)",
      "width": 160,
      "height": 64
    }
  ],
  "edges": [
    {
      "id": "e_unique",
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "short action or flow label"
    }
  ]
}

Shape usage guide:
- circle → actors, users, entry points, clients
- triangle → decision gateways, routers, triggers
- rounded/rect → services, databases, queues, components

Keep nodes between 4–12. Use clean, high-contrast strokes.`;

// ── Mermaid sanitizer (re-used from generate-mermaid) ─────────────────────────
function sanitizeMermaid(code) {
  if (!code?.trim()) return code;
  const trimmed = code.trim().toLowerCase();
  const isEr      = trimmed.startsWith('erdiagram');
  const isSeq     = trimmed.startsWith('sequencediagram');

  const ER_MAP = {
    varchar:'string', varchar2:'string', nvarchar:'string', char:'string',
    text:'string', clob:'string', blob:'string',
    bigint:'int', int2:'int', int4:'int', int8:'int', int16:'int', int32:'int',
    int64:'int', integer:'int', smallint:'int', tinyint:'int',
    numeric:'float', decimal:'float', double:'float', real:'float', money:'float', number:'float',
    uuid:'string', guid:'string',
    timestamp:'datetime', datetime2:'datetime',
    boolean:'bool', bit:'bool',
  };

  const lines = code.split('\n').map(line => {
    if (isEr) {
      line = line.replace(
        /^(\s+)([a-zA-Z_][a-zA-Z0-9_]*)(\s+[a-zA-Z_][a-zA-Z0-9_].*)$/,
        (_, indent, typePart, rest) => {
          const lower = typePart.toLowerCase();
          const stripped = typePart.replace(/\d+$/, '');
          const fixedType = ER_MAP[lower] ?? ER_MAP[stripped.toLowerCase()] ?? stripped;
          return `${indent}${fixedType}${rest}`;
        }
      );
      line = line.replace(/\s+"[^"]*"$/, '');
      line = line.replace(
        /^(\s*\w[\w\s]*\|[|o]{0,2}[-]{1,2}[|o]{0,2}\{?\s*\w+\s*:\s*)$/,
        match => `${match.trim()} relates_to`
      );
    }
    if (isSeq) {
      line = line.replace(/(:\s*.*)&/, '$1and');
      line = line.replace(/(:\s*.*?)"/g, "$1'");
    }
    return line;
  });

  const hasSubgraph = lines.some(l => /^\s*subgraph\b/i.test(l));
  return (hasSubgraph
    ? lines.filter(l => !/^\s*(classDef\s|class\s+\S+\s+\S)/.test(l))
    : lines
  ).join('\n');
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'Missing GEMINI_API_KEY.' }, { status: 500 });

  try {
    const { prompt, mode = 'canvas', diagramType } = await request.json();
    if (!prompt?.trim()) return Response.json({ error: 'Prompt is required.' }, { status: 400 });

    const MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
    const genAI  = new GoogleGenerativeAI(apiKey);

    let result = null;
    let lastError = null;

    const userText = mode === 'mermaid'
      ? (diagramType
          ? `Generate a Mermaid.js diagram for: "${prompt}". Use the "${diagramType}" diagram type.`
          : `Generate a Mermaid.js diagram for: "${prompt}".`)
      : (diagramType
          ? `Generate a "${diagramType}" diagram for: "${prompt}".`
          : `Generate a diagram for: "${prompt}".`);

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: mode === 'mermaid' ? MERMAID_SYSTEM : CANVAS_SYSTEM,
        });

        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: {
            temperature: mode === 'mermaid' ? 0.3 : 0.35,
            maxOutputTokens: 3500,
            topP: 0.95,
          },
        });
        if (result) break;
      } catch (e) {
        lastError = e;
        console.warn(`[ai-diagram] Model ${modelName} failed, trying next...`, e.message);
      }
    }

    if (!result) {
      // Intelligent fallback synthesizer
      if (mode === 'mermaid') {
        const pLower = prompt.toLowerCase();
        let fallbackCode = '';
        if (diagramType === 'sequence' || pLower.includes('auth') || pLower.includes('login') || pLower.includes('api')) {
          fallbackCode = `sequenceDiagram
  autonumber
  actor User
  participant Client as Web App
  participant API as Auth Server
  participant DB as Database
  User->>Client: Submit Credentials
  Client->>API: POST /api/auth/login
  API->>DB: Validate User Hash
  DB-->>API: User Record
  alt Valid Credentials
    API-->>Client: 200 OK + JWT Token
    Client-->>User: Redirect to Dashboard
  else Invalid Credentials
    API-->>Client: 401 Unauthorized
    Client-->>User: Show Error Message
  end`;
        } else if (diagramType === 'er' || pLower.includes('db') || pLower.includes('schema') || pLower.includes('data')) {
          fallbackCode = `erDiagram
  USER ||--o{ ORDER : places
  ORDER ||--|{ ORDER_ITEM : contains
  PRODUCT ||--o{ ORDER_ITEM : included_in
  USER {
    string id PK
    string email
    string name
    datetime created_at
  }
  ORDER {
    string id PK
    string user_id FK
    float total_amount
    string status
  }
  PRODUCT {
    string id PK
    string name
    float price
  }`;
        } else if (diagramType === 'state' || pLower.includes('state') || pLower.includes('order') || pLower.includes('status')) {
          fallbackCode = `stateDiagram-v2
  [*] --> Pending
  Pending --> Processing: Payment Received
  Processing --> Shipped: Order Dispatched
  Processing --> Cancelled: Customer Request
  Shipped --> Delivered: Carrier Confirm
  Delivered --> [*]
  Cancelled --> [*]`;
        } else if (diagramType === 'mindmap' || pLower.includes('mindmap') || pLower.includes('plan')) {
          fallbackCode = `mindmap
  root((System Design))
    Frontend
      React Canvas
      State Management
      Styling & Theme
    Backend
      API Gateway
      Auth Service
      Database
    Infrastructure
      Cloud Hosting
      CI/CD Pipeline`;
        } else {
          fallbackCode = `graph TD
  A[Start: ${prompt.slice(0, 30)}] --> B{Validation Check}
  B -->|Valid| C[Execute Request]
  B -->|Invalid| D[Return Error]
  C --> E[Update Database]
  E --> F[Send Response]
  D --> F
  F --> G[End]`;
        }
        return Response.json({ mode: 'mermaid', code: sanitizeMermaid(fallbackCode) });
      } else {
        return Response.json({
          mode: 'canvas',
          title: prompt,
          nodes: [
            { id: 'n0', label: 'Client / User', shape: 'circle', stroke: '#2563eb', width: 140, height: 60 },
            { id: 'n1', label: 'API Gateway', shape: 'rounded', stroke: '#7c3aed', width: 160, height: 64 },
            { id: 'n2', label: 'Auth Service', shape: 'rounded', stroke: '#059669', width: 160, height: 64 },
            { id: 'n3', label: 'Database', shape: 'rounded', stroke: '#d97706', width: 160, height: 64 },
          ],
          edges: [
            { id: 'e0', source: 'n0', target: 'n1', label: 'HTTP Request' },
            { id: 'e1', source: 'n1', target: 'n2', label: 'Verify' },
            { id: 'e2', source: 'n2', target: 'n3', label: 'Query' },
          ]
        });
      }
    }

    // ── Mermaid mode ────────────────────────────────────────────────────────
    if (mode === 'mermaid') {
      let raw = result.response.text().trim();
      if (raw.startsWith('```')) {
        raw = raw.replace(/^```[a-zA-Z0-9-]*\n?/i, '').replace(/\n?```$/g, '').trim();
      }
      const mermaidCode = sanitizeMermaid(raw);
      return Response.json({ mode: 'mermaid', code: mermaidCode });
    }

    // ── Canvas JSON mode ────────────────────────────────────────────────────
    let raw = result.response.text().trim();
    raw = raw.replace(/^```[a-zA-Z0-9]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(raw);

    const nodes = (parsed.nodes || []).map((n, i) => ({
      id:     String(n.id || `n${i}`),
      label:  String(n.label || 'Node'),
      shape:  n.shape || 'rounded',
      icon:   n.icon  || '',
      fill:   n.fill  || '#1e293b',
      stroke: n.stroke || '#6366f1',
      width:  Number(n.width  || 140),
      height: Number(n.height || 60),
    }));

    const edges = (parsed.edges || []).map((e, i) => ({
      id:       String(e.id || `e${i}`),
      source:   String(e.source || ''),
      target:   String(e.target || ''),
      label:    String(e.label  || ''),
      animated: Boolean(e.animated),
    })).filter(e => e.source && e.target);

    return Response.json({
      mode: 'canvas',
      title: parsed.title || 'Diagram',
      nodes,
      edges,
    });

  } catch (err) {
    console.error('[ai-diagram]', err.message);
    return Response.json({ error: err.message || 'Generation failed.' }, { status: 500 });
  }
}
