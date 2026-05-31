import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'Missing GEMINI_API_KEY in environment.' },
      { status: 500 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const { prompt, diagramType } = await request.json();

    if (!prompt || !String(prompt).trim()) {
      return Response.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const systemInstruction = `You are a professional systems architect and diagram designer.
Your task is to translate the user's natural language request into perfectly formatted, valid Mermaid.js code.

Rules:
1. Return ONLY the raw Mermaid.js code.
2. DO NOT wrap the output in markdown code fences like \`\`\`mermaid or \`\`\`.
3. DO NOT include any introductory or concluding text. Start immediately with the Mermaid diagram type keyword.
4. Auto-detect the best diagram type for the request unless the user specifies one:
   - Flowcharts        → "graph TD" or "graph LR"
   - Sequence Diagrams → "sequenceDiagram"
   - ER Diagrams       → "erDiagram"
   - Class Diagrams    → "classDiagram"
   - State Diagrams    → "stateDiagram-v2"
   - Gantt Charts      → "gantt"
   - Mindmaps          → "mindmap"
5. Keep labels concise.
6. CRITICAL for erDiagram: ONLY use plain alphanumeric type names with NO trailing numbers.
   Allowed: string, int, float, date, bool, datetime.
   FORBIDDEN: varchar2, int8, bigint, int64, uuid, text, blob, decimal, timestamp, boolean.
7. CRITICAL for erDiagram: Relationship lines MUST always have a label after the colon. NEVER leave the label empty.
   WRONG:   PATIENT ||--o{ APPOINTMENT :
   CORRECT: PATIENT ||--o{ APPOINTMENT : schedules
8. CRITICAL for sequenceDiagram: NEVER use "&" or double-quote characters (") inside message labels. Use "and" instead of "&".
9. Do NOT use classDef or class statements when the diagram contains subgraph blocks.
10. Avoid special characters that break Mermaid parsing in node labels.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction,
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `Generate a Mermaid.js diagram for: "${prompt}".${diagramType ? ` Prefer the "${diagramType}" diagram type.` : ''}` }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3000,
        topP: 0.95,
      },
    });

    let rawCode = result.response.text().trim();

    console.log('\n[generate-mermaid] === RAW GEMINI RESPONSE =========================');
    console.log(`[generate-mermaid] Characters : ${rawCode.length}`);
    console.log(`[generate-mermaid] Lines      : ${rawCode.split('\n').length}`);
    console.log('[generate-mermaid] First 120  :', rawCode.slice(0, 120).replace(/\n/g, '↵'));
    console.log('[generate-mermaid] Last  120  :', rawCode.slice(-120).replace(/\n/g, '↵'));

    // Strip any markdown code fences the model may still have returned
    let mermaidCode = rawCode;
    if (mermaidCode.startsWith('```')) {
      mermaidCode = mermaidCode.replace(/^```[a-zA-Z0-9-]*\n/i, '').replace(/\n```$/g, '').trim();
      console.log('[generate-mermaid] Stripped markdown fences');
    }

    // Post-process: sanitize known AI output errors before sending to client
    const beforeSanitize = mermaidCode;
    mermaidCode = sanitizeMermaid(mermaidCode);

    if (mermaidCode !== beforeSanitize) {
      console.log('[generate-mermaid] Sanitizer made changes — diff lines:');
      beforeSanitize.split('\n').forEach((line, i) => {
        if (line !== mermaidCode.split('\n')[i]) {
          console.log(`  L${i + 1}  BEFORE: ${line.trim()}`);
          console.log(`  L${i + 1}  AFTER : ${(mermaidCode.split('\n')[i] || '(removed)').trim()}`);
        }
      });
    } else {
      console.log('[generate-mermaid] Sanitizer: no changes needed');
    }

    console.log('[generate-mermaid] === FINAL CODE SENT TO CLIENT ===================');
    console.log(mermaidCode);
    console.log('[generate-mermaid] ====================================================\n');

    return Response.json({ mermaidCode });
  } catch (error) {
    console.error('Gemini generation for Mermaid failed:', error);
    return Response.json({ error: 'Failed to generate Mermaid diagram code.' }, { status: 500 });
  }
}

