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
    this.stringObfuscator = new DictionaryObfuscatorStrategy();
  }

  obfuscateString(someString) {
    if (!someString || typeof someString !== "string") {
      return someString;
    }

    try {
      const root = parse(someString);

      this.processTextNodes(root);
      console.log(root.toString());

      return root.toString();
    } catch (error) {
      return this.stringObfuscator.obfuscateString(someString);
    }
  }

  processTextNodes(node) {
    // nodeType 3 is a text node. We want to obfuscate text nodes only.
    if (node.nodeType === 3) {
      const text = node.text;
      if (text && text.trim()) {
        if (!this.isInsideQbdOutput(node)) {
          node.textContent = this.stringObfuscator.obfuscateString(text);
        }
      }
    } else if (node.childNodes && node.childNodes.length > 0) {
      node.childNodes.forEach((childNode) => {
        this.processTextNodes(childNode);
      });
    }
  }

  isInsideQbdOutput(node) {
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
