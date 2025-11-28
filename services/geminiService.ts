import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Handle potential missing prefix or different formats
      const base64String = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image using a multimodal model to generate a prompt description.
 */
export const analyzeImageForPrompt = async (file: File): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(file);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          imagePart,
          { text: "Analyze this image and provide a highly detailed, artistic prompt used to generate it. Focus on style, lighting, camera angle, and subject details. Return ONLY the prompt text." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("VLM Analysis Error:", error);
    throw new Error("Failed to analyze image.");
  }
};

/**
 * Simple concurrency limiter to prevent browser freezing or rate limiting
 * when generating large batches (e.g., 500 images).
 */
async function runConcurrent<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then(result => {
      results.push(result);
    });
    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises (simple approach, works for sequential push)
      // For a robust queue we'd manage the array index, but Promise.race keeps us under limit roughly.
      // A better approach for strict limit:
    }
  }
  // Wait for rest
  await Promise.all(executing);
  return results;
}

// Robust pool executor
async function asyncPool<T>(poolLimit: number, iterable: any[], iteratorFn: (item: any) => Promise<T>) {
  const ret: Promise<T>[] = [];
  const executing: Promise<any>[] = [];
  
  for (const item of iterable) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (poolLimit <= iterable.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}


/**
 * Generates images using Gemini Flash Image model.
 * Supports multiple reference images and batch count up to 500.
 */
export const generateImageBatch = async (
  prompt: string,
  aspectRatio: AspectRatio,
  referenceImages: File[],
  totalImages: number
): Promise<string[]> => {
  try {
    // 1. Prepare Reference Images (once)
    const referenceParts = await Promise.all(referenceImages.map(file => fileToGenerativePart(file)));

    // 2. Define the single generation task
    const generateSingle = async (index: number): Promise<string> => {
      const parts: any[] = [...referenceParts];
      // Add a slight variation to prompt seed if possible, or just rely on model randomness.
      // We append a hidden comment to ensure unique requests if needed, but the model has internal seed.
      parts.push({ text: prompt }); 

      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
              imageConfig: { aspectRatio: aspectRatio }
            }
          });
    
          if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
              }
            }
          }
          return ""; // Fail silently for this one to not crash batch
      } catch (e) {
          console.warn(`Failed to generate image ${index}`, e);
          return "";
      }
    };

    // 3. Create Task Array
    // Limit concurrency to 3 to avoid browser memory issues with large base64 strings and rate limits
    const tasks = Array.from({ length: totalImages }, (_, i) => i);
    
    const results = await asyncPool(3, tasks, generateSingle);
    
    // Filter out failed ones
    return results.filter(r => r !== "");

  } catch (error) {
    console.error("Batch Generation Error:", error);
    throw error;
  }
};