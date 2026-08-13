import { LinkObfuscatorStrategy } from "../../src/classes/obfuscators/LinkObfuscatorStrategy.js";
import { HTMLObfuscatorStrategy } from "../../src/classes/obfuscators/HTMLObfuscatorStrategy.js";
import { DictionaryObfuscatorStrategy } from "../../src/classes/obfuscators/DictionaryObfuscatorStrategy.js";
import Obfuscator from "../../src/classes/Obfuscator.js";
import { parse } from "node-html-parser";
import { fileURLToPath } from "url";

const TEMPLATE_CONFIG = fileURLToPath(
  new URL("../../obfuscationCfg-template.yaml", import.meta.url),
);

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

describe("link columns are found by name, not by a list", () => {
  const obfuscator = new Obfuscator({ dialect: "mysql" }, TEMPLATE_CONFIG);

  test("covers every column whose name ends in links", () => {
    // riskLinks used to ship in plain text because no config rule named it.
    const columns = [
      "links",
      "riskLinks",
      "riskControlLinks",
      "detailedRiskLinks",
      "techTransferLinks",
      "acceptanceCriteriaLinks",
      "uploadImageLinks",
    ];

    for (const column of columns) {
      expect(
        obfuscator.getLinkRule(column, "string", undefined, undefined),
      ).toEqual({
        obfuscationRule: "linkObfuscator",
        ignorePattern: "",
      });
    }
  });

  test("leaves other columns and other types alone", () => {
    expect(
      obfuscator.getLinkRule("name", "string", undefined, undefined),
    ).toBeUndefined();
    expect(
      obfuscator.getLinkRule("linkedRecordId", "string", undefined, undefined),
    ).toBeUndefined();
    expect(
      obfuscator.getLinkRule("riskLinks", "int(11)", undefined, undefined),
    ).toBeUndefined();
  });

  test("a rule written for the column wins", () => {
    const written = { name: "riskLinks", obfuscationRule: "noObfuscator" };

    expect(
      obfuscator.getLinkRule("riskLinks", "string", written, undefined),
    ).toBeUndefined();
    expect(
      obfuscator.getLinkRule("riskLinks", "string", undefined, written),
    ).toBeUndefined();
  });
});

describe("everything inside a link is replaced unless the app reads it", () => {
  let strategy;

  beforeEach(() => {
    strategy = new LinkObfuscatorStrategy();
  });

  test("replaces the upload trace URL, which carries the bucket, the schema and an AWS token", () => {
    const input = JSON.stringify([
      {
        S3TmpKey: "client_qa_LillyQA/091b85d5-cf06/Lilly-Logo.svg.png",
        xhr: {
          __sentry_xhr_v3__: {
            method: "PUT",
            url: "https://ent-lily-qa-tmpdocument-attachments.s3.amazonaws.com/client_qa_LillyQA/091b85d5-cf06/Lilly-Logo.svg.png?X-Amz-Credential=ASIAXYKJVD2OJCGGRZ6N",
          },
        },
      },
    ]);

    const output = strategy.obfuscateString(input);

    expect(JSON.parse(output)[0].xhr.__sentry_xhr_v3__.url).toBe(
      "https://google.com",
    );
    expect(output).not.toContain("LillyQA");
    expect(output).not.toContain("ASIAXYKJVD2OJCGGRZ6N");
    expect(output).not.toContain("Lilly-Logo");
  });

  test("replaces the free text a customer typed on a link", () => {
    const input = JSON.stringify([
      {
        linkType: "Link",
        name: "IAPI_QS8050",
        description: "Batch release report",
      },
    ]);

    const [out] = JSON.parse(strategy.obfuscateString(input));

    expect(out.name).not.toBe("IAPI_QS8050");
    expect(out.description).not.toBe("Batch release report");
    // The app compares this one against "Attachment" and "Link".
    expect(out.linkType).toBe("Link");
  });

  test("obfuscates a link list that is stored as a JSON string", () => {
    // Older documents store the list as a JSON string, not an array.
    const input = JSON.stringify({
      acceptanceCriteriaLinks: JSON.stringify([
        { fileName: "Lilly-Logo.svg.png" },
      ]),
    });

    const out = JSON.parse(strategy.obfuscateString(input));

    expect(JSON.parse(out.acceptanceCriteriaLinks)[0].fileName).toBe(
      "attachment.png",
    );
  });

  test("gives a links column and its copy in document HTML the same value", () => {
    // One strategy for both paths, or the app cannot match the two copies.
    const dictionary = new DictionaryObfuscatorStrategy();
    const linkObfuscator = new LinkObfuscatorStrategy(dictionary);
    const links = [
      {
        uuid: "cf40e9ac-1d22-4a7f-9f4e-77b0c1a9e551",
        linkType: "Attachment",
        name: "Equipment Flow Chart",
        fileName: "Equipment Flow Chart.png",
        S3TmpKey: "client_qa_LillyQA/64a64cc4-001f/Equipment Flow Chart.png",
      },
    ];

    const fromColumn = JSON.parse(
      linkObfuscator.obfuscateString(JSON.stringify(links)),
    )[0];

    const encoded = JSON.stringify({
      acceptanceCriteriaLinks: JSON.stringify(links),
    })
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
    const html = `<span data-record-sub-model-data="${encoded}"></span>`;
    const fromHtml = JSON.parse(
      JSON.parse(
        parse(
          new HTMLObfuscatorStrategy(
            dictionary,
            linkObfuscator,
          ).obfuscateString(html),
        )
          .querySelector("span")
          .getAttribute("data-record-sub-model-data"),
      ).acceptanceCriteriaLinks,
    )[0];

    expect(fromHtml).toEqual(fromColumn);
  });
});

describe("inline images", () => {
  test("replaces a base64 image with a blank one instead of random words", () => {
    const strategy = new HTMLObfuscatorStrategy();
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAAoCAYAAABXadAK";
    const input = `<img src="${png}" />`;

    const src = parse(strategy.obfuscateString(input))
      .querySelector("img")
      .getAttribute("src");

    // Word replacement used to produce something like "back:women/the;artist,Will", which is not
    // a valid URL, so every document lost its images.
    expect(src.startsWith("data:image/png;base64,")).toBe(true);
    expect(src).not.toContain("iVBORw0KGgoAAAANSUhEUgAAALQ");
  });
});
