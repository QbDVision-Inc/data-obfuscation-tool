import { HTMLObfuscatorStrategy } from "../../src/classes/obfuscators/HTMLObfuscatorStrategy.js";
import { DictionaryObfuscatorStrategy } from "../../src/classes/obfuscators/DictionaryObfuscatorStrategy.js";
import ObfuscatorStrategyMap from "../../src/classes/obfuscators/ObfuscatorStrategyMap.js";
import { parse } from "node-html-parser";

describe("HTMLObfuscatorStrategy", () => {
  let strategy;

  beforeEach(() => {
    strategy = new HTMLObfuscatorStrategy();
  });

  test("obfuscates text content while preserving HTML structure", () => {
    const input = "<p>Hello World</p><div>Test content</div>";
    const result = strategy.obfuscateString(input);

    expect(result).toMatch(/<p>.*<\/p><div>.*<\/div>/);
    expect(result).not.toContain("Hello World");
    expect(result).not.toContain("Test content");
  });

  test("preserves text in elements with qbd-output class", () => {
    const input =
      '<p>This should be obfuscated</p><span class="qbd-output">This should be preserved</span>';
    const result = strategy.obfuscateString(input);

    expect(result).toContain("This should be preserved");
    expect(result).not.toContain("This should be obfuscated");
  });

  test("not preserves text in elements with qbd-output-direct-scope-widget class", () => {
    const input =
      '<p>This should be obfuscated</p><span class="qbd-output qbd-output-direct-scope-widget">This should not be preserved</span>';
    const result = strategy.obfuscateString(input);

    expect(result).not.toContain("This should not be preserved");
    expect(result).not.toContain("This should be obfuscated");
  });

  test("obfuscates attribute values except protected ones", () => {
    const input =
      '<div title="Custom Title" class="test-class" style="color: red;">Content</div>';
    const result = strategy.obfuscateString(input);

    expect(result).toMatch(/<div.*<\/div>/);
    expect(result).toContain('class="test-class"');
    expect(result).toContain('style="color: red;"');
    expect(result).not.toContain("Custom Title");
    expect(result).toMatch(/title="[^"]*"/);
  });

  test("preserves protected attributes", () => {
    const protectedAttrs = [
      'class="widget"',
      'kind="Repeater"',
      'style="color: blue;"',
      'contenteditable="false"',
      'data-record-id="123"',
      'data-record-model-name="Test"',
    ];

    const input = `<div ${protectedAttrs.join(" ")} custom="should be obfuscated">Content</div>`;
    const result = strategy.obfuscateString(input);

    protectedAttrs.forEach((attr) => {
      expect(result).toContain(attr);
    });
    expect(result).not.toContain("should be obfuscated");
    expect(result).not.toContain("Content");
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

    expect(result).toContain("Preserved content");
    expect(result).toContain("Also preserved");
    expect(result).not.toContain("Regular text to obfuscate");
    expect(result).not.toContain("More text to obfuscate");
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
    expect(typeof result).toBe("string");
  });

  test("handles complex real-world HTML document with multiple widget types", () => {
    const input =
      '<html><head></head><body><div class="widget" kind="Header"><div class="widget-main"><div class="widget-item"><div>Type: Header</div></div></div><div class="widget-content-container"><div class="widget-content"><table><tbody><tr><td><p><span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.companyName</span></p></td><td><p style="text-align:left">Export Date: <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.informationDate</span></p></td></tr><tr><td><p>Project: <span contenteditable="false" class="qbd-output qbd-output-widget">Project.name</span></p></td><td><p style="text-align:left">Exported By: <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.currentUser</span></p></td></tr><tr><td><p><span contenteditable="false" class="qbd-output qbd-output-widget">Document.name</span></p></td><td><p style="text-align:left">Record Data Type: <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.dataScope</span></p></td></tr></tbody></table></div></div></div><p></p><div class="widget" kind="Repeater" model="UnitOperation" process="{&quot;id&quot;:1,&quot;name&quot;:&quot;Request Comment&quot;,&quot;description&quot;:&quot;Took&quot;,&quot;site&quot;:&quot;&quot;,&quot;gmp&quot;:false,&quot;scale&quot;:&quot;&quot;,&quot;referencesLinks&quot;:&quot;&quot;,&quot;techTransferEnabled&quot;:null,&quot;integrations&quot;:&quot;&quot;,&quot;currentState&quot;:&quot;Evidence&quot;,&quot;clonedFromVersionId&quot;:null,&quot;clonedFromModel&quot;:&quot;&quot;,&quot;createdByUserId&quot;:5974,&quot;createdAt&quot;:&quot;2025-09-22T05:28:24.000Z&quot;,&quot;updatedAt&quot;:&quot;2025-09-23T07:44:13.000Z&quot;,&quot;deletedAt&quot;:null,&quot;ProjectId&quot;:1,&quot;SupplierId&quot;:null,&quot;SendingId&quot;:null,&quot;LastVersionId&quot;:7,&quot;LastApprovedVersionId&quot;:null,&quot;LastVersionTransitionId&quot;:10,&quot;Supplier&quot;:null,&quot;modelName&quot;:&quot;Process&quot;,&quot;typeCode&quot;:&quot;PR&quot;,&quot;approved&quot;:false,&quot;project&quot;:{&quot;id&quot;:1,&quot;name&quot;:&quot;Magic Pound Cake&quot;,&quot;isDemo&quot;:false,&quot;RMPId&quot;:3,&quot;deletedAt&quot;:null,&quot;riskAssessmentMethod&quot;:null,&quot;productRiskAssessmentType&quot;:&quot;Preliminary Hazards Analysis (PHA)&quot;},&quot;parents&quot;:[],&quot;projectId&quot;:1,&quot;versionId&quot;:7,&quot;cacheDate&quot;:&quot;2025-09-26T16:13:09.000Z&quot;,&quot;cacheId&quot;:2892}"><div class="widget-main"><div class="widget-item"><div>Type: Repeater</div></div><div class="widget-item"><div>Model: Unit Operation</div></div></div><div class="widget-content-container"><div class="widget-content"><p>Unit operation name <span contenteditable="false" class="qbd-output qbd-output-widget">UnitOperation.name</span></p></div></div></div><p></p><p>This is a unit operation <span contenteditable="false" class="qbd-output qbd-output-direct-scope-widget  never-approved" data-record-path="[&quot;UO[name=\'April Institute\']&quot;,&quot;name&quot;]" data-record-id="1" data-record-model-name="UnitOperation" data-record-column-name="name" data-never-approved="true">April Institute</span></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p> </p><div class="widget" kind="Footer"><div class="widget-main"><div class="widget-item"><div>Type: Footer</div></div></div><div class="widget-content-container"><div class="widget-content"><p style="text-align:center">This report was generated with QbDVision Version: <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.softwareVersion</span></p><table><tbody><tr><td><p></p></td><td><p style="text-align:center">CONFIDENTIAL INFORMATION</p></td><td><p style="text-align:right">Page <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.pageNumber</span> of  <span contenteditable="false" class="qbd-output qbd-output-widget">DocBuilderFields.totalPages</span></p></td></tr></tbody></table></div></div></div></body></html>';
    const result = strategy.obfuscateString(input);

    // Test HTML structure preservation
    expect(result).toContain("<html>");
    expect(result).toContain("<head></head>");
    expect(result).toContain("<body>");
    expect(result).toContain("</body></html>");

    // Test protected class attributes are preserved
    expect(result).toContain('class="widget"');
    expect(result).toContain('class="widget-main"');
    expect(result).toContain('class="widget-content"');
    expect(result).toContain('class="qbd-output qbd-output-widget"');
    expect(result).toContain(
      'class="qbd-output qbd-output-direct-scope-widget  never-approved"',
    );

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
    expect(result).toContain("DocBuilderFields.companyName");
    expect(result).toContain("DocBuilderFields.informationDate");
    expect(result).toContain("Project.name");
    expect(result).toContain("DocBuilderFields.currentUser");
    expect(result).toContain("Document.name");
    expect(result).toContain("DocBuilderFields.dataScope");
    expect(result).toContain("UnitOperation.name");
    expect(result).toContain("DocBuilderFields.softwareVersion");
    expect(result).toContain("DocBuilderFields.pageNumber");
    expect(result).toContain("DocBuilderFields.totalPages");

    // Test qbd-output-direct-scope-widget content is NOT preserved (should be obfuscated)
    expect(result).not.toContain("April Institute");

    // Test regular text content is obfuscated
    expect(result).not.toContain("Type: Header");
    expect(result).not.toContain("Export Date:");
    expect(result).not.toContain("Project:");
    expect(result).not.toContain("Exported By:");
    expect(result).not.toContain("Record Data Type:");
    expect(result).not.toContain("Type: Repeater");
    expect(result).not.toContain("Model: Unit Operation");
    expect(result).not.toContain("Unit operation name");
    expect(result).not.toContain("This is a unit operation");
    expect(result).not.toContain("Type: Footer");
    expect(result).not.toContain(
      "This report was generated with QbDVision Version:",
    );
    expect(result).not.toContain("CONFIDENTIAL INFORMATION");

    // Test process attribute should be obfuscated (not in protected list)
    expect(result).not.toContain("Request Comment");
    expect(result).not.toContain("Magic Pound Cake");
    expect(result).not.toContain("Preliminary Hazards Analysis (PHA)");
  });

  test("obfuscates process attribute object values while preserving protected keys", () => {
    const input = `<div process='{"id":1,"amount":2,"name":"Test Process","modelName":"Process","typeCode":"PR","description":"This should be obfuscated","site":"Test Site","class":"widget-class"}'>Content</div>`;
    const result = strategy.obfuscateString(input);
    const processObj = JSON.parse(
      parse(result).firstChild.getAttribute("process"),
    );

    // Protected keys should have their original values preserved
    expect(processObj.modelName).toBe("Process");
    expect(processObj.typeCode).toBe("PR");
    expect(processObj.class).toBe("widget-class");

    // Non-protected keys should be obfuscated
    expect(processObj.name).not.toBe("Test Process");
    expect(processObj.description).not.toBe("This should be obfuscated");
    expect(processObj.site).not.toBe("Test Site");

    // Numeric values should remain unchanged
    expect(processObj.id).toBe(1);
    expect(processObj.amount).toBe(2);

    // Should still have the same keys
    expect(processObj).toHaveProperty("id");
    expect(processObj).toHaveProperty("name");
    expect(processObj).toHaveProperty("modelName");
    expect(processObj).toHaveProperty("typeCode");
    expect(processObj).toHaveProperty("description");
    expect(processObj).toHaveProperty("site");
    expect(processObj).toHaveProperty("class");
  });

  test("handles nested objects in process attribute", () => {
    const input = `<div process='{"project":{"id":1,"amount":3,"name":"Magic Cake","modelName":"Project","description":"Test Description"},"modelName":"Process","name":"Main Process"}'>Content</div>`;
    const result = strategy.obfuscateString(input);
    const processObj = JSON.parse(
      parse(result).firstChild.getAttribute("process"),
    );

    // Top-level protected attributes should be preserved
    expect(processObj.modelName).toBe("Process");
    expect(processObj.name).not.toBe("Main Process");

    // Nested object protected attributes should be preserved
    expect(processObj.project.modelName).toBe("Project");
    expect(processObj.project.id).toBe(1);
    expect(processObj.project.amount).toBe(3);

    // Nested object non-protected attributes should be obfuscated
    expect(processObj.project.name).not.toBe("Magic Cake");
    expect(processObj.project.description).not.toBe("Test Description");
  });

  test("keeps the filters attribute valid JSON and only obfuscates its text values", () => {
    const filters =
      '[{"model":"ProcessParameter","isAndFilter":true,' +
      '"field":"ProcessParameter.name","operator":"=","value":"pH"}]';
    const input = `<div class="widget" kind="Repeater" filters='${filters}'>x</div>`;

    const result = strategy.obfuscateString(input);
    const value = parse(result).querySelector("div").getAttribute("filters");

    // Document Builder broke here. Obfuscating the attribute as plain text turned the boolean
    // true into a bare word, so the attribute stopped being valid JSON.
    const parsed = JSON.parse(value);

    expect(parsed[0].isAndFilter).toBe(true);
    expect(parsed[0].field).toBe("ProcessParameter.name");
    expect(parsed[0].operator).toBe("=");
    expect(parsed[0].value).not.toBe("pH");
  });

  test("preserves attribute values the app reads instead of displays", () => {
    const input =
      '<div selected="true" dynamiclist="false" level="1" width="120px" ' +
      'uuid="1e5b3c4a-2f11-4c9d-8a77-9b2e0d4f6a13" title="Batch release report">x</div>';

    const node = parse(strategy.obfuscateString(input)).querySelector("div");

    expect(node.getAttribute("selected")).toBe("true");
    expect(node.getAttribute("dynamiclist")).toBe("false");
    expect(node.getAttribute("level")).toBe("1");
    expect(node.getAttribute("width")).toBe("120px");
    expect(node.getAttribute("uuid")).toBe(
      "1e5b3c4a-2f11-4c9d-8a77-9b2e0d4f6a13",
    );
    // Real text is still obfuscated.
    expect(node.getAttribute("title")).not.toBe("Batch release report");
  });

  test("obfuscates only the record name inside data-record-path", () => {
    // The dump stores this attribute with encoded quotes, so the test uses the same form.
    const path =
      "[&quot;PP[name='Fermentation']&quot;,&quot;UO[name='Harvest']&quot;,&quot;description&quot;]";
    const input = `<span class="qbd-output" data-record-path="${path}">x</span>`;

    const result = strategy.obfuscateString(input);
    const value = parse(result)
      .querySelector("span")
      .getAttribute("data-record-path");
    const steps = JSON.parse(value);

    expect(steps).toHaveLength(3);
    // Type codes and the trailing field name are schema, so they survive.
    expect(steps[0]).toMatch(/^PP\[name='.+'\]$/);
    expect(steps[1]).toMatch(/^UO\[name='.+'\]$/);
    expect(steps[2]).toBe("description");
    // Record names are customer data, so they are replaced.
    expect(steps[0]).not.toContain("Fermentation");
    expect(steps[1]).not.toContain("Harvest");
  });

  test("gives a record name the same replacement everywhere it appears", () => {
    const path = "[&quot;PP[name='Fermentation']&quot;,&quot;name&quot;]";
    const input =
      `<span data-record-path="${path}"></span>` + `<p>Fermentation</p>`;

    const root = parse(strategy.obfuscateString(input));
    const pathName = JSON.parse(
      root.querySelector("span").getAttribute("data-record-path"),
    )[0].match(/name='(.*)'/)[1];

    expect(root.querySelector("p").text).toBe(pathName);
  });

  test("matches protected attribute names case insensitively", () => {
    const input = '<div modelName="Project" typeCode="PRJ">x</div>';

    const node = parse(strategy.obfuscateString(input)).querySelector("div");

    expect(node.getAttribute("modelname")).toBe("Project");
    expect(node.getAttribute("typecode")).toBe("PRJ");
  });
});

