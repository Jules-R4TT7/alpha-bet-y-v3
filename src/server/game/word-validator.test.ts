import { describe, it, expect } from "vitest";
import { validateWord } from "./word-validator";

describe("validateWord", () => {
  it("accepts a valid word", () => {
    const result = validateWord("sparkling", "S", []);
    expect(result.valid).toBe(true);
  });

  it("rejects empty word", () => {
    const result = validateWord("", "S", []);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Empty word");
  });

  it("rejects words with non-letter characters", () => {
    const result = validateWord("hello123", "H", []);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Words must contain only letters");
  });

  it("rejects words not starting with the target letter", () => {
    const result = validateWord("apple", "S", []);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("must start with");
  });

  it("rejects words shorter than minimum length", () => {
    // S is easy tier, minWordLength = 5
    const result = validateWord("stop", "S", []);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("at least 5 characters");
  });

  it("accepts words meeting minimum length for easy letters", () => {
    const result = validateWord("start", "S", []);
    expect(result.valid).toBe(true);
  });

  it("accepts shorter words for medium/hard letters", () => {
    // F is medium tier, minWordLength = 4
    const result = validateWord("fish", "F", []);
    expect(result.valid).toBe(true);
  });

  it("rejects duplicate words", () => {
    const result = validateWord("start", "S", [
      { word: "start", points: 1 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Word already played");
  });

  it("rejects word extensions of existing words", () => {
    const result = validateWord("starting", "S", [
      { word: "start", points: 1 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("too similar");
  });

  it("rejects words that are prefixes of existing words", () => {
    const result = validateWord("start", "S", [
      { word: "starting", points: 2 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("too similar");
  });

  it("handles case insensitivity", () => {
    const result = validateWord("START", "s", []);
    expect(result.valid).toBe(true);
  });

  it("trims whitespace", () => {
    const result = validateWord("  start  ", "S", []);
    expect(result.valid).toBe(true);
  });
});
