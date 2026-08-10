import { BaseObfuscatorStrategy } from "./BaseObfuscatorStrategy.js";
import { DictionaryObfuscatorStrategy } from "./DictionaryObfuscatorStrategy.js";

// Link fields hold customer file names and storage paths, so they cannot be kept. Replacing them
// with random words would produce a broken looking URL, so each one gets a valid dummy instead.
const DUMMY_URL = "https://google.com";
const DUMMY_FILE = "attachment";
const DUMMY_FOLDER = "obfuscated";

// These keys hold a customer storage path or file name, so each gets a dummy of the same shape.
const LINK_FIELDS = new Set(["link", "filename", "s3tmpkey"]);

// The app reads or joins on these keys and none holds customer data, so they are never replaced.
const PRESERVED_FIELDS = new Set([
  "uuid",
  "linktype",
  "filestatus",
  "linkversion",
  "s3tmpversion",
  "mode",
  "method",
  "progress",
  "size",
  "index",
]);

const URL_VALUE = /^https?:\/\//i;

const extensionOf = (name) => {
  const match = /\.[A-Za-z0-9]{1,8}$/.exec(name || "");
  return match ? match[0] : "";
};

/**
 * Replaces the customer part of a storage path but keeps every id in it. The app looks images up by
 * S3TmpKey, so two different images must still get two different keys.
 * @param value A storage path such as companySchema/<uuid>/Their File.png
 */
const obfuscateStoragePath = (value) => {
  const segments = value.split("/").filter((part) => part !== "");
  if (segments.length <= 1) {
    return `${DUMMY_FILE}${extensionOf(value)}`;
  }

  const fileName = `${DUMMY_FILE}${extensionOf(segments[segments.length - 1])}`;
  // The first segment is the customer schema name. Everything between it and the file name is ids,
  // which carry no customer data and keep each key unique.
  const middle = segments.slice(1, -1);
  return [DUMMY_FOLDER, ...middle, fileName].join("/");
};

/**
 * Replaces one link field with a dummy value of the same shape.
 * @param fieldName The lowercased JSON key.
 * @param value The original string value.
 */
export const obfuscateLinkField = (fieldName, value) => {
  if (typeof value !== "string" || value === "") {
    return value;
  }

  if (fieldName === "filename") {
    return `${DUMMY_FILE}${extensionOf(value)}`;
  }

  // A real URL becomes a working dummy URL, so the app still renders a valid link.
  if (URL_VALUE.test(value)) {
    return DUMMY_URL;
  }

  return obfuscateStoragePath(value);
};

export const isLinkField = (fieldName) => LINK_FIELDS.has(fieldName);

/**
 * True for a field whose name ends in "links", such as riskLinks. That suffix is how the app itself
 * finds link fields, in document_link_parser.js isLinkAttribute.
 * @param fieldName A column name or a JSON key.
 */
export const isLinksField = (fieldName) =>
  String(fieldName || "")
    .toLowerCase()
    .endsWith("links");

const parseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

/**
 * Obfuscates the link JSON held by columns such as uploadImageLinks. HTMLObfuscatorStrategy runs the
 * copy inside document HTML through this class too, because the app joins the two by S3TmpKey.
 */
export class LinkObfuscatorStrategy extends BaseObfuscatorStrategy {
  // The dictionary that obfuscates the columns. Sharing it gives a link name the same replacement
  // as that same name in its own column.
  constructor(
    dictionaryObfuscatorStrategy = new DictionaryObfuscatorStrategy(),
  ) {
    super();
    this._dictionaryObfuscatorStrategy = dictionaryObfuscatorStrategy;
  }

  obfuscateString(someString) {
    if (!someString) {
      return someString;
    }

    const parsed = parseJson(someString);
    if (parsed === undefined) {
      // Not JSON, so there is no link structure to keep. Leave it rather than guess.
      return someString;
    }

    return JSON.stringify(this._walk(parsed));
  }

  /**
   * Obfuscates one value inside a link. HTMLObfuscatorStrategy calls this for the copy stored in a
   * document attribute, so that copy and the database column come out identical.
   * @param fieldName The lowercased column name or JSON key.
   * @param value The value under that name.
   */
  obfuscateValue(fieldName, value) {
    if (value && typeof value === "object") {
      return this._walk(value);
    }

    if (typeof value !== "string" || value === "") {
      return value;
    }

    if (PRESERVED_FIELDS.has(fieldName)) {
      return value;
    }

    // Replace any URL, not only the ones under a known key: the xhr upload trace holds a presigned
    // S3 URL carrying the customer bucket and file name.
    if (isLinkField(fieldName) || URL_VALUE.test(value)) {
      return obfuscateLinkField(fieldName, value);
    }

    // A nested link list is stored as a JSON string, so parse it and obfuscate the links inside.
    if (isLinksField(fieldName)) {
      const nested = parseJson(value);
      if (nested !== undefined) {
        return JSON.stringify(this._walk(nested));
      }
    }

    return this._dictionaryObfuscatorStrategy.obfuscateString(value);
  }

  _walk(node) {
    if (Array.isArray(node)) {
      return node.map((item) => this._walk(item));
    }

    if (!node || typeof node !== "object") {
      return node;
    }

    for (const key of Object.keys(node)) {
      node[key] = this.obfuscateValue(String(key).toLowerCase(), node[key]);
    }
    return node;
  }
}
