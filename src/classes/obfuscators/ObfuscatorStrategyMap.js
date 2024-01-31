import { StringObfuscatorStrategy } from "./StringObfuscatorStrategy.js";
import { XORObfuscatorStrategy } from "./XORObfuscatorStrategy.js";
import { NoObfuscatorStrategy } from "./NoObfuscatorStrategy.js";
import { DictionaryObfuscatorStrategy } from "./DictionaryObfuscatorStrategy.js";

/**
 * This is the central index of all obfuscator strategies.
 */
const ObfuscatorStrategyMap = {
  stringObfuscator: new StringObfuscatorStrategy(),
  xorObfuscator: new XORObfuscatorStrategy(),
  dictionaryObfuscator: new DictionaryObfuscatorStrategy(),
  noObfuscator: new NoObfuscatorStrategy(),
}

export default ObfuscatorStrategyMap;
