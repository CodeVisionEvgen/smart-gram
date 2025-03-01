import { Logger } from "../utils/logger.util";
import { Config } from "../utils/env.util";
import fs from "fs";

export class FsModule {
  constructor() {}

  onModuleInit() {
    Logger.info(`Fs module launched`);

    if (!fs.existsSync(Config.get("TEMP_DIR") || "")) {
      fs.mkdirSync(Config.get("TEMP_DIR") || "");
    }
  }
}
