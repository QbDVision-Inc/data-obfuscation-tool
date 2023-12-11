import { StringObfuscatorStrategy } from "./StringObfuscatorStrategy.js";
import { NoObfuscatorStrategy } from "./NoObfuscatorStrategy.js";

/**
 * This is the central index of all obfuscator strategies.
 */


const ObfuscatorStrategyMap = {
  stringObfuscator: new StringObfuscatorStrategy(),
  noObfuscator: new NoObfuscatorStrategy(),
}

export default ObfuscatorStrategyMap;
