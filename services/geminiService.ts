import { GoogleGenAI, Type } from "@google/genai";
import { Point3D } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is assumed to be available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateShapePoints = async (description: string, count: number = 1000): Promise<Point3D[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found. Returning empty shape.");
    return [];
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // We ask Gemini to mathematically construct the shape and return points
    // This showcases its reasoning and JSON output capabilities.
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