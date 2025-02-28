import { Pattern } from "../types/utils.types";

export const replacePatterns: Pattern[] = [
  [/^ +/g, ""],
  [/\\/g, ""],
  [/#+/g, "#"],
  [/^#\s*(.+)/gm, (_, match) => `📝 *${match.toUpperCase()}*`],
  [/\* \*\*/g, "**"],
  [/^\*/gm, " 🔹 "],
  [/\*\*/g, "*"],
  [/\\\[.*]\\\(.*\\\)/g, (_) => `🔗 ${_}`.replace(/\\/g, "")],
];

export const replacePipeline = (options: {
  patterns: Pattern[];
  text: string;
}) => {
  const codeBlocks: string[] = [];
  const textWithoutCodeBlocks = options.text.replace(
    /```[\s\S]*?```/g,
    (codeBlock) => {
      codeBlocks.push(codeBlock);
      return `{CODE_BLOCK_${codeBlocks.length - 1}}`;
    }
  );

  const processedText = options.patterns.reduce(
    (prev, [regex, replacement]) => {
      if (typeof replacement === "string") {
        return prev.replace(regex, replacement);
      } else {
        return prev.replace(regex, replacement as (...args: any[]) => string);
      }
    },
    textWithoutCodeBlocks
  );

  const formattedCodeBlocks = codeBlocks.map((block) => {
    const lines = block.split("\n");
    return lines
      .map((line, i) => {
        if (i !== 0 && i !== lines.length - 1) {
          return line.replace(/\`/g, "\\`");
        } else {
          return line;
        }
      })
      .join("\n");
  });

  const restoredText = processedText.replace(
    /\\{CODE_BLOCK_(\d+)\\}/g,
    (_, index) => formattedCodeBlocks[+index]
  );
  return restoredText;
};
