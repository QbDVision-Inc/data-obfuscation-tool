import { BaseObfuscatorStrategy } from "./BaseObfuscatorStrategy.js";
import { parse } from "node-html-parser";
import { DictionaryObfuscatorStrategy } from "./DictionaryObfuscatorStrategy.js";

/**
 * This obfuscator preserves HTML tags and attributes, preserves text in elements with class "qbd-output",
 * and obfuscates all other text using WordObfuscatorStrategy
 */
export class HTMLObfuscatorStrategy extends BaseObfuscatorStrategy {
  constructor() {
    super();
    this._dictionaryObfuscatorStrategy = new DictionaryObfuscatorStrategy();
  }

  obfuscateString(someString) {
    if (!someString || typeof someString !== "string") {
      return someString;
    }

    try {
      const root = parse(someString);

      this._processTextNodes(root);
      console.log(root.toString());

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
    const protectedAttributes = new Set([
      'class',
      'kind',
      'style',
      'contenteditable',
      'referenceblockname',
      'referenceblock',
      'process',
      'unitoperation',
      'data-record-id',
      'data-record-model-name',
      'data-record-column-name',
      'data-never-approved',
      'data-record-sub-model-name',
      'data-record-sub-model-data'
    ]);

    // Get all attribute names from the node
    const attributeNames = Object.keys(node.attributes);
    for (const attName of attributeNames) {
      const currentValue = node.getAttribute(attrName);
      if (!currentValue || typeof currentValue !== 'string' || !currentValue.trim()) {
        continue;
      }

      if (protectedAttributes.has(attName)) {
        continue;
      }

      const obfuscatedValue = this._dictionaryObfuscatorStrategy.obfuscateString(currentValue);
      node.setAttribute(attrName, obfuscatedValue);
    }
  }

  _isInsideQbdOutput(node) {
    let current = node.parentNode;

    while (current) {
      if (current.nodeType === 1) {
        const classAttr = current.getAttribute("class");
        if (classAttr && classAttr.includes("qbd-output")) {
          return true;
        }
      }
      current = current.parentNode;
    }

    return false;
  }
}
