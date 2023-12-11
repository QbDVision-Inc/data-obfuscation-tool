"use strict";

const logger = require('../config/LogConfig');
class ObfuscationStrategies {

  constructor(algorithm) {
    this.algorithm = algorithm;
    logger.info(`Algorithm "${algorithm.name}" picked up for obfuscating values`);
    this.cache = new Map();
  }

  defaultAlgorithm(value) {
    if (value?.length > 0) {
      const [a] = value;
      return `${a}${'X'.repeat(value.length - 1)}`;
    }
    return value;
  }

  xorAlgorithm(input, key) {
    let output = "";

    for (let i = 0; i < input.length; i++) {
      if (/\d/.test(input[i])) { // Check if the character is a digit
        output += input[i]; // If it's a digit, add it to output without change
      } else {
        let charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        output += String.fromCharCode(charCode);
      }
    }

    return output;
  }

  runObfuscationAlgorithm(value) {

    const {name} = this.algorithm;

    if (!name) {
      return this.defaultAlgorithm(value);
    } else if (name === "xor") {
      const {key} = this.algorithm;
      return this.xorAlgorithm(value, key);
    } else {
      throw Error(`Algorithm "${name}" is not implemented, please provide an implementation function for the specified algorithm!`).name;
    }

  }

  execute(value, strategy) {
    if (!strategy) {
      return this.stringObfuscate(value);
    }
    return this[strategy](value);
  }

  stringObfuscate(string) {

    // Check if the string has been obfuscated before
    if (this.cache.has(string)) {
      logger.debug(`Cached obfuscated value ${this.cache.get(string)}`);
      return this.cache.get(string);
    }

    const stringPattern = /(\w+)/g; // Matches strings within quotes
    const obfuscatedString = string?.replace(stringPattern, (match, p1) => `${this.runObfuscationAlgorithm(p1)}`);

    // Cache the obfuscated string
    this.cache.set(string, obfuscatedString);

    logger.debug(`Obfuscate valued ${obfuscatedString}`);
    return obfuscatedString;
  }

  nameObfuscate(name) {
    return this.stringObfuscate(name);
  }

  requestContextObfuscate(value) {
    return value;
  }

}

module.exports = ObfuscationStrategies;