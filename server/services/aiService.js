const { GoogleGenerativeAI } = require('@google/generative-ai');

let _genAI = null;

// ✅ MODEL SETUP (FIXED)
const model = () => {
  if (!_genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set.');
    }

    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return _genAI.getGenerativeModel({
    // ✅ UPDATED MODEL (LATEST WORKING)
    model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',

    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048
    }
  });
};

// ✅ JSON PARSER (ROBUST)
const parseJSON = (text) => {
  if (!text) throw new Error('Empty AI response.');

  const clean = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```$/im, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch (_) {
    const match = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) return JSON.parse(match[1]);

    throw new Error(`No JSON found. Raw: ${text.slice(0, 200)}`);
  }
};

// ✅ RETRY LOGIC (IMPROVED)
const retry = async (fn, retries = 2, delay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      console.error("AI ERROR:", e.message);

      if (i === retries || ![429, 503].includes(e.status)) {
        throw e;
      }

      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
};

// ✅ GENERATE QUESTIONS
exports.generateQuestions = async (role, difficulty, experience, count = 5) => {
  const n = Math.min(Math.max(parseInt(count) || 5, 1), 10);

  const res = await retry(() =>
    model().generateContent(`
You are an expert technical interviewer.

Generate exactly ${n} interview questions for a ${role} role.
Difficulty: ${difficulty} | Experience: ${experience}

Rules:
- Mix of technical, conceptual, behavioral, situational
- Progressive difficulty

RETURN ONLY JSON ARRAY:
[{"question":"...","type":"technical","hint":"..."}]
`)
  );

  const parsed = parseJSON(res.response.text());

  if (!Array.isArray(parsed)) {
    throw new Error('AI did not return an array.');
  }

  return parsed.map((q, i) => ({
    question: q.question || `Question ${i + 1}`,
    type: q.type || 'technical',
    hint: q.hint || ''
  }));
};

// ✅ EVALUATE ANSWER
exports.evaluateAnswer = async (question, answer, role, difficulty) => {
  const res = await retry(() =>
    model().generateContent(`
You are an expert interviewer.

Role: ${role}
Difficulty: ${difficulty}

Question: "${question}"
Answer: "${answer || 'No answer provided'}"

Score each (0–10):
- technical
- communication
- confidence

RETURN ONLY JSON:
{
  "scores":{"technical":7,"communication":8,"confidence":6,"overall":7},
  "feedback":"2-3 sentences",
  "followUpQuestion":"optional"
}
`)
  );

  const p = parseJSON(res.response.text());

  const clamp = (v) => Math.min(10, Math.max(0, parseInt(v) || 0));

  const t = clamp(p.scores?.technical);
  const c = clamp(p.scores?.communication);
  const cf = clamp(p.scores?.confidence);

  return {
    scores: {
      technical: t,
      communication: c,
      confidence: cf,
      overall:
        p.scores?.overall != null
          ? clamp(p.scores.overall)
          : Math.round((t + c + cf) / 3)
    },
    feedback: p.feedback || 'No feedback provided.',
    followUpQuestion: p.followUpQuestion || ''
  };
};

// ✅ FINAL REPORT
exports.generateFinalReport = async (role, difficulty, qaHistory) => {
  const answered = qaHistory.filter((q) => q.answer?.trim());

  if (!answered.length) {
    return {
      overallScore: 0,
      summary: 'No answers provided.',
      strengths: [],
      weaknesses: ['No answers'],
      suggestions: []
    };
  }

  const transcript = answered
    .map(
      (q, i) => `
Q${i + 1}: ${q.question}
Answer: ${q.answer}
T=${q.scores.technical} C=${q.scores.communication} Conf=${q.scores.confidence} Overall=${q.scores.overall}
`
    )
    .join('\n\n');

  const res = await retry(() =>
    model().generateContent(`
You are a career coach reviewing a mock interview.

Role: ${role}
Difficulty: ${difficulty}
Questions answered: ${answered.length}

${transcript}

RETURN ONLY JSON:
{
  "overallScore":72,
  "summary":"2-3 sentences",
  "strengths":["..."],
  "weaknesses":["..."],
  "suggestions":["..."]
}
`)
  );

  const p = parseJSON(res.response.text());

  return {
    overallScore: Math.min(100, Math.max(0, parseInt(p.overallScore) || 0)),
    summary: p.summary || 'Interview completed.',
    strengths: Array.isArray(p.strengths) ? p.strengths : [],
    weaknesses: Array.isArray(p.weaknesses) ? p.weaknesses : [],
    suggestions: Array.isArray(p.suggestions) ? p.suggestions : []
  };
};