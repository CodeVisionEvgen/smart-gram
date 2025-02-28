import { START_APPLICATION_LOG } from "./constants/logs.constants";
import { GramModule } from "./modules/gram.module";
import { PingModule } from "./modules/ping.module";
import { Config, EnableConfig } from "./utils/env.util";
import { Logger } from "./utils/logger.util";
EnableConfig();

async function MainProcess() {
  const isDev = Config.get("NODE_ENV") == "development";
  Logger.info(START_APPLICATION_LOG(isDev));

  const modules = [new GramModule(), new PingModule()];

  for (const module of modules) {
    await module.onModuleInit();
  }
}

MainProcess().catch((err) => Logger.error(err.message, err));
