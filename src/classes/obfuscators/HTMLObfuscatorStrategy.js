import { BaseObfuscatorStrategy } from "./BaseObfuscatorStrategy.js";
import { parse } from "node-html-parser";
import { DictionaryObfuscatorStrategy } from "./DictionaryObfuscatorStrategy.js";
import {
  isLinkField,
  isLinksField,
  LinkObfuscatorStrategy,
} from "./LinkObfuscatorStrategy.js";

// Those attributes are from widget_node and qbd_field_node in the main repo https://github.com/QbDVision-Inc/qbdvision
// Every name here must be lowercase. HTML parsers lowercase attribute names, so a camelCase entry
// would never match and the attribute would be obfuscated by mistake.
const PROTECTED_ATTRIBUTES = new Set([
  "class",
  "kind",
  "model",
  "modelname",
  "style",
  "typecode",
  "contenteditable",
  "referenceblockname",
  "referenceblock",
  "data-record-id",
  "data-record-model-name",
  "data-record-column-name",
  "data-never-approved",
  "data-record-sub-model-name",
]);

// Keys inside JSON attribute values that name something in the schema, not customer data. An
// operator such as "contains" and a link type such as "Attachment" read like ordinary words, so
// the text check below cannot tell them apart from prose. Replacing them breaks the app and hides
// nothing. The value the customer typed lives under targetValue, which is still replaced.
const SCHEMA_JSON_KEYS = new Set([
  "attribute",
  "operator",
  "submodel",
  "linktype",
]);

