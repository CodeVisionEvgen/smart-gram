import { Content } from "@google/generative-ai";
export class StackService {
  private stack: Content[] = [];

  private rules: Content = {
    role: "user",
    parts: [
      {
        text: `
              Ти маєш відповідати на любі задані питанні, Головне шоб не російською мовою.
              `,
      },
    ],
  };

  push(item: Content): void {
    this.stack.push(item);
  }

  get() {
    return [this.rules, ...this.stack];
  }

  clear(): void {
    this.stack = [];
  }
}
