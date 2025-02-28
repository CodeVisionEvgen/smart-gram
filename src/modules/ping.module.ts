import express from "express";
import { Logger } from "../utils/logger.util";
import { Config } from "../utils/env.util";

export class PingModule {
  private app = express();
  constructor() {
    this.app.get("/ping", (req, res) => {
      res.send("pong");
    });
  }

  onModuleInit() {
    this.app.listen(Config.get("PING_PORT"), () => {
      Logger.info(`Ping server listening on port ${Config.get("PING_PORT")}`);
    });
  }
}
