import { BaseObfuscatorStrategy } from "./BaseObfuscatorStrategy.js";

// Link fields hold customer file names and storage paths, so they cannot be kept. Replacing them
// with random words would produce a broken looking URL, so each one gets a valid dummy instead.
const DUMMY_URL = "https://google.com";
const DUMMY_FILE = "attachment";
const DUMMY_FOLDER = "obfuscated";

// Fields handled here. S3TmpVersion and linkVersion are random storage tokens with no customer
// information in them, so they stay as they are and keep pointing at the same object.
const LINK_FIELDS = new Set(["link", "filename", "s3tmpkey"]);

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
  if (/^https?:\/\//i.test(value)) {
    return DUMMY_URL;
  }

  return obfuscateStoragePath(value);
};

export const isLinkField = (fieldName) => LINK_FIELDS.has(fieldName);

/**
 * Obfuscates the link JSON that database columns such as uploadImageLinks hold. The document HTML
 * keeps a copy of the same data, and HTMLObfuscatorStrategy replaces it with the same helper, so
 * both copies stay equal and the app can still match them.
 */
export class LinkObfuscatorStrategy extends BaseObfuscatorStrategy {
  obfuscateString(someString) {
    if (!someString) {
      return someString;
    }

    try {
      return JSON.stringify(this._walk(JSON.parse(someString)));
    } catch {
      // Not JSON, so there is no link structure to keep. Leave it rather than guess.
      return someString;
    }
  }

  _walk(node) {
    if (Array.isArray(node)) {
      return node.map((item) => this._walk(item));
    }

    if (!node || typeof node !== "object") {
      return node;
    }

    for (const key of Object.keys(node)) {
      const fieldName = key.toLowerCase();
      const value = node[key];
      // A "link" key can hold a URL string or a nested object, so only strings are replaced here
      // and objects keep going down the tree.
      if (isLinkField(fieldName) && typeof value === "string") {
        node[key] = obfuscateLinkField(fieldName, value);
      } else if (value && typeof value === "object") {
        node[key] = this._walk(value);
      }
    }
    return node;
  }
}
