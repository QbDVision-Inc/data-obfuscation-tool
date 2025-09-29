import { BaseObfuscatorStrategy } from "./BaseObfuscatorStrategy.js";
import { parse } from "node-html-parser";
import { DictionaryObfuscatorStrategy } from "./DictionaryObfuscatorStrategy.js";

// Those attributes are from widget_node and qbd_field_node in the main repo https://github.com/QbDVision-Inc/qbdvision
const PROTECTED_ATTRIBUTES = new Set([
  'class',
  'kind',
  'model',
  'style',
  'contenteditable',
  'referenceblockname',
  'referenceblock',
  'data-record-id',
  'data-record-model-name',
  'data-record-column-name',
  'data-never-approved',
  'data-record-sub-model-name',
  'data-record-sub-model-data',
  'modelName',
  'typeCode'
]);

/**
 * This obfuscator preserves HTML tags and attributes, preserves text in elements with class "qbd-output",
 * and obfuscates all other text using DictionaryObfuscatorStrategy
 */
export class HTMLObfuscatorStrategy extends BaseObfuscatorStrategy {
  constructor() {
    super();
    this._dictionaryObfuscatorStrategy = new DictionaryObfuscatorStrategy();
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
          node.textContent = this._dictionaryObfuscatorStrategy.obfuscateString(text);
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

  _obfuscateAttributes(node) {
    const ATTRIBUTE_WITH_OBJECT_VALUE = new Set([
      "process",
      "unitoperation"
    ]);

    // Get all attribute names from the node
    const attributeNames = Object.keys(node.attributes);
    for (const attributeName of attributeNames) {
      const currentValue = node.getAttribute(attributeName);
      if (!currentValue || typeof currentValue !== 'string' || !currentValue.trim()) {
        continue;
      }

      if (ATTRIBUTE_WITH_OBJECT_VALUE.has(attributeName)) {
        node.setAttribute(attributeName, this._obfuscateObjectAttributeValue(currentValue));
        continue;
      }

      if (PROTECTED_ATTRIBUTES.has(attributeName)) {
        continue;
      }

      const obfuscatedValue = this._dictionaryObfuscatorStrategy.obfuscateString(currentValue);
      node.setAttribute(attributeName, obfuscatedValue);
    }
  }

  _obfuscateObjectAttributeValue(attributeValue) {
    try {
      const obj = JSON.parse(attributeValue);
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          obj[key] = JSON.parse(this._obfuscateObjectAttributeValue(JSON.stringify(obj[key])));
        } else if (obj[key] && typeof obj[key] === "string" && !PROTECTED_ATTRIBUTES.has(key)) {
          obj[key] = this._dictionaryObfuscatorStrategy.obfuscateString(obj[key]);
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
