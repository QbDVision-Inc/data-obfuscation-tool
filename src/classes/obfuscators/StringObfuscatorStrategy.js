import { WordObfuscatorStrategy } from "./WordObfuscatorStrategy.js";

/**
 * This obfuscator replaces everything but the first 2 characters with XX. So `The cat ran across the street.` would
 * become `TXX cXX rXX aXXXXX tXX sXXXXX.`.
 */
export class StringObfuscatorStrategy extends WordObfuscatorStrategy {

  obfuscateUncachedStringHelper(value) {
    const [a] = value;
    return `${a}{'X'.repeat(value.length - 1)}`;
  }
}
