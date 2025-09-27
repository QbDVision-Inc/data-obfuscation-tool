import { BaseObfuscatorStrategy } from "./BaseObfuscatorStrategy.js";
import { WordObfuscatorStrategy } from "./WordObfuscatorStrategy.js";
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
      // Parse the HTML string
      const root = parse(someString);

      // Process all text nodes starting from the root
      this.processTextNodes(root);
      console.log(root.toString());

      // Return the modified HTML
      return root.toString();
    } catch (error) {
      // If parsing fails, fall back to treating as plain text
      return this.stringObfuscator.obfuscateString(someString);
    }
  }

  processTextNodes(node) {
    // If this is a text node, obfuscate it unless it's inside a qbd-output element
    if (node.nodeType === 3) {
      // Text node
      const text = node.text;
      if (text && text.trim()) {
        // Check if this text node is inside an element with class "qbd-output"
        if (!this.isInsideQbdOutput(node)) {
          node.textContent = this.stringObfuscator.obfuscateString(text);
        }
      }
    } else if (node.childNodes && node.childNodes.length > 0) {
      // Recursively process child nodes
      node.childNodes.forEach((childNode) => {
        this.processTextNodes(childNode);
      });
    }
  }

  isInsideQbdOutput(node) {
    let current = node.parentNode;

    while (current) {
      if (current.nodeType === 1) {
        // Element node
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
