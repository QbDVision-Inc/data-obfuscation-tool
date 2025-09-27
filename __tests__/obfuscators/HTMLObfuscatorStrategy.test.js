import { HTMLObfuscatorStrategy } from "../../src/classes/obfuscators/HTMLObfuscatorStrategy.js";
import { parse } from "node-html-parser";

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
    expect(result).not.toContain('Content');
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

  test("handles complex real-world HTML document with multiple widget types", () => {
    const input = '<html><head></head><body><div class="widget" kind="Header"><div class="widget-main"><div class="widget-item"><div>Type: Header</div></div></div><div class="widget-content-container"><div class="widget-content"><table><tbody><tr><td><p><span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.companyName</span></p></td><td><p style="text-align:left">Export Date: <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.informationDate</span></p></td></tr><tr><td><p>Project: <span contenteditable="false" class="qbd-output qbd-output-widget">Project.name</span></p></td><td><p style="text-align:left">Exported By: <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.currentUser</span></p></td></tr><tr><td><p><span contenteditable="false" class="qbd-output qbd-output-widget">Document.name</span></p></td><td><p style="text-align:left">Record Data Type: <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.dataScope</span></p></td></tr></tbody></table></div></div></div><p></p><div class="widget" kind="Repeater" model="UnitOperation" process="{&quot;id&quot;:1,&quot;name&quot;:&quot;Request Comment&quot;,&quot;description&quot;:&quot;Took&quot;,&quot;site&quot;:&quot;&quot;,&quot;gmp&quot;:false,&quot;scale&quot;:&quot;&quot;,&quot;referencesLinks&quot;:&quot;&quot;,&quot;techTransferEnabled&quot;:null,&quot;integrations&quot;:&quot;&quot;,&quot;currentState&quot;:&quot;Evidence&quot;,&quot;clonedFromVersionId&quot;:null,&quot;clonedFromModel&quot;:&quot;&quot;,&quot;createdByUserId&quot;:5974,&quot;createdAt&quot;:&quot;2025-09-22T05:28:24.000Z&quot;,&quot;updatedAt&quot;:&quot;2025-09-23T07:44:13.000Z&quot;,&quot;deletedAt&quot;:null,&quot;ProjectId&quot;:1,&quot;SupplierId&quot;:null,&quot;SendingId&quot;:null,&quot;LastVersionId&quot;:7,&quot;LastApprovedVersionId&quot;:null,&quot;LastVersionTransitionId&quot;:10,&quot;Supplier&quot;:null,&quot;modelName&quot;:&quot;Process&quot;,&quot;typeCode&quot;:&quot;PR&quot;,&quot;approved&quot;:false,&quot;project&quot;:{&quot;id&quot;:1,&quot;name&quot;:&quot;Magic Pound Cake&quot;,&quot;isDemo&quot;:false,&quot;RMPId&quot;:3,&quot;deletedAt&quot;:null,&quot;riskAssessmentMethod&quot;:null,&quot;productRiskAssessmentType&quot;:&quot;Preliminary Hazards Analysis (PHA)&quot;},&quot;parents&quot;:[],&quot;projectId&quot;:1,&quot;versionId&quot;:7,&quot;cacheDate&quot;:&quot;2025-09-26T16:13:09.000Z&quot;,&quot;cacheId&quot;:2892}"><div class="widget-main"><div class="widget-item"><div>Type: Repeater</div></div><div class="widget-item"><div>Model: Unit Operation</div></div></div><div class="widget-content-container"><div class="widget-content"><p>Unit operation name <span contenteditable="false" class="qbd-output qbd-output-widget">UnitOperation.name</span></p></div></div></div><p></p><p>This is a unit operation <span contenteditable="false" class="qbd-output qbd-output-direct-scope-widget  never-approved" data-record-path="[&quot;UO[name=\'April Institute\']&quot;,&quot;name&quot;]" data-record-id="1" data-record-model-name="UnitOperation" data-record-column-name="name" data-never-approved="true">April Institute</span></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p> </p><div class="widget" kind="Footer"><div class="widget-main"><div class="widget-item"><div>Type: Footer</div></div></div><div class="widget-content-container"><div class="widget-content"><p style="text-align:center">This report was generated with QbDVision Version: <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.softwareVersion</span></p><table><tbody><tr><td><p></p></td><td><p style="text-align:center">CONFIDENTIAL INFORMATION</p></td><td><p style="text-align:right">Page <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.pageNumber</span> of  <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.totalPages</span></p></td></tr></tbody></table></div></div></div></body></html>';
    const result = strategy.obfuscateString(input);

    // Test HTML structure preservation
    expect(result).toContain('<html>');
    expect(result).toContain('<head></head>');
    expect(result).toContain('<body>');
    expect(result).toContain('</body></html>');

    // Test protected class attributes are preserved
    expect(result).toContain('class="widget"');
    expect(result).toContain('class="widget-main"');
    expect(result).toContain('class="widget-content"');
    expect(result).toContain('class="qbd-output qbd-output-widget"');
    expect(result).toContain('class="qbd-output qbd-output-direct-scope-widget  never-approved"');

    // Test protected kind attributes are preserved
    expect(result).toContain('kind="Header"');
    expect(result).toContain('kind="Repeater"');
    expect(result).toContain('kind="Footer"');

    // Test protected model attribute is preserved
    expect(result).toContain('model="UnitOperation"');

    // Test protected contenteditable attributes are preserved
    expect(result).toContain('contenteditable="false"');

    // Test protected data-* attributes are preserved
    expect(result).toContain('data-record-id="1"');
    expect(result).toContain('data-record-model-name="UnitOperation"');
    expect(result).toContain('data-record-column-name="name"');
    expect(result).toContain('data-never-approved="true"');

    // Test protected style attributes are preserved
    expect(result).toContain('style="text-align:left"');
    expect(result).toContain('style="text-align:center"');
    expect(result).toContain('style="text-align:right"');

    // Test qbd-output content is preserved
    expect(result).toContain('DocBuilderFields.companyName');
    expect(result).toContain('DocBuilderFields.informationDate');
    expect(result).toContain('Project.name');
    expect(result).toContain('DocBuilderFields.currentUser');
    expect(result).toContain('Document.name');
    expect(result).toContain('DocBuilderFields.dataScope');
    expect(result).toContain('UnitOperation.name');
    expect(result).toContain('DocBuilderFields.softwareVersion');
    expect(result).toContain('DocBuilderFields.pageNumber');
    expect(result).toContain('DocBuilderFields.totalPages');

    // Test qbd-output-direct-scope-widget content is NOT preserved (should be obfuscated)
    expect(result).not.toContain('April Institute');

    // Test regular text content is obfuscated
    expect(result).not.toContain('Type: Header');
    expect(result).not.toContain('Export Date:');
    expect(result).not.toContain('Project:');
    expect(result).not.toContain('Exported By:');
    expect(result).not.toContain('Record Data Type:');
    expect(result).not.toContain('Type: Repeater');
    expect(result).not.toContain('Model: Unit Operation');
    expect(result).not.toContain('Unit operation name');
    expect(result).not.toContain('This is a unit operation');
    expect(result).not.toContain('Type: Footer');
    expect(result).not.toContain('This report was generated with QbDVision Version:');
    expect(result).not.toContain('CONFIDENTIAL INFORMATION');

    // Test process attribute should be obfuscated (not in protected list)
    expect(result).not.toContain('Request Comment');
    expect(result).not.toContain('Magic Pound Cake');
    expect(result).not.toContain('Preliminary Hazards Analysis (PHA)');
  });

  test("obfuscates process attribute object values while preserving protected keys", () => {
    const input = `<div process='{"id":1,"name":"Test Process","modelName":"Process","typeCode":"PR","description":"This should be obfuscated","site":"Test Site","class":"widget-class"}'>Content</div>`;
    const result = strategy.obfuscateString(input);
    const processObj = JSON.parse(parse(result).firstChild.getAttribute('process'));
    console.log(processObj);

    // Protected keys should have their original values preserved
    expect(processObj.modelName).toBe("Process");
    expect(processObj.typeCode).toBe("PR");
    expect(processObj.class).toBe("widget-class");

    // Non-protected keys should be obfuscated
    expect(processObj.name).not.toBe("Test Process");
    expect(processObj.description).not.toBe("This should be obfuscated");
    expect(processObj.site).not.toBe("Test Site");
    // expect(processObj.amount).not.toBe(2);

    // Numeric values should remain unchanged
    expect(processObj.id).toBe(1);

    // Should still have the same keys
    expect(processObj).toHaveProperty('id');
    expect(processObj).toHaveProperty('name');
    expect(processObj).toHaveProperty('modelName');
    expect(processObj).toHaveProperty('typeCode');
    expect(processObj).toHaveProperty('description');
    expect(processObj).toHaveProperty('site');
    expect(processObj).toHaveProperty('class');
  });

  test("handles nested objects in process attribute", () => {
    const input = `<div process='{"project":{"id":1,"name":"Magic Cake","modelName":"Project","description":"Test Description"},"modelName":"Process","name":"Main Process"}'>Content</div>`;
    const result = strategy.obfuscateString(input);
    const processObj = JSON.parse(parse(result).firstChild.getAttribute('process'));

    // Top-level protected attributes should be preserved
    expect(processObj.modelName).toBe("Process");
    expect(processObj.name).not.toBe("Main Process");

    // Nested object protected attributes should be preserved
    expect(processObj.project.modelName).toBe("Project");
    expect(processObj.project.id).toBe(1);

    // Nested object non-protected attributes should be obfuscated
    expect(processObj.project.name).not.toBe("Magic Cake");
    expect(processObj.project.description).not.toBe("Test Description");
  });
});
