import logger from '../../config/LogConfig.js';

/**
 * This obfuscator doesn't obfuscate at all. For example, "I love dogs" would get returned as "I love dogs".
 */
export class NoObfuscatorStrategy {

  obfuscateUncachedString(string) {
    const stringPattern = /(\w+)/g; // Matches strings within quotes
    const obfuscatedString = string?.replace(stringPattern, (match, p1) => `${this.obfuscateUncachedStringHelper(p1)}`);

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
