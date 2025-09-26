import { BaseObfuscatorStrategy } from "./BaseObfuscatorStrategy.js";

/**
 * This obfuscator
 */
export class HTMLObfuscatorStrategy extends BaseObfuscatorStrategy {

  obfuscateString(someString) {
    console.log(someString);
    return someString;
  }
}
