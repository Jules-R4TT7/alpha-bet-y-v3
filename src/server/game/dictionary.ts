import words from "an-array-of-english-words";

const dictionary: ReadonlySet<string> = new Set(words);

export function isEnglishWord(word: string): boolean {
  return dictionary.has(word.toLowerCase());
}
