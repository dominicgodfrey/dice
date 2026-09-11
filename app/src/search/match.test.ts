import { normalize, score, search, tokenScore } from "./match";

describe("normalize", () => {
  it("lowercases, strips accents and punctuation", () => {
    expect(normalize("  Café-Latté! ")).toBe("cafe latte");
  });
});

describe("tokenScore", () => {
  it("ranks exact, prefix, word start, substring, subsequence", () => {
    expect(tokenScore("moodle", "moodle")).toBe(5);
    expect(tokenScore("moo", "moodle")).toBe(4);
    expect(tokenScore("room", "study room")).toBe(3);
    expect(tokenScore("oodl", "moodle")).toBe(2);
    expect(tokenScore("mdl", "moodle")).toBe(1);
    expect(tokenScore("xyz", "moodle")).toBe(0);
  });
  it("does not use subsequence for very short tokens", () => {
    expect(tokenScore("ml", "moodle")).toBe(0);
  });
});

describe("score", () => {
  it("is zero when any token misses", () => {
    expect(score("moodle zzz", ["Moodle", "courses"])).toBe(0);
  });
  it("is zero for an empty query", () => {
    expect(score("  ", ["Moodle"])).toBe(0);
  });
  it("prefers a title match over a keyword match", () => {
    expect(score("laundry", ["Laundry", "washer"])).toBeGreaterThan(
      score("laundry", ["Machines", "laundry"]),
    );
  });
});

describe("search", () => {
  const items = [
    { t: "Moodle", k: ["courses"] },
    { t: "Study rooms", k: ["libcal", "library"] },
    { t: "OneSearch", k: ["library", "books"] },
  ];
  const fields = (i: (typeof items)[number]) => [i.t, ...i.k];

  it("returns matches best first and drops misses", () => {
    expect(search("library", items, fields).map((i) => i.t)).toEqual([
      "Study rooms",
      "OneSearch",
    ]);
  });
  it("keeps original order on ties", () => {
    expect(search("lib", items, fields).map((i) => i.t)).toEqual([
      "Study rooms",
      "OneSearch",
    ]);
  });
  it("returns nothing for an empty query", () => {
    expect(search("", items, fields)).toEqual([]);
  });
});
