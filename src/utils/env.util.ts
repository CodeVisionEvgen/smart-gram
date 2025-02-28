import { EnvKeysType } from "../types/env.types";

export { config as EnableConfig } from "dotenv";

export class Config {
  /**
   * get param from env
   * @param name key of env value
   */
  static get(name: EnvKeysType) {
    return process.env[name];
  }
}