/**
 * Sanitizes AI-generated Mermaid code to prevent common parse errors.
 *
 * Known AI failure modes fixed here:
 *
 * 1. erDiagram — numeric-suffixed types (int8, varchar2, uuid, bigint…)
 *    The Mermaid lexer tokenises the trailing digit as a NUMBER token:
 *      "Expecting BLOCK_STOP, ATTRIBUTE_WORD, got '8'"
 *    Fix: map to plain safe equivalents and strip trailing digits.
 *
 * 2. sequenceDiagram — "&" and raw double-quotes in message labels
 *    Both are special grammar tokens that cause immediate parse failure.
 *    Fix: replace & → "and", strip stray quotes.
 *
 * 3. Flowcharts with subgraphs — classDef / class applied to subgraph-scoped nodes
 *    Mermaid rejects class assignments that cross subgraph scope boundaries.
 *    Fix: remove all classDef / class lines when subgraphs are present.
 */
function sanitizeMermaid(code) {
  if (!code || !code.trim()) return code;

  const trimmed = code.trim().toLowerCase();
  const isEr       = trimmed.startsWith('erdiagram');
  const isSequence  = trimmed.startsWith('sequencediagram');

  // Map of forbidden erDiagram type names → safe replacements
  const ER_TYPE_MAP = {
    varchar: 'string', varchar2: 'string', nvarchar: 'string',
    char: 'string', text: 'string', clob: 'string', blob: 'string',
    bigint: 'int', int2: 'int', int4: 'int', int8: 'int',
    int16: 'int', int32: 'int', int64: 'int',
    integer: 'int', smallint: 'int', tinyint: 'int',
    numeric: 'float', decimal: 'float', double: 'float',
    real: 'float', money: 'float', number: 'float',
    uuid: 'string', guid: 'string',
    timestamp: 'datetime', datetime2: 'datetime',
    boolean: 'bool', bit: 'bool',
  };

  const sanitizedLines = code.split('\n').map(line => {
    if (isEr) {
      // Fix attribute type names: "    <type> <name> [PK|FK|UK]"
      line = line.replace(
        /^(\s+)([a-zA-Z_][a-zA-Z0-9_]*)(\s+[a-zA-Z_][a-zA-Z0-9_].*)$/,
        (_, indent, typePart, rest) => {
          const lower = typePart.toLowerCase();
          // Check direct map first, then strip trailing digits and check again
          const strippedType = typePart.replace(/\d+$/, '');
          const lowerStripped = strippedType.toLowerCase();
          const fixedType = ER_TYPE_MAP[lower] ?? ER_TYPE_MAP[lowerStripped] ?? strippedType;
          return `${indent}${fixedType}${rest}`;
        }
      );
      // Remove inline string annotations in quotes (e.g.  string name PK "the user's name")
      line = line.replace(/\s+"[^"]*"$/, '');
    }

    if (isSequence) {
      // Replace & → "and" in message text (anything after the colon)
      line = line.replace(/(:\s*.*)&/, '$1and');
      // Replace raw double-quotes in message text with single quotes
      line = line.replace(/(:\s*.*?)"/g, "$1'");
    }

    if (isEr) {
      // Fix #4: relationship lines with an empty label after the colon
      // Pattern: ENTITY1 <relationship> ENTITY2 :   ← label is missing
      // Mermaid requires a non-empty label; inject a sensible default.
      line = line.replace(
        /^(\s*\w[\w\s]*\|[|o]{0,2}[-]{1,2}[|o]{0,2}\{?\s*\w+\s*:\s*)$/,
        (match) => `${match.trim()} relates_to`
      );
    }

    return line;
  });

  // Remove classDef / class assignments when subgraphs are present
  const hasSubgraph = sanitizedLines.some(l => /^\s*subgraph\b/i.test(l));
  const result = hasSubgraph
    ? sanitizedLines.filter(l => !/^\s*(classDef\s|class\s+\S+\s+\S)/.test(l))
    : sanitizedLines;

  return result.join('\n');
}
