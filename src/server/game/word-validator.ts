import { getMinWordLength } from "@/game/constants";
import type { WordEntry } from "@/game/types";
import { isEnglishWord } from "./dictionary";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateWord(
  word: string,
  letter: string,
  existingWords: WordEntry[]
): ValidationResult {
  const cleaned = word.trim().toLowerCase();
  const targetLetter = letter.toLowerCase();

  if (!cleaned) {
    return { valid: false, reason: "Empty word" };
  }

  if (!/^[a-z]+$/.test(cleaned)) {
    return { valid: false, reason: "Words must contain only letters" };
  }

  if (!cleaned.startsWith(targetLetter)) {
    return {
      valid: false,
      reason: `Word must start with "${letter.toUpperCase()}"`,
    };
  }

  const minLength = getMinWordLength(letter);
  if (cleaned.length < minLength) {
    return {
      valid: false,
      reason: `Word must be at least ${minLength} characters for letter "${letter.toUpperCase()}"`,
    };
  }

  if (!isEnglishWord(cleaned)) {
    return { valid: false, reason: `"${cleaned}" is not a recognized English word` };
  }

  // Check for exact duplicates
  if (existingWords.some((w) => w.word === cleaned)) {
    return { valid: false, reason: "Word already played" };
  }

  // Check for word extensions (e.g., if "run" exists, "runs" is invalid)
  for (const existing of existingWords) {
    if (cleaned.startsWith(existing.word) || existing.word.startsWith(cleaned)) {
      return {
        valid: false,
        reason: `"${cleaned}" is too similar to already-played "${existing.word}"`,
      };
    }
  }

  return { valid: true };
}
