import { BaseObfuscatorStrategy } from "./BaseObfuscatorStrategy.js";

/**
 * This obfuscator doesn't obfuscate at all. For example, "I love dogs" would get returned as "I love dogs".
 */
export class NoObfuscatorStrategy extends BaseObfuscatorStrategy {

  obfuscateString(someString) {
    return someString;
  }
}
