import { LinkObfuscatorStrategy } from "../../src/classes/obfuscators/LinkObfuscatorStrategy.js";
import { HTMLObfuscatorStrategy } from "../../src/classes/obfuscators/HTMLObfuscatorStrategy.js";
import { parse } from "node-html-parser";

describe("LinkObfuscatorStrategy", () => {
  let strategy;

  beforeEach(() => {
    strategy = new LinkObfuscatorStrategy();
  });

  test("replaces a real URL with a working dummy URL", () => {
    const input = JSON.stringify([
      {
        uuid: "bcef9bfa-ed50-42c3-873d-72fd8d8981f9",
        linkType: "Link",
        link: "https://lilly.veevavault.com/ui/doc_info/2833497",
      },
    ]);

    const [out] = JSON.parse(strategy.obfuscateString(input));

    expect(out.link).toBe("https://google.com");
    // The app reads these, and neither one holds customer data.
    expect(out.uuid).toBe("bcef9bfa-ed50-42c3-873d-72fd8d8981f9");
    expect(out.linkType).toBe("Link");
  });

  test("replaces the customer file name but keeps the extension", () => {
    const input = JSON.stringify([
      { linkType: "Attachment", fileName: "Lilly-Logo.svg.png" },
    ]);

    const [out] = JSON.parse(strategy.obfuscateString(input));

    expect(out.fileName).toBe("attachment.png");
  });

  test("keeps storage keys unique so images do not collapse onto one another", () => {
    // The app looks images up by S3TmpKey. A single fixed dummy would point every image at the
    // same entry, so the ids in the middle of the path have to survive.
    const input = JSON.stringify([
      { S3TmpKey: "client_qa_LillyQA/091b85d5-cf06/Lilly-Logo.svg.png" },
      { S3TmpKey: "client_qa_LillyQA/e2a6399b-56b7/process_flow_map.png" },
    ]);

    const [first, second] = JSON.parse(strategy.obfuscateString(input));

    expect(first.S3TmpKey).toBe("obfuscated/091b85d5-cf06/attachment.png");
    expect(second.S3TmpKey).toBe("obfuscated/e2a6399b-56b7/attachment.png");
    expect(first.S3TmpKey).not.toBe(second.S3TmpKey);
    expect(strategy.obfuscateString(input)).not.toContain("LillyQA");
  });

  test("reaches link fields nested inside an object", () => {
    const input = JSON.stringify({
      link: { linkType: "Attachment", fileName: "Equipment Flow Chart.png" },
    });

    const out = JSON.parse(strategy.obfuscateString(input));

    expect(out.link.fileName).toBe("attachment.png");
  });

  test("leaves a value alone when it is not JSON", () => {
    expect(strategy.obfuscateString("not json at all")).toBe("not json at all");
    expect(strategy.obfuscateString("")).toBe("");
    expect(strategy.obfuscateString(null)).toBe(null);
  });

  test("gives a column and its copy inside document HTML the same value", () => {
    // This is the whole point. parser.js keys the image map by the column's S3TmpKey and
    // image_parser.js looks it up with the S3TmpKey from the HTML attribute, so if the two paths
    // disagreed every image in the document would stop resolving.
    const fileData = {
      uuid: "cf40e9ac-1d22-4a7f-9f4e-77b0c1a9e551",
      linkType: "Attachment",
      fileName: "Process Flow 1.png",
      S3TmpKey: "client_qa_LillyQA/64a64cc4-001f/Process Flow 1.png",
    };

    const fromColumn = JSON.parse(
      strategy.obfuscateString(JSON.stringify([fileData])),
    )[0];

    const encoded = JSON.stringify(fileData)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
    const html = `<img filedata="${encoded}" />`;
    const fromHtml = JSON.parse(
      parse(new HTMLObfuscatorStrategy().obfuscateString(html))
        .querySelector("img")
        .getAttribute("filedata"),
    );

    expect(fromHtml.S3TmpKey).toBe(fromColumn.S3TmpKey);
    expect(fromHtml.fileName).toBe(fromColumn.fileName);
  });
});
