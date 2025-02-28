import { Api } from "telegram-timeout-fix";
import { EntityLike } from "telegram-timeout-fix/define";

export type Metadata = {
  chat: EntityLike | undefined;
  senderId?: number;
  senderItsMe: boolean;
};
