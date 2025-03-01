import fs from "fs";
import { Config } from "../utils/env.util";
import path from "path";
export class FsService {
  private TEMP_DIR: string;
  constructor() {
    this.TEMP_DIR = Config.get("TEMP_DIR") || "";
  }
  writeFile(name: string, data: string | Buffer): Promise<string> {
    return new Promise((res, rej) => {
      fs.writeFile(path.join(this.TEMP_DIR, name), data, (err) => {
        if (err) rej(err);
        res(path.join(this.TEMP_DIR, name));
      });
    });
  }

  deleteFile(path: string) {
    return new Promise((res, rej) =>
      fs.rm(path, (err) => {
        if (err) rej(err);
        res(true);
      })
    );
  }
}
