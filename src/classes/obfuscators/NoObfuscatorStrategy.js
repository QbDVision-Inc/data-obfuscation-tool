import logger from '../../config/LogConfig.js';

/**
 * This obfuscator doesn't obfuscate at all. For example, "I love dogs" would get returned as "I love dogs".
 */
export class NoObfuscatorStrategy {

  obfuscateString(someString) {
    return someString;
  }
}
