import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const SYSTEM_INSTRUCTION = `You are a professional system designer and diagram architect.
Your task is to convert the user's natural language request into a highly professional, beautifully structured generic diagram schema (like a custom draw.io or Eraser diagram).

Return ONLY a raw JSON object — no markdown, no code fences, no explanation.

The JSON must follow this exact schema:
{
  "diagramType": "flowchart" | "mindmap" | "architecture" | "concept_map",
  "title": "A highly descriptive, professional title",
  "nodes": [
    {
      "id": "unique_snake_case_id",
      "label": "The main text label of the node (short, concise, max 4 words)",
      "shape": "rounded" | "rect" | "circle" | "diamond" | "hexagon" | "parallelogram" | "cylinder" | "triangle" | "cloud" | "text",
      "icon": "A single highly relevant emoji matching the node's function (e.g. 💻, 🧠, 🏢, 🚀, ⚙️, 📦, 🔒, 👥, etc.)",
      "fill": "Curated dark background color in HEX matching its role (e.g. Slate: #1e293b, Deep Indigo: #1e1b4b, Green: #14532d, Red: #7f1d1d, Gold: #451a03, Blue: #0c4a6e)",
      "stroke": "Curated matching bright border color in HEX (e.g. Gold border: #f59e0b, Blue: #3b82f6, Gold/Gold: #fbbf24, Green: #10b981, Purple: #a855f7)",
      "width": 140, // standard width. Use 100 for circle, 120 for diamond, 140 for others
      "height": 60  // standard height. Use 100 for circle, 80 for diamond, 60 for others
    }
  ],
  "edges": [
    {
      "id": "e_unique_id",
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "relationship label (optional, clear, short)",
      "type": "default" | "dashed" | "thick",
      "animated": true | false
    }
  ]
}

Rules:
1. Every node must have a unique "id" in snake_case.
2. Select appropriate shapes:
   - Use "cylinder" for databases, storage, historical archives.
   - Use "circle" or "hexagon" for actors, users, external systems, or main nodes.
   - Use "diamond" for decision logic, branch points, or validation.
   - Use "parallelogram" for input/output data flows.
   - Use "cloud" for external APIs, networks, or cloud providers.
   - Use "rounded" or "rect" for processes, steps, and general services.
3. Be highly creative with emojis! Pick specific emojis matching the node's semantic role.
4. Keep the nodes count clean and comprehensive (between 5 and 15 nodes max).
5. Colors must look premium. Always pair a rich, dark background "fill" with a bright, matching neon "stroke" border. Ensure high contrast so text is readable.`;

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Missing GEMINI_API_KEY.' }, { status: 500 });
  }

  try {
    const { prompt } = await request.json();
    if (!prompt?.trim()) {
      return Response.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 3500, topP: 0.95 },
    });

    let raw = result.response.text().trim();
    raw = raw.replace(/^```[a-zA-Z0-9]*\n?/i, '').replace(/\n?```$/i, '').trim();

    console.log('\n[generate-diagram] Raw generic diagram response:\n', raw.slice(0, 500));

    const parsed = JSON.parse(raw);

    const nodes = (parsed.nodes || []).map((n, i) => ({
      id: String(n.id || `node_${i}`),
      label: String(n.label || 'Node'),
      shape: n.shape || 'rounded',
      icon: n.icon || '',
      fill: n.fill || '#1e293b',
      stroke: n.stroke || '#6366f1',
      textColor: '#f1f5f9',
      fontSize: 13,
      width: Number(n.width || 140),
      height: Number(n.height || 60),
    }));

    const edges = (parsed.edges || []).map((e, i) => ({
      id: String(e.id || `e_${i}`),
      source: String(e.source || ''),
      target: String(e.target || ''),
      label: String(e.label || ''),
      dashed: e.type === 'dashed',
      thick: e.type === 'thick',
      animated: Boolean(e.animated),
      strokeColor: '#4f5d7e',
    })).filter(e => e.source && e.target);

    return Response.json({
      diagramType: parsed.diagramType || 'flowchart',
      title: parsed.title || 'Generic Diagram',
      nodes,
      edges,
    });
  } catch (err) {
    console.error('[generate-diagram] Error:', err.message);
    return Response.json({ error: err.message || 'Generation failed.' }, { status: 500 });
  }
}
