import logger from '../../config/LogConfig.js';

/**
 * This is the base class that just caches the results of whatever extends it so they same string is obfuscated in the
 * same way every time.
 */
export class BaseCacheObfuscatorStrategy {
  constructor() {
    this.cache = new Map();
  }

  obfuscateString(someString) {
    // Check if the string has been obfuscated before
    if (this.cache.has(someString)) {
      logger.debug(`Cached obfuscated value ${this.cache.get(someString)}`);
      return this.cache.get(someString);
    }

    const obfuscatedString = this.obfuscateUncachedString(someString);

    // Cache the obfuscated string
    this.cache.set(someString, obfuscatedString);

    logger.debug(`Obfuscate valued ${obfuscatedString}`);
    return obfuscatedString;
  }

  /**
   * Child classes should implement this to return an obfuscated string.
   * @param someString The string to obfuscate.
   */
  obfuscateUncachedString(someString) {
    throw new Error("Implement me.");
  }
}
