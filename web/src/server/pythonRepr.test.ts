import { describe, expect, it } from "vitest";

import { pythonRepr } from "@/server/pythonRepr";

// Expected values were produced with CPython's repr().
describe("pythonRepr", () => {
  it.each([
    ["it's", `"it's"`],
    ['say "hi"', `'say "hi"'`],
    [`both ' and "`, `'both \\' and "'`],
    ["back\\slash", `'back\\\\slash'`],
    ["line\nbreak\ttab", `'line\\nbreak\\ttab'`],
    ["nbsp here", `'nbsp\\xa0here'`],
    ["café – ☃", `'café – ☃'`],
    ["ctrl\u0007", `'ctrl\\x07'`],
    ["zwsp​", `'zwsp\\u200b'`],
  ])("represents the string %j like Python", (input, expected) => {
    expect(pythonRepr(input)).toBe(expected);
  });

  it("represents nested dicts, lists, booleans, None and integers", () => {
    expect(pythonRepr({ a: [true, false, null, 3], b: { c: "d" } })).toBe(
      "{'a': [True, False, None, 3], 'b': {'c': 'd'}}",
    );
  });
});
