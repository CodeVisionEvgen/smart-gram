import { NewMessageEvent } from "telegram-timeout-fix/events";
import { GramService } from "./gram.service";
import { AiService } from "./ai.service";
import { StackService } from "./stack.service";
import { Metadata } from "../types/gram.types";
import { FsService } from "./fs.service";
import * as crypto from "crypto";
import * as cowsay from "cowsay";
import { Logger } from "../utils/logger.util";

export class GramModule {
  onMessageHandlers: ((...params: any) => void | Promise<void>)[] = [];
  gramService = new GramService();
  stackService = new StackService();
  aiService = new AiService();
  fsService = new FsService();
  async onModuleInit() {
    await this.gramService.start();

    this.onMessageHandlers = this.onMessageHandlers.concat([
      this.aiResponse,
      this.gradientHeart,
      this.moo,
      this.linearHearts,
      this.speechToText,
    ]);
    this.gramService.onMessage(async (event, metadata) => {
      await Promise.all(
        this.onMessageHandlers.map((handler) => handler(event, metadata))
      );
    });
  }

  private speechToText = async (event: NewMessageEvent, metadata: Metadata) => {
    const client = await this.gramService.getClient();
    const { senderItsMe, chat, senderId } = metadata;

    if (!chat || !senderItsMe || !senderId) return;

    const { message: text } = event.message;
    if (
      !(
        text.toLowerCase().startsWith("text") ||
        text.toLowerCase().startsWith("Text")
      )
    )
      return;

    const replyMsg = await event.message.getReplyMessage();
    if (!replyMsg?.media) return;

    const { media } = replyMsg;
    const buffer = await client.downloadMedia(media);
    if (!buffer) return;
    try {
      const response = await this.aiService.askGeminiAboutFile({
        data: buffer.toString("base64"),
        mimeType: "audio/ogg",
      });

      await client.editMessage(chat, {
        text:
          "Транскрипція голосового повідомлення:\n" +
          `<blockquote>${response.response.text()}</blockquote>`,
        message: event.message.id,
        parseMode: "html",
      });
    } catch (err) {
      Logger.error(err);
      await client.editMessage(chat, {
        text: "Сталася помилка при транскрипції",
        message: event.message.id,
      });
      await client.invoke(
        new this.gramService.Api.messages.SendReaction({
          msgId: replyMsg?.id,
          peer: chat,
          reaction: [
            new this.gramService.Api.ReactionEmoji({ emoticon: "🙊" }),
          ],
        })
      );
    }
  };

  private moo = async (event: NewMessageEvent, metadata: Metadata) => {
    const client = await this.gramService.getClient();
    const { senderItsMe, chat, senderId } = metadata;

    if (!chat || !senderItsMe || !senderId) return;

    const { message: text } = event.message;
    if (
      !(
        text.toLowerCase().startsWith("moo") ||
        text.toLowerCase().startsWith("Moo")
      )
    )
      return;

    const say = cowsay.say({ text: text.split(/moo/i)[1] });

    await client.editMessage(chat, {
      message: event.message.id,
      text: "Корова каже:\n" + "<pre>" + say + "</pre>",
      parseMode: "html",
    });
  };

  private linearHearts = async (event: NewMessageEvent, metadata: Metadata) => {
    const hearts = ["🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "❤️"];
    const { senderItsMe, chat, senderId } = metadata;
    const client = await this.gramService.getClient();

    if (!chat || !senderItsMe || !senderId) return;

    const { message: text } = event.message;
    if (!text.startsWith(">❤️")) return;
    let count = 0;
    while (count < 4) {
      count++;
      await new Promise((res) => setTimeout(res, 400));

      let textHearts = Array.from(
        {
          length: 8,
        },
        () => "❤️"
      );

      await client.editMessage(chat, {
        message: event.message.id,
        text: textHearts.join(""),
      });

      for (let i = 0; i < textHearts.length; i++) {
        textHearts[i] = hearts[i];
        await new Promise((res) => setTimeout(res, 300));

        await client.editMessage(chat, {
          message: event.message.id,
          text: textHearts.join(""),
        });
      }
    }
  };

  private gradientHeart = async (
    event: NewMessageEvent,
    metadata: Metadata
  ) => {
    const hearts = ["🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "❤️"];
    const { senderItsMe, chat, senderId } = metadata;
    const client = await this.gramService.getClient();

    if (!chat || !senderItsMe || !senderId) return;

    const { message: text } = event.message;
    if (!text.startsWith("❤️")) return;

    let count = 0;
    while (count < 10) {
      count++;
      for (const heart of hearts) {
        await new Promise((res) => setTimeout(res, 300));
        try {
          await client.editMessage(chat, {
            message: event.message.id,
            text: heart,
          });
        } catch (error) {}
      }
    }
  };

  private aiResponse = async (event: NewMessageEvent, metadata: Metadata) => {
    const client = await this.gramService.getClient();
    const message = event.message;
    const { message: text } = message;

    const { senderItsMe, chat, senderId } = metadata;

    if (!message.message.startsWith(",") || !chat || !senderItsMe || !senderId)
      return;

    const replyMsg = await message.getReplyMessage();

    this.stackService.push({
      role: "user",
      parts: [
        ...(replyMsg?.message ? [{ text: replyMsg.message }] : []),
        { text },
      ],
    });

    const awaitMessage = await client.sendMessage(chat, { message: "⏳" });

    const history = this.stackService.get();
    const formatedMessage = message.message.replace(/\,/, "");
    const geminiResponse = await this.aiService
      .askGemini(formatedMessage, history)
      .catch(async (err) => {
        await client.invoke(
          new this.gramService.Api.messages.SendReaction({
            msgId: replyMsg?.id || message.id,
            peer: chat,
            reaction: [
              new this.gramService.Api.ReactionEmoji({ emoticon: "🙊" }),
            ],
          })
        );
        await message.delete();
      });

    const response = geminiResponse?.response;

    await awaitMessage.delete();

    if (!response) return;

    const responseText = response.text();

    this.stackService.push({
      role: "model",
      parts: [
        {
          text: responseText,
        },
      ],
    });

    await client.editMessage(chat, {
      message: message.id,
      text: responseText,
      parseMode: "markdownv2",
    });
  };
}