// node-html-parser 7.x rebuilt every attribute of an element after one setAttribute call
// and stripped backslashes while doing it. That turned the \n and \" escapes inside JSON
// attributes into raw newlines and bare quotes, which broke JSON.parse in Document
// Builder. Version 9 keeps the bytes as they are. These tests pin that, and they pin the
// shared dictionary that keeps the copies inside document HTML equal to the column values.
describe("data-record-sub-model-data", () => {
  test("obfuscates customer text, keeps join keys, and stays valid JSON", () => {
    const shared = new DictionaryObfuscatorStrategy();
    const strategy = new HTMLObfuscatorStrategy(shared);
    const link = {
      uuid: "cf40e9ac",
      linkType: "Attachment",
      fileName: "Report v1.pdf",
    };
    const nestedLinks = JSON.stringify([
      { uuid: "bcef9bfa", linkType: "Link" },
    ]);
    const subModelData = JSON.stringify({
      id: 24508,
      uuid: "336cb4e7-3eaa-4af9-ba4f-eae34a54fb3f",
      group: "Processing",
      label: "Parameter Range",
      isDefault: true,
      targetJustification: "Not Less Than 0.5 hours. \nNot More Than 6 hours.",
      acceptanceCriteriaLinks: nestedLinks,
      link,
    });
    const encoded = subModelData.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const path = "[&quot;PP[name='Fermentation']&quot;,&quot;lowerLimit&quot;]";
    const input =
      '<span class="qbd-output qbd-output-direct-scope-widget"' +
      ` data-record-path="${path}"` +
      ' data-record-sub-model-name="AcceptanceCriteriaRange"' +
      ` data-record-sub-model-data="${encoded}">0.5</span>`;

    const result = strategy.obfuscateString(input);
    const value = parse(result)
      .querySelector("span")
      .getAttribute("data-record-sub-model-data");
    const parsed = JSON.parse(value);

    // Join keys and structure survive.
    expect(parsed.id).toBe(24508);
    expect(parsed.uuid).toBe("336cb4e7-3eaa-4af9-ba4f-eae34a54fb3f");
    expect(parsed.isDefault).toBe(true);
    // The app looks up sub records by group and label, so both must get the same
    // replacement as the database columns, which share this dictionary.
    expect(parsed.group).toBe(shared.obfuscateString("Processing"));
    expect(parsed.label).toBe(shared.obfuscateString("Parameter Range"));
    // Free text is replaced but keeps its line break, so the escapes stay valid JSON.
    expect(parsed.targetJustification).not.toContain("Not Less Than");
    expect(parsed.targetJustification).toContain("\n");
    // Link data mirrors database JSON columns that the column rules skip, so it stays as is.
    expect(parsed.acceptanceCriteriaLinks).toBe(nestedLinks);
    expect(parsed.link).toEqual(link);
  });

  test("filters targetValue matches the column obfuscation through the shared dictionary", () => {
    const shared = new DictionaryObfuscatorStrategy();
    const strategy = new HTMLObfuscatorStrategy(shared);
    const filters =
      '[{"isAndFilter":true,"attribute":"ProcessParameter.name",' +
      '"operator":"=","targetValue":"Fermentation Temperature"}]';
    const input = `<div class="widget" filters='${filters}'>x</div>`;

    const value = parse(strategy.obfuscateString(input))
      .querySelector("div")
      .getAttribute("filters");

    // The backend runs this filter against the ProcessParameter name column, so the
    // obfuscated filter value must equal the obfuscated column value.
    expect(JSON.parse(value)[0].targetValue).toBe(
      shared.obfuscateString("Fermentation Temperature"),
    );
  });

  test("the strategy map wires one dictionary for columns and html", () => {
    const columnValue =
      ObfuscatorStrategyMap.dictionaryObfuscator.obfuscateString(
        "Quality Range",
      );
    const html =
      '<span data-record-sub-model-data="{&quot;group&quot;:&quot;Quality Range&quot;}">x</span>';

    const out = ObfuscatorStrategyMap.htmlObfuscator.obfuscateString(html);
    const parsed = JSON.parse(
      parse(out)
        .querySelector("span")
        .getAttribute("data-record-sub-model-data"),
    );

    expect(parsed.group).toBe(columnValue);
  });
});
