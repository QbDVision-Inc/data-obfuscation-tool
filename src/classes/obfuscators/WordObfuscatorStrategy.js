import logger from '../../config/LogConfig.js';
import { BaseCacheObfuscatorStrategy } from "./BaseCacheObfuscatorStrategy.js";

/**
 * This obfuscator is a base class that just makes sure that each word in a string is obfuscated separately.
 */
export class WordObfuscatorStrategy extends BaseCacheObfuscatorStrategy {

  obfuscateUncachedString(someString) {
    const stringPattern = /(\w+)/g; // Matches strings within quotes
    const obfuscatedString = someString?.replace(stringPattern, (match, p1) => {
      if (p1?.length > 1) {
        return this.obfuscateUncachedStringHelper(p1);
      } else {
        return p1;
      }
    });

    logger.debug(`Obfuscated value for "${someString}" is "${obfuscatedString}"`);
    return obfuscatedString;
  }

  obfuscateUncachedStringHelper(value) {
    // Implement this method in child classes.
    throw new Error("Implement me");
  }
}
