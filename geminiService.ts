
import { GoogleGenAI } from "@google/genai";

export async function getLessonSuggestions(concept: string, currentContent: string[]) {
  // Always create a new instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a creative elementary teacher's assistant. For the concept "${concept}", based on these items on the whiteboard: [${currentContent.join(', ')}], suggest 3 short, fun interactive activities or mini-games. Keep it very simple for ages 5-10.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble thinking of ideas right now. Try counting the items on the board!";
  }
}

export async function chatWithAI(concept: string, history: { role: 'user' | 'model', text: string }[]) {
  // Always create a new instance right before making an API call to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history.map(h => h.text).join('\n'), // Simplified for this demo
      config: {
        systemInstruction: `You are a friendly classroom assistant for an elementary teacher teaching "${concept}". Provide short, encouraging, and educational responses suitable for children and teachers.`,
      }
    });
    return response.text;
  } catch (error) {
    return "Oops! My brain took a tiny nap. Let's keep learning together!";
  }
}
