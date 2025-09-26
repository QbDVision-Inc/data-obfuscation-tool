import { HTMLObfuscatorStrategy } from "../../src/classes/obfuscators/HTMLObfuscatorStrategy.js";

describe("HTMLObfuscatorStrategy", () => {
  test("returns the same string for now (placeholder behavior)", () => {
    const strategy = new HTMLObfuscatorStrategy();
    const input = "<div class=\"content\">Hello World</div>";
    const result = strategy.obfuscateString(input);
    expect(result).toBe(input);
  });
});