// A value matching any of these is read by the app, not by a person, so obfuscating it breaks the
// app without hiding any customer data.
const VALUE_IS_NOT_TEXT = [
  /^(?:true|false|null|undefined)$/i, // literals the app compares against
  /^-?\d+(?:\.\d+)?(?:px|%|em|rem|pt|vh|vw|deg|s|ms)?$/i, // numbers and CSS lengths
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID
  /^[A-Z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+$/, // model paths like FQA.AcceptanceCriteriaRange
  /^[^A-Za-z]+$/, // operators and punctuation only, such as "="
];

// A one pixel transparent PNG, used to replace inline images. Anything a customer pasted into a
// document is gone, and the tag still points at a real image so nothing looks broken.
const BLANK_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// One step of a data-record-path, for example PP[name='Fermentation']. The type code is part of the
// schema and the record name is customer data, so each half needs different handling.
const RECORD_PATH_STEP = /^(\w+)\[name='(.*)'\]$/;

/**
 * This obfuscator preserves HTML tags and attributes, preserves text in elements with class "qbd-output",
 * and obfuscates all other text using DictionaryObfuscatorStrategy
 */
export class HTMLObfuscatorStrategy extends BaseObfuscatorStrategy {
  // Pass the same dictionary instance that obfuscates the database columns. The word cache then
  // gives a value inside document HTML the same replacement as the matching column value, so the
  // app can still join them, for example an acceptance criteria group and label.
  constructor(
    dictionaryObfuscatorStrategy = new DictionaryObfuscatorStrategy(),
    linkObfuscatorStrategy = new LinkObfuscatorStrategy(
      dictionaryObfuscatorStrategy,
    ),
  ) {
    super();
    this._dictionaryObfuscatorStrategy = dictionaryObfuscatorStrategy;
    this._linkObfuscatorStrategy = linkObfuscatorStrategy;
  }

  obfuscateString(someString) {
    if (!someString) {
      return someString;
    }

    try {
      const root = parse(someString);
      this._processTextNodes(root);
      return root.toString();
    } catch (error) {
      return this._dictionaryObfuscatorStrategy.obfuscateString(someString);
    }
  }

  _processTextNodes(node) {
    // nodeType 3 is a text node. We want to obfuscate text nodes only.
    if (node.nodeType === 3) {
      const text = node.text;
      if (text && text.trim()) {
        if (!this._isInsideQbdOutput(node)) {
          node.textContent =
            this._dictionaryObfuscatorStrategy.obfuscateString(text);
        }
      }
    } else {
      // For element nodes (nodeType === 1), obfuscate attribute values
      if (node.nodeType === 1 && node.attributes) {
        this._obfuscateAttributes(node);
      }

      if (node.childNodes && node.childNodes.length > 0) {
        node.childNodes.forEach((childNode) => {
          this._processTextNodes(childNode);
        });
      }
    }
  }

  /**
   * Decides whether a value is human text that is safe to replace with random words.
   * @param value The trimmed attribute or JSON string value.
   */
  _isText(value) {
    return !VALUE_IS_NOT_TEXT.some((pattern) => pattern.test(value));
  }

  _obfuscateAttributes(node) {
    // Get all attribute names from the node
    const attributeNames = Object.keys(node.attributes);
    for (const attributeName of attributeNames) {
      const currentValue = node.getAttribute(attributeName);
      if (
        !currentValue ||
        typeof currentValue !== "string" ||
        !currentValue.trim()
      ) {
        continue;
      }

      if (PROTECTED_ATTRIBUTES.has(attributeName.toLowerCase())) {
        continue;
      }

      const trimmedValue = currentValue.trim();

      if (attributeName.toLowerCase() === "data-record-path") {
        node.setAttribute(
          attributeName,
          this._obfuscateRecordPath(currentValue),
        );
        continue;
      }

      // An inline image. Word replacement turns the base64 into something like "back:women/the",
      // which is not a valid URL, so the browser reports an unknown scheme and every document
      // loses its images. A blank image keeps the tag valid and shows nothing of the original.
      if (/^data:/i.test(trimmedValue)) {
        node.setAttribute(attributeName, BLANK_IMAGE);
        continue;
      }

      // Obfuscate JSON by walking the parsed object, never as plain text. Word replacement keeps
      // punctuation but not quoting, so a boolean like true turns into a bare word that breaks
      // the JSON.
      if (trimmedValue.startsWith("{") || trimmedValue.startsWith("[")) {
        node.setAttribute(
          attributeName,
          this._obfuscateObjectAttributeValue(currentValue),
        );
        continue;
      }

      if (!this._isText(trimmedValue)) {
        continue;
      }

      const obfuscatedValue =
        this._dictionaryObfuscatorStrategy.obfuscateString(currentValue);
      node.setAttribute(attributeName, obfuscatedValue);
    }
  }

  /**
   * Obfuscates a data-record-path one step at a time. Document Builder resolves the record from the
   * type code and the trailing field name, so both stay. Only the record name is replaced, and the
   * word cache gives it the same replacement as the matching row in the database.
   * @param attributeValue The raw data-record-path attribute value.
   */
  _obfuscateRecordPath(attributeValue) {
    try {
      const path = JSON.parse(attributeValue);
      if (!Array.isArray(path)) {
        return attributeValue;
      }

      return JSON.stringify(
        path.map((step) => {
          if (typeof step !== "string") {
            return step;
          }

          const match = RECORD_PATH_STEP.exec(step);
          if (!match) {
            // A plain step is a field name, which is part of the schema.
            return step;
          }

          const name = this._dictionaryObfuscatorStrategy.obfuscateString(
            match[2],
          );
          return `${match[1]}[name='${name}']`;
        }),
      );
    } catch {
      return this._dictionaryObfuscatorStrategy.obfuscateString(attributeValue);
    }
  }

  _obfuscateObjectAttributeValue(attributeValue) {
    try {
      const obj = JSON.parse(attributeValue);
      for (const key in obj) {
        const value = obj[key];
        const keyName = String(key).toLowerCase();

        // The matching column runs through the same strategy, so the image lookup by S3TmpKey
        // still finds its entry.
        if (isLinkField(keyName) || isLinksField(keyName)) {
          obj[key] = this._linkObfuscatorStrategy.obfuscateValue(
            keyName,
            value,
          );
          continue;
        }

        if (
          PROTECTED_ATTRIBUTES.has(keyName) ||
          SCHEMA_JSON_KEYS.has(keyName)
        ) {
          continue;
        }

        if (typeof value === "object" && value !== null) {
          obj[key] = JSON.parse(
            this._obfuscateObjectAttributeValue(JSON.stringify(value)),
          );
        } else if (value && typeof value === "string") {
          const trimmedValue = value.trim();
          // A string value that holds JSON stays as it is. The matching database columns hold
          // the same JSON and the column rules skip them, so both copies must stay equal.
          if (trimmedValue.startsWith("{") || trimmedValue.startsWith("[")) {
            continue;
          }

          if (this._isText(trimmedValue)) {
            obj[key] =
              this._dictionaryObfuscatorStrategy.obfuscateString(value);
          }
        }
      }
      return JSON.stringify(obj);
    } catch {
      return this._dictionaryObfuscatorStrategy.obfuscateString(attributeValue);
    }
  }

  _isInsideQbdOutput(node) {
    let current = node.parentNode;

    while (current) {
      if (current.nodeType === 1) {
        const classAttr = current.getAttribute("class");
        if (classAttr && classAttr.includes("qbd-output")) {
          return !classAttr.includes("qbd-output-direct-scope-widget");
        }
      }
      current = current.parentNode;
    }

    return false;
  }
}
