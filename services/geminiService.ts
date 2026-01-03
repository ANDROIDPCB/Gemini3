import { GoogleGenAI, Type } from "@google/genai";
import { Point3D } from "../types";

const getApiKey = () => {
  // Safe access to process.env
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

export const generateShapePoints = async (description: string, count: number = 1000): Promise<Point3D[]> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("Gemini API Key is missing. Please set it in your environment variables.");
    throw new Error("API_KEY_MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      I need to visualize a 3D point cloud representing the shape of a "${description}".
      Generate exactly ${count} points distributed evenly on the surface or volume of this shape.
      Normalize the coordinates so they fit within a bounding box of -1.5 to 1.5 on all axes (x, y, z).
      Return strictly a JSON object.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            points: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  z: { type: Type.NUMBER }
                },
                required: ["x", "y", "z"]
              }
            }
          },
          required: ["points"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response");

    const parsed = JSON.parse(jsonText);
    return parsed.points || [];

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};