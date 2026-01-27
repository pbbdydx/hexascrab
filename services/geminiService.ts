
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client using the API key from environment variables.
// Always use the named parameter object and direct reference to process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ValidationResult {
  isValid: boolean;
  scoreExplanation: string;
  message?: string;
}

export const validateWords = async (words: string[]): Promise<boolean> => {
  if (words.length === 0) return false;
  
  try {
    // Generate content using the recommended model for basic text tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Determine if the following strings are valid English words for a Scrabble-like game: ${words.join(', ')}. Return valid: true if ALL words are valid, false otherwise.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["valid"]
        }
      }
    });

    // Extract generated text from the response's .text property (getter, not a method).
    const jsonStr = response.text || '{"valid": false}';
    const result = JSON.parse(jsonStr);
    return result.valid;
  } catch (error) {
    console.error("Gemini Validation Error:", error);
    // Fallback to true to allow gameplay to proceed if the validation service fails.
    return true; 
  }
};

export const getAiMove = async (rack: string[], boardState: string): Promise<{word: string, startQ: number, startR: number, direction: number}> => {
  // This would be for the Stretch goal AI opponent
  return { word: '', startQ: 0, startR: 0, direction: 0 };
};
