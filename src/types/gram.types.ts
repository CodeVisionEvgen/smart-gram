import { Api } from "telegram";
import { EntityLike } from "telegram/define";

export type Metadata = {
  chat: EntityLike | undefined;
  senderId?: number;
  senderItsMe: boolean;
};
