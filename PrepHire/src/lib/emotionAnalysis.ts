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
  attention?: "focused" | "drift" | "absent";
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
  stressPattern: "Escalating" | "Managed" | "Fluctuating";
  dominantEmotion: string;
  focusRate: number;
  engagementLevel: "Sustained" | "Intermittent" | "Distracted";
  interpretation: string;
  suggestions: string[];
  // Advanced Temporal Data
  trends: {
    fear: { early: number; mid: number; late: number };
    happy: { early: number; mid: number; late: number };
  };
  events: { time: string; type: "fear_spike" | "confidence_spike" | "energy_dip" | "attention_drift" }[];
  transitions: number;
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

  let totalVariation = 0;
  for (let i = 1; i < scores.length; i++) {
    totalVariation += Math.abs(scores[i].neutral - scores[i - 1].neutral);
  }
  const avgVariation = readings.length > 1 ? totalVariation / (readings.length - 1) : 0;

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

export function classifySession(readings: EmotionReadingDoc[]): SessionMetrics {
  if (readings.length === 0) {
    throw new Error("No readings provided for classification");
  }

  // 1. Group-level basic metrics
  const globalMetrics = computePerQuestionMetrics(readings);
  
  // 2. Dominant emotion
  const emotionCounts: Record<string, number> = {};
  readings.forEach(r => emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1);
  const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
    emotionCounts[a] > emotionCounts[b] ? a : b
  );

  // 3. Attention Analysis
  const focusCount = readings.filter(r => r.attention === 'focused').length;
  const focusRate = Math.round((focusCount / readings.length) * 100);
  
  let engagementLevel: SessionMetrics['engagementLevel'] = "Distracted";
  if (focusRate > 80) engagementLevel = "Sustained";
  else if (focusRate > 50) engagementLevel = "Intermittent";

  // 4. Phase Analysis (Temporal Reasoning)
  const thirds = Math.floor(readings.length / 3);
  const early = readings.slice(0, thirds || 1);
  const mid = readings.slice(thirds, (2 * thirds) || 2);
  const late = readings.slice(2 * thirds);

  const getAvg = (arr: EmotionReadingDoc[], key: keyof EmotionScores) => 
    arr.reduce((acc, r) => acc + r.scores[key], 0) / arr.length;

  const trends = {
    fear: {
      early: getAvg(early, 'fear'),
      mid: getAvg(mid, 'fear'),
      late: getAvg(late, 'fear')
    },
    happy: {
      early: getAvg(early, 'happy'),
      mid: getAvg(mid, 'happy'),
      late: getAvg(late, 'happy')
    }
  };

  // 5. Event Detection (Spikes)
  const events: SessionMetrics['events'] = [];
  readings.forEach((r, i) => {
    if (r.scores.fear > 70) {
      events.push({ time: r.timestamp, type: "fear_spike" });
    } else if (r.scores.happy > 70) {
      events.push({ time: r.timestamp, type: "confidence_spike" });
    } else if (r.scores.neutral < 10 && r.scores.happy < 10) {
      events.push({ time: r.timestamp, type: "energy_dip" });
    } else if (r.attention === 'drift') {
      events.push({ time: r.timestamp, type: "attention_drift" });
    }
  });

  // 6. Transition Analysis (Stability)
  let transitions = 0;
  for (let i = 1; i < readings.length; i++) {
    if (readings[i].emotion !== readings[i - 1].emotion) {
      transitions++;
    }
  }

  // 7. Classification Logic
  const emotionalStability: "Stable" | "Volatile" = transitions < (readings.length / 4) ? "Stable" : "Volatile";
  
  let confidenceLevel: "High" | "Moderate" | "Low" = "Low";
  if (globalMetrics.confidenceScore > 60) confidenceLevel = "High";
  else if (globalMetrics.confidenceScore > 40) confidenceLevel = "Moderate";

  let stressPattern: "Escalating" | "Managed" | "Fluctuating" = "Managed";
  if (trends.fear.late > trends.fear.early + 15) stressPattern = "Escalating";
  else if (Math.max(trends.fear.early, trends.fear.mid, trends.fear.late) > Math.min(trends.fear.early, trends.fear.mid, trends.fear.late) + 20) {
    stressPattern = "Fluctuating";
  }

  const baseSession: Omit<SessionMetrics, "interpretation" | "suggestions"> = {
    emotionalStability,
    confidenceLevel,
    stressPattern,
    dominantEmotion,
    focusRate,
    engagementLevel,
    trends,
    events: events.slice(0, 5), // Limit to top 5 events
    transitions
  };

  return {
    ...baseSession,
    interpretation: buildInterpretation(baseSession),
    suggestions: generateSuggestions(baseSession),
  };
}

export function buildInterpretation(session: Omit<SessionMetrics, "interpretation" | "suggestions">): string {
  let text = `Your overall behavioral state was **${session.emotionalStability.toLowerCase()}**. `;
  
  // Focus logic
  if (session.focusRate > 85) {
    text += "You maintained excellent eye contact and focus throughout the session. ";
  } else if (session.focusRate < 60) {
    text += "We noticed frequent eye-contact drift, which can sometimes be interpreted as a lack of confidence. ";
  }

  // Phase-based interpretation
  if (session.trends.fear.early > 40 && session.trends.fear.late < 25) {
    text += "You showed initial nervousness but successfully stabilized and gained confidence as the interview progressed. ";
  } else if (session.trends.fear.late > session.trends.fear.early + 15) {
    text += "We noted that your stress levels increased towards the end of the session. ";
  } else if (session.trends.happy.late > session.trends.happy.early + 10) {
    text += "Your positive engagement significantly improved during the latter half of the interview. ";
  } else {
    text += `You maintained a ${session.confidenceLevel.toLowerCase()} confidence level throughout. `;
  }

  if (session.transitions > 15) {
    text += "Your high frequency of emotional transitions suggests some underlying performance anxiety.";
  } else {
    text += `Your most consistent state was ${session.dominantEmotion}.`;
  }
  
  return text;
}

function generateSuggestions(session: Omit<SessionMetrics, "interpretation" | "suggestions">): string[] {
  const suggestions: string[] = [];

  if (session.focusRate < 75) {
    suggestions.push("Try to look directly at the camera while speaking. This mimics eye contact and builds trust with the interviewer.");
  }

  if (session.stressPattern === "Escalating") {
    suggestions.push("Focus on breathing techniques during the final minutes to prevent stress from building up.");
  }

  if (session.trends.fear.early > 50) {
    suggestions.push("Try a 'power pose' or a 2-minute meditation before your next session to reduce initial startup anxiety.");
  }

  if (session.transitions > 20) {
    suggestions.push("Your expressions shifted rapidly. Practice holding a composed, neutral expression during technical deep-dives.");
  }

  if (session.events.some(e => e.type === "energy_dip")) {
    suggestions.push("We noticed dips in your engagement. Remember to stay active and responsive even when thinking about tough questions.");
  }

  if (session.confidenceLevel === "Low") {
    suggestions.push("Record your answers and watch them back. Identifying your own non-verbal cues is the fastest way to build natural confidence.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Maintain your current balance of positive engagement and consistent composure.");
  }

  return suggestions.slice(0, 3);
}
