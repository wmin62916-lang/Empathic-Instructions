
import { GoogleGenAI, Type } from "@google/genai";
import { Card, CardType, Rarity } from "../types";

// Helper to safely get AI instance without crashing if process is undefined (local run)
const getAI = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return null;
};

export const generateCardFromPrompt = async (prompt: string): Promise<Card | null> => {
  const ai = getAI();
  if (!ai) {
    console.warn("AI capabilities unavailable: Missing API Key");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Design a card for a psychological counseling game. 
      Context: The goal is to improve a client's Mood (Axis 1: Sad to Happy) and Energy (Axis 2: Anxious to Hopeful).
      User concept: "${prompt}".
      
      Determine:
      - moodEffect: Integer (-50 to 50). Positive = Happier.
      - energyEffect: Integer (-50 to 50). Positive = More Hopeful/Energetic. Negative = Calmer/Less Anxious.
      - type: EXPERIENCE (Sensory/Strong) or DIALOGUE (Verbal/Instant).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            moodEffect: { type: Type.INTEGER },
            energyEffect: { type: Type.INTEGER },
            type: { type: Type.STRING, enum: [CardType.EXPERIENCE, CardType.DIALOGUE] },
            rarity: { type: Type.STRING, enum: [Rarity.COMMON, Rarity.RARE, Rarity.LEGENDARY] },
            imageKeyword: { type: Type.STRING, description: "English keyword for image search" }
          },
          required: ["name", "description", "moodEffect", "energyEffect", "type", "rarity", "imageKeyword"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        id: `gen-${Date.now()}`,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to generate card:", error);
    return null;
  }
};

export const getStrategicTip = async (mood: number, energy: number, playsLeft: number): Promise<string> => {
    const ai = getAI();
    if (!ai) return "请仔细观察客人的情绪波动。(离线模式)";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a senior psychological supervisor. 
            Client State: Mood ${mood} (-100 Sad, 100 Happy), Energy ${energy} (-100 Anxious, 100 Hopeful). 
            Actions remaining this turn: ${playsLeft}.
            Target: Both > 75.
            Give 1 short sentence of advice (in Chinese).`,
        });
        return response.text || "请仔细观察客人的情绪波动。";
    } catch (e) {
        return "尝试平衡两个维度的数值。";
    }
}

export const getRoundEndDialogue = async (mood: number, energy: number): Promise<string> => {
    const ai = getAI();
    if (!ai) return "...";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Write a one-sentence quote spoken by a therapy client based on their state.
            Mood: ${mood} (Negative=Sad, Positive=Happy).
            Energy: ${energy} (Negative=Anxious, Positive=Hopeful).
            Language: Chinese.
            Example if Sad/Anxious: "我感觉透不过气来，一切都很灰暗..."
            Example if Happy/Hopeful: "我好像看到了光，谢谢你。"
            `,
        });
        return response.text || "...";
    } catch (e) {
        return "...";
    }
}
