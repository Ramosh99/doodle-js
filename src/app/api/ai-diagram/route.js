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
      "shape": "rounded|rect|circle|diamond|cylinder|cloud|triangle|text",
      "icon": "single relevant emoji",
      "fill": "dark hex color (e.g. #1e293b, #1e1b4b, #14532d, #7f1d1d, #0c4a6e)",
      "stroke": "bright border hex (e.g. #6366f1, #a855f7, #10b981, #f59e0b, #3b82f6)",
      "width": 140,
      "height": 60
    }
  ],
  "edges": [
    {
      "id": "e_unique",
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "short label",
      "animated": true
    }
  ]
}

Shape usage guide:
- cylinder → databases, storage, caches
- cloud → external APIs, cloud providers, CDNs
- circle → actors, users, entry points
- diamond → decision points, gateways, load balancers
- rounded/rect → services, processes, components
- triangle → triggers, events

Keep nodes between 5–15. Use rich dark fills paired with bright neon borders.`;

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

    const genAI  = new GoogleGenerativeAI(apiKey);
    const model  = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: mode === 'mermaid' ? MERMAID_SYSTEM : CANVAS_SYSTEM,
    });

    // ── Mermaid mode ────────────────────────────────────────────────────────
    if (mode === 'mermaid') {
      const userText = diagramType
        ? `Generate a Mermaid.js diagram for: "${prompt}". Use the "${diagramType}" diagram type.`
        : `Generate a Mermaid.js diagram for: "${prompt}".`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 3000, topP: 0.95 },
      });

      let raw = result.response.text().trim();
      if (raw.startsWith('```')) {
        raw = raw.replace(/^```[a-zA-Z0-9-]*\n?/i, '').replace(/\n?```$/g, '').trim();
      }
      const mermaidCode = sanitizeMermaid(raw);
      return Response.json({ mode: 'mermaid', code: mermaidCode });
    }

    // ── Canvas JSON mode ────────────────────────────────────────────────────
    const userText = diagramType
      ? `Generate a "${diagramType}" diagram for: "${prompt}".`
      : `Generate a diagram for: "${prompt}".`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 3500, topP: 0.95 },
    });

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
