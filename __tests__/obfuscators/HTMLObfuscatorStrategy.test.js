import { HTMLObfuscatorStrategy } from "../../src/classes/obfuscators/HTMLObfuscatorStrategy.js";

describe("HTMLObfuscatorStrategy", () => {
  let strategy;

  beforeEach(() => {
    strategy = new HTMLObfuscatorStrategy();
  });

  test("obfuscates text content while preserving HTML structure", () => {
    const input = '<p>Hello World</p><div>Test content</div>';
    const result = strategy.obfuscateString(input);

    expect(result).toMatch(/<p>.*<\/p><div>.*<\/div>/);
    expect(result).not.toContain('Hello World');
    expect(result).not.toContain('Test content');
  });

  test("preserves text in elements with qbd-output class", () => {
    const input = '<p>This should be obfuscated</p><span class="qbd-output">This should be preserved</span>';
    const result = strategy.obfuscateString(input);

    expect(result).toContain('This should be preserved');
    expect(result).not.toContain('This should be obfuscated');
  });

  test("not preserves text in elements with qbd-output-direct-scope-widget class", () => {
    const input = '<p>This should be obfuscated</p><span class="qbd-output qbd-output-direct-scope-widget">This should not be preserved</span>';
    const result = strategy.obfuscateString(input);

    expect(result).not.toContain('This should not be preserved');
    expect(result).not.toContain('This should be obfuscated');
  });

  test("obfuscates attribute values except protected ones", () => {
    const input = '<div title="Custom Title" class="test-class" style="color: red;">Content</div>';
    const result = strategy.obfuscateString(input);

    expect(result).toMatch(/<div.*<\/div>/);
    expect(result).toContain('class="test-class"');
    expect(result).toContain('style="color: red;"');
    expect(result).not.toContain('Custom Title');
    expect(result).toMatch(/title="[^"]*"/);
  });

  test("preserves protected attributes", () => {
    const protectedAttrs = [
      'class="widget"',
      'kind="Repeater"',
      'style="color: blue;"',
      'contenteditable="false"',
      'data-record-id="123"',
      'data-record-model-name="Test"'
    ];

    const input = `<div ${protectedAttrs.join(' ')} custom="should be obfuscated">Content</div>`;
    const result = strategy.obfuscateString(input);

    protectedAttrs.forEach(attr => {
      expect(result).toContain(attr);
    });
    expect(result).not.toContain('should be obfuscated');
  });

  test("handles complex HTML with nested qbd-output elements", () => {
    const input = `
      <div class="widget">
        <p>Regular text to obfuscate</p>
        <span class="qbd-output">Preserved content</span>
        <div>
          <span class="qbd-output qbd-output-widget">Also preserved</span>
          <p>More text to obfuscate</p>
        </div>
      </div>
    `;
    const result = strategy.obfuscateString(input);

    expect(result).toContain('Preserved content');
    expect(result).toContain('Also preserved');
    expect(result).not.toContain('Regular text to obfuscate');
    expect(result).not.toContain('More text to obfuscate');
    expect(result).toContain('<div class="widget">');
    expect(result).toContain('class="qbd-output"');
  });

  test("handles empty or null input", () => {
    expect(strategy.obfuscateString("")).toBe("");
    expect(strategy.obfuscateString(null)).toBe(null);
    expect(strategy.obfuscateString(undefined)).toBe(undefined);
  });

  test("falls back to string obfuscation for invalid HTML", () => {
    const input = "Just plain text, not HTML";
    const result = strategy.obfuscateString(input);

    // Should be obfuscated but not equal to original
    expect(result).not.toBe(input);
    expect(typeof result).toBe('string');
  });
});
