import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

const stripCodeFences = (text) => {
  if (!text) return '';
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
};

const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 6);
};

const normalizeName = (value) => String(value || '').trim();

const toEntityArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entity) => ({
      name: normalizeName(entity?.name),
      attributes: toStringArray(entity?.attributes).slice(0, 8),
    }))
    .filter((entity) => entity.name)
    .slice(0, 8);
};

const toRelationshipArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((relation) => ({
      from: normalizeName(relation?.from),
      to: normalizeName(relation?.to),
      label: normalizeName(relation?.label),
      cardinality: normalizeName(relation?.cardinality),
    }))
    .filter((relation) => relation.from && relation.to)
    .slice(0, 12);
};

const parseModelOutput = (text) => {
  const cleaned = stripCodeFences(text);
  try {
    const parsed = JSON.parse(cleaned);
    return {
      diagramType: parsed.diagramType === 'er' ? 'er' : 'use_case',
      actors: toStringArray(parsed.actors),
      useCases: toStringArray(parsed.useCases),
      entities: toEntityArray(parsed.entities),
      relationships: toRelationshipArray(parsed.relationships),
    };
  } catch {
    return {
      diagramType: 'use_case',
      actors: [],
      useCases: [],
      entities: [],
      relationships: [],
    };
  }
};

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
    const { prompt } = await request.json();

    if (!prompt || !String(prompt).trim()) {
      return Response.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: 'Return strict JSON only. No markdown, no extra text. If user asks for ER/entity relationship diagram return {"diagramType":"er","entities":[{"name":"","attributes":[""]}],"relationships":[{"from":"","to":"","label":"","cardinality":""}],"actors":[],"useCases":[]}. Otherwise return {"diagramType":"use_case","actors":[""],"useCases":[""],"entities":[],"relationships":[]}. Keep names concise.',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: String(prompt) }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
        topP: 1,
      },
    });

    const responseText = result.response.text();
    const { diagramType, actors, useCases, entities, relationships } = parseModelOutput(responseText);

    return Response.json({ diagramType, actors, useCases, entities, relationships, raw: responseText });
  } catch (error) {
    console.error('Gemini generation failed:', error);
    return Response.json({ error: 'Failed to generate output.' }, { status: 500 });
  }
}