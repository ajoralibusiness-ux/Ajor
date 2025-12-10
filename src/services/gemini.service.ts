import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // IMPORTANT: The API key is securely managed by the environment.
    // Do not expose this key in client-side code in a real application.
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
    try {
      const audioPart = {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      };

      const textPart = {
        text: 'Transcribe this audio recording clearly and accurately.',
      };
      
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, audioPart] },
      });

      return response.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      if (error instanceof Error) {
        return `Failed to transcribe. Error: ${error.message}`;
      }
      return 'An unknown error occurred during transcription.';
    }
  }
}
