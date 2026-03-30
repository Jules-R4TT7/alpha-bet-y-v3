import { describe, it, expect } from "vitest";
import { scoreWord, getLetterTier, getMinWordLength } from "./constants";

describe("scoreWord", () => {
  it("scores short words (<=5 chars) as 1 point", () => {
    expect(scoreWord("hello")).toBe(1);
    expect(scoreWord("cat")).toBe(1);
  });

  it("scores medium words (6-8 chars) as 2 points", () => {
    expect(scoreWord("running")).toBe(2);
    expect(scoreWord("absolute")).toBe(2);
  });

  it("scores long words (9+ chars) as 3 points", () => {
    expect(scoreWord("alligator")).toBe(3);
    expect(scoreWord("extraordinary")).toBe(3);
  });
});

describe("getLetterTier", () => {
  it("classifies easy letters", () => {
    expect(getLetterTier("S")).toBe("easy");
    expect(getLetterTier("T")).toBe("easy");
  });

  it("classifies brutal letters", () => {
    expect(getLetterTier("Q")).toBe("brutal");
    expect(getLetterTier("Z")).toBe("brutal");
  });

  it("handles lowercase", () => {
    expect(getLetterTier("s")).toBe("easy");
  });
});

describe("getMinWordLength", () => {
  it("returns 5 for easy letters", () => {
    expect(getMinWordLength("S")).toBe(5);
  });

  it("returns 4 for medium letters", () => {
    expect(getMinWordLength("E")).toBe(4);
  });
});
