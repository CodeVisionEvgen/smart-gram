import {
  ChatSession,
  Content,
  FileData,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { Config } from "../utils/env.util";
import { GramService } from "./gram.service";

export class AiService {
  private GenerativeModel: GenerativeModel;
  private FileManager: GoogleAIFileManager;
  constructor() {
    const genAI = new GoogleGenerativeAI(Config.get("GEMINI_KEY") || "");
    this.FileManager = new GoogleAIFileManager(Config.get("GEMINI_KEY") || "");
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

  uploadFile(path: string) {
    return this.FileManager.uploadFile(path, {
      mimeType: "audio/ogg",
    });
  }

  askGemini(prompt: string, history: Content[]) {
    return this.getChat(history).sendMessage(prompt);
  }
  deleteFile(path: string) {
    return this.FileManager.deleteFile(path);
  }
  askGeminiAboutFile(file: FileData) {
    return this.GenerativeModel.generateContent([
      "Transcribe this audio file.",
      {
        fileData: file,
      },
    ]);
  }
}
