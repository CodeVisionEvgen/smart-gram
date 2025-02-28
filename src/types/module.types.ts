export class Module {
  onModuleInit?: () => void;
  service?: any[];
  controller?: any[];
  key: string;
  constructor(key: string) {
    this.key = key;
  }
}
