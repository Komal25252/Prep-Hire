/**
 * Keyword-based answer evaluator.
 * Used as fallback when Gemini is unavailable and questions came from the mock bank.
 */

interface Keywords {
  must: string[];
  optional: string[];
  synonyms: Record<string, string[]>;
}

interface EvalResult {
  score: number;        // 0-100 (scaled from 0-10)
  strength: string;
  weakness: string;
  suggestion: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveWithSynonyms(word: string, synonyms: Record<string, string[]>): string {
  // If word is a synonym of a main keyword, return the main keyword
  for (const [main, syns] of Object.entries(synonyms)) {
    if (syns.includes(word)) return main;
  }
  return word;
}

export function evaluateWithKeywords(
  userAnswer: string,
  keywords: Keywords
): EvalResult {
  if (!userAnswer?.trim()) {
    return {
      score: 0,
      strength: 'N/A',
      weakness: 'No answer was provided.',
      suggestion: 'Attempt every question — even a partial answer is better than none.',
    };
  }

  const normalized = normalize(userAnswer);
  const words = normalized.split(' ');

  // Deduplicate words to prevent keyword stuffing
  const uniqueWords = new Set(words);

  // Resolve synonyms
  const resolvedWords = new Set(
    Array.from(uniqueWords).map((w) => resolveWithSynonyms(w, keywords.synonyms))
  );

  // Match must keywords (partial match allowed)
  const matchedMust = keywords.must.filter((kw) =>
    Array.from(resolvedWords).some((w) => w.includes(kw) || kw.includes(w))
  );
  const missingMust = keywords.must.filter((kw) => !matchedMust.includes(kw));

  // Match optional keywords
  const matchedOptional = keywords.optional.filter((kw) =>
    Array.from(resolvedWords).some((w) => w.includes(kw) || kw.includes(w))
  );
  const missingOptional = keywords.optional.filter((kw) => !matchedOptional.includes(kw));

  // Score formula: mustScore (0-7) + optionalScore (0-3) = max 10
  const mustScore = keywords.must.length > 0
    ? (matchedMust.length / keywords.must.length) * 7
    : 7;
  const optionalScore = keywords.optional.length > 0
    ? (matchedOptional.length / keywords.optional.length) * 3
    : 3;
  const rawScore = Math.min(mustScore + optionalScore, 10);
  const score = Math.round(rawScore * 10); // scale to 0-100

  // Generate feedback
  const allMissing = [...missingMust, ...missingOptional];

  let strength: string;
  let weakness: string;
  let suggestion: string;

  if (score >= 80) {
    strength = `Covered key concepts: ${matchedMust.join(', ')}.`;
    weakness = allMissing.length > 0 ? `Could also mention: ${allMissing.slice(0, 3).join(', ')}.` : 'No major gaps.';
    suggestion = 'Strong answer. Add a concrete example to make it even more compelling.';
  } else if (score >= 50) {
    strength = matchedMust.length > 0 ? `Mentioned: ${matchedMust.join(', ')}.` : 'Provided some relevant context.';
    weakness = missingMust.length > 0 ? `Missing key concepts: ${missingMust.join(', ')}.` : `Could expand on: ${missingOptional.slice(0, 2).join(', ')}.`;
    suggestion = 'Good start. Focus on covering the core concepts more explicitly.';
  } else {
    strength = matchedMust.length > 0 ? `Touched on: ${matchedMust.join(', ')}.` : 'Attempted an answer.';
    weakness = `Missing essential concepts: ${missingMust.join(', ')}.`;
    suggestion = `Study the core definition and try to include: ${keywords.must.slice(0, 3).join(', ')}.`;
  }

  return { score, strength, weakness, suggestion };
}
