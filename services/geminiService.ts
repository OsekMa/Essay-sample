
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateEssayOutline = async (topicTitle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a high-level academic essay outline for the topic: "${topicTitle}". 
      Format it in Markdown with Introduction (Thesis), Body Paragraphs, and Conclusion. 
      Also provide 3 advanced vocabulary words related to this topic.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating essay outline:", error);
    return "Failed to generate AI outline. Please check your API key.";
  }
};
