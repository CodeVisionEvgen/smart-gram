import {
  ChatSession,
  Content,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import { Config } from "../utils/env.util";
import { GramService } from "./gram.service";

export class AiService {
  private GenerativeModel: GenerativeModel;
  constructor() {
    const genAI = new GoogleGenerativeAI(Config.get("GEMINI_KEY") || "");

    this.GenerativeModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
  }

  private getChat(history: Content[]): ChatSession {
    return this.GenerativeModel.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: GramService.MAX_CONTENT_LENGTH,
        temperature: 1,
      },
    });
  }

  askGemini(prompt: string, history: Content[]) {
    return this.getChat(history).sendMessage(prompt);
  }
}
