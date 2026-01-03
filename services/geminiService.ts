import { GoogleGenAI, Type } from "@google/genai";
import { Point3D } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateShapePoints = async (description: string, count: number = 1000): Promise<Point3D[]> => {
  try {
    const ai = getAI();
    // Using the recommended model for basic text/JSON tasks
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      I need to visualize a 3D point cloud representing the shape of a "${description}".
      Generate exactly ${count} points distributed evenly on the surface or volume of this shape.
      Normalize the coordinates so they fit within a bounding box of -1.5 to 1.5 on all axes (x, y, z).
      
      Return strictly a JSON object matching the schema.
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
              description: `A list of ${count} 3D coordinates.`,
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
    if (!jsonText) throw new Error("Empty response from Gemini");

    const parsed = JSON.parse(jsonText);
    return parsed.points || [];

  } catch (error) {
    console.error("Gemini Shape Generation Error:", error);
    throw error;
  }
};