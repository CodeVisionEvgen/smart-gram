import { NewMessageEvent } from "telegram-timeout-fix/events";
import { GramService } from "./gram.service";
import { AiService } from "./ai.service";
import { StackService } from "./stack.service";
import { Metadata } from "../types/gram.types";
import * as cowsay from "cowsay";

export class GramModule {
  onMessageHandlers: ((...params: any) => void | Promise<void>)[] = [];
  gramService = new GramService();
  stackService = new StackService();
  aiService = new AiService();
  async onModuleInit() {
    await this.gramService.start();

    this.onMessageHandlers = this.onMessageHandlers.concat([
      this.aiResponse,
      this.gradientHeart,
      this.moo,
    ]);
    this.gramService.onMessage(async (event, metadata) => {
      await Promise.all(
        this.onMessageHandlers.map((handler) => handler(event, metadata))
      );
    });
  }

  private moo = async (event: NewMessageEvent, metadata: Metadata) => {
    const client = await this.gramService.getClient();
    const { senderItsMe, chat, senderId } = metadata;

    if (!chat || !senderItsMe || !senderId) return;

    const { message: text } = event.message;
    if (!text.toLowerCase().startsWith("moo")) return;

    const say = cowsay.say({ text: text.toLowerCase().split("moo")[1] });

    await client.editMessage(chat, {
      message: event.message.id,
      text: "Корова каже:\n" + "<pre>" + say + "</pre>",
      parseMode: "html",
    });
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
    if (!text.includes("❤️")) return;

    let count = 0;
    while (count < 10) {
      count++;
      for (const heart of hearts) {
        await new Promise((res) => setTimeout(res, 200));
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
