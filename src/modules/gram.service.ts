import { TelegramClient, Api } from "telegram-timeout-fix";
import { StringSession } from "telegram-timeout-fix/sessions";
import { Config } from "../utils/env.util";
import { Logger } from "../utils/logger.util";
//@ts-expect-error
import * as input from "input";
import { NewMessage, NewMessageEvent } from "telegram-timeout-fix/events";
import { Metadata } from "../types/gram.types";

export class GramService {
  static MAX_CONTENT_LENGTH = 4096;
  private stringSession = new StringSession(
    String(Config.get("TELEGRAM_SESSION"))
  );
  private apiHash = String(Config.get("TELEGRAM_API_HASH"));
  private apiId = Number(Config.get("TELEGRAM_API_ID"));
  private client: TelegramClient;
  constructor() {
    this.client = new TelegramClient(
      this.stringSession,
      this.apiId,
      this.apiHash,
      {
        connectionRetries: 5,
      }
    );
  }

  async start() {
    try {
      await this.client.start({
        phoneNumber: async () => Config.get("TELEGRAM_PHONE") || "",
        password: async () => Config.get("TELEGRAM_PASS") || "",
        phoneCode: async () => await input.text("code: "),
        onError: (err) => {
          Logger.error(err.message, err);
        },
      });
      const session = this.stringSession.save();
      // Logger.info(`Session: ${session}`);
      Logger.info("Telegram client started");
    } catch (err) {
      if (err instanceof Error) {
        Logger.error(err.message, err);
      }
    }
  }

  get Api() {
    return Api;
  }

  onMessage = (cb: (event: NewMessageEvent, metadata: Metadata) => void) => {
    this.client.addEventHandler(async (event: NewMessageEvent) => {
      const client = await this.getClient();
      const me = await client.getMe();
      const chat = await event.getInputChat();
      const message = event.message;
      const senderId = message.senderId?.valueOf();
      const myId = me.id.valueOf();
      cb(event, { senderId, chat, senderItsMe: myId == senderId });
    }, new NewMessage({}));
  };

  async getClient() {
    return this.client;
  }
}
