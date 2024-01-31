import logger from '../../config/LogConfig.js';
import { BaseCacheObfuscatorStrategy } from "./BaseCacheObfuscatorStrategy.js";

/**
 * This obfuscator replaces everything but the first 2 characters with XX. So `The cat ran across the street.` would
 * become `ThX caX raX acXXXX thX stXXXX.`.
 */
export class StringObfuscatorStrategy extends BaseCacheObfuscatorStrategy {

  obfuscateUncachedString(someString) {
    const stringPattern = /(\w+)/g; // Matches strings within quotes
    const obfuscatedString = someString?.replace(stringPattern, (match, p1) => `${this.obfuscateUncachedStringHelper(p1)}`);

    logger.debug(`Obfuscate valued ${obfuscatedString}`);
    return obfuscatedString;
  }

  obfuscateUncachedStringHelper(value) {
    if (value?.length > 1) {
      const [a, b] = value;
      return `${a}${b}${'X'.repeat(value.length - 2)}`;
    }
    return value;
  }
}
