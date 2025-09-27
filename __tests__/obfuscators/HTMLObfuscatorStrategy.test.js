import { HTMLObfuscatorStrategy } from "../../src/classes/obfuscators/HTMLObfuscatorStrategy.js";

describe("HTMLObfuscatorStrategy", () => {
  test("returns the same string for now (placeholder behavior)", () => {
    const strategy = new HTMLObfuscatorStrategy();
    const input = "<p>Description: <span contenteditable=\"false\" class=\"qbd-output qbd-output-widget\">UnitOperation.description</span></p>";
    const result = strategy.obfuscateString(input);
    expect(result).toBe(input);
  });
});
