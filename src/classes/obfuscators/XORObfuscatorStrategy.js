import { WordObfuscatorStrategy } from "./WordObfuscatorStrategy.js";

/**
 * This obfuscator replaces everything with XOR'd characters. So `The cat ran across the street.` would
 * become `wtt sre pwd widsqe qhu hwpskd.`.
 */
export class XORObfuscatorStrategy extends WordObfuscatorStrategy {
  constructor() {
    super();
    // Initialize with a random key between 00 and 99
    this.key = Math.random().toString().substring(2, 4);
  }

  obfuscateUncachedStringHelper(input) {
    let output = "";

    for (let i = 0; i < input.length; i++) {
      if (/\d/.test(input[i])) { // Check if the character is a digit
        output += input[i]; // If it's a digit, add it to output without change
      } else {
        let charCode = input.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length);
        output += String.fromCharCode(charCode);
      }
    }

    return output;
  }
}
