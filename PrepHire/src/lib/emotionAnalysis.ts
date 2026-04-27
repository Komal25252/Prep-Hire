export interface EmotionScores {
  anger: number;
  disgust: number;
  fear: number;
  happy: number;
  neutral: number;
  sadness: number;
  surprise: number;
}

export interface EmotionReadingDoc {
  sessionId: string;
  questionIndex: number;
  timestamp: string;
  emotion: string;
  scores: EmotionScores;
}

export interface QuestionMetrics {
  questionIndex: number;
  avgFear: number;
  maxFear: number;
  fearIncrease: number;
  avgVariation: number;
  confidenceScore: number;
}

export interface SessionMetrics {
  emotionalStability: "Stable" | "Volatile";
  confidenceLevel: "High" | "Moderate" | "Low";
  stressPattern: "Escalating" | "Managed";
  dominantEmotion: string;
  interpretation: string;
  suggestions: string[];
}

export function computePerQuestionMetrics(readings: EmotionReadingDoc[]): QuestionMetrics {
  if (readings.length === 0) {
    return {
      questionIndex: -1,
      avgFear: 0,
      maxFear: 0,
      fearIncrease: 0,
      avgVariation: 0,
      confidenceScore: 0,
    };
  }

  const scores = readings.map((r) => r.scores);
  const initialFear = scores[0].fear;
  const fearValues = scores.map((s) => s.fear);
  
  const avgFear = fearValues.reduce((a, b) => a + b, 0) / readings.length;
  const maxFear = Math.max(...fearValues);
  const fearIncrease = maxFear - initialFear;

  // avgVariation: Mean of absolute difference between consecutive scores.neutral values
  let totalVariation = 0;
  for (let i = 1; i < scores.length; i++) {
    totalVariation += Math.abs(scores[i].neutral - scores[i - 1].neutral);
  }
  const avgVariation = readings.length > 1 ? totalVariation / (readings.length - 1) : 0;

  // confidenceScore: Mean of scores.happy + scores.neutral - scores.fear
  const confidenceScore = scores.reduce((acc, s) => acc + (s.happy + s.neutral - s.fear), 0) / readings.length;

  return {
    questionIndex: readings[0].questionIndex,
    avgFear,
    maxFear,
    fearIncrease,
    avgVariation,
    confidenceScore,
  };
}

export function classifySession(metrics: {
  avgVariation: number;
  confidenceScore: number;
  fearIncrease: number;
  dominantEmotion: string;
}): SessionMetrics {
  const emotionalStability: "Stable" | "Volatile" = metrics.avgVariation < 15 ? "Stable" : "Volatile";
  
  let confidenceLevel: "High" | "Moderate" | "Low" = "Low";
  if (metrics.confidenceScore > 60) confidenceLevel = "High";
  else if (metrics.confidenceScore > 40) confidenceLevel = "Moderate";

  const stressPattern: "Escalating" | "Managed" = metrics.fearIncrease > 20 ? "Escalating" : "Managed";

  const baseSession = {
    emotionalStability,
    confidenceLevel,
    stressPattern,
    dominantEmotion: metrics.dominantEmotion,
  };

  return {
    ...baseSession,
    interpretation: buildInterpretation(baseSession),
    suggestions: generateSuggestions(baseSession),
  };
}

export function buildInterpretation(session: Omit<SessionMetrics, "interpretation" | "suggestions">): string {
  let text = `Your overall emotional state was ${session.emotionalStability.toLowerCase()} with a ${session.confidenceLevel.toLowerCase()} level of confidence. `;
  
  if (session.stressPattern === "Escalating") {
    text += "We noticed an increasing pattern of stress during the session. ";
  } else {
    text += "You managed your stress levels well throughout the interview. ";
  }

  text += `Your most frequent emotional state was ${session.dominantEmotion}.`;
  
  return text;
}

function generateSuggestions(session: Omit<SessionMetrics, "interpretation" | "suggestions">): string[] {
  const suggestions: string[] = [];

  // 🔹 Stability-based suggestions
  if (session.emotionalStability === "Volatile") {
    suggestions.push(
      "Your emotional responses fluctuated during the interview. Try slowing down your speech and pausing before answering to maintain composure."
    );
  }

  // 🔹 Confidence-based suggestions
  if (session.confidenceLevel === "Low") {
    suggestions.push(
      "Your confidence levels appeared low. Practice answering common interview questions aloud to build familiarity and confidence."
    );
  } else if (session.confidenceLevel === "Moderate") {
    suggestions.push(
      "You showed moderate confidence. Focus on maintaining consistent eye contact and steady tone to improve further."
    );
  }

  // 🔹 Stress pattern suggestions
  if (session.stressPattern === "Escalating") {
    suggestions.push(
      "Stress increased as the interview progressed. Consider practicing mock interviews under timed conditions to build resilience."
    );
  }

  // 🔹 Combined conditions (Smarter Logic)
  if (session.confidenceLevel === "Low" && session.stressPattern === "Escalating") {
    suggestions.push(
      "Your confidence decreased as stress increased. Practicing under pressure can help you stay composed in challenging situations."
    );
  }

  // 🔹 Dominant emotion suggestions
  if (session.dominantEmotion === "fear") {
    suggestions.push(
      "Frequent signs of nervousness were detected. Try deep breathing techniques before and during the interview."
    );
  }

  if (session.dominantEmotion === "neutral") {
    suggestions.push(
      "You maintained a composed demeanor, but adding slight positive expressions can make you appear more engaging."
    );
  }

  if (session.dominantEmotion === "happy") {
    suggestions.push(
      "Your positive energy is a strength. Ensure it remains consistent throughout the interview."
    );
  }

  // 🔹 Fallback (always give something useful)
  if (suggestions.length === 0) {
    suggestions.push(
      "Overall performance was balanced. Continue practicing to maintain consistency and improve clarity in responses."
    );
  }

  // Limit to top 3 suggestions for better UX
  return suggestions.slice(0, 3);
}
