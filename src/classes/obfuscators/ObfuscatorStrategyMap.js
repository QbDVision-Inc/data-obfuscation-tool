import { StringObfuscatorStrategy } from "./StringObfuscatorStrategy.js";
import { XORObfuscatorStrategy } from "./XORObfuscatorStrategy.js";
import { NoObfuscatorStrategy } from "./NoObfuscatorStrategy.js";
import { DictionaryObfuscatorStrategy } from "./DictionaryObfuscatorStrategy.js";
import { HTMLObfuscatorStrategy } from "./HTMLObfuscatorStrategy.js";
import { LinkObfuscatorStrategy } from "./LinkObfuscatorStrategy.js";

/**
 * This is the central index of all obfuscator strategies.
 */
// One dictionary shared between the column path and the HTML path, so a column value and its
// copy inside document HTML get the same replacement and the app can still match them.
const dictionaryObfuscatorStrategy = new DictionaryObfuscatorStrategy();
// One link obfuscator for the column path and the HTML path, so both copies of a link come out
// with the same value.
const linkObfuscatorStrategy = new LinkObfuscatorStrategy(
  dictionaryObfuscatorStrategy,
);

const ObfuscatorStrategyMap = {
  stringObfuscator: new StringObfuscatorStrategy(),
  xorObfuscator: new XORObfuscatorStrategy(),
  dictionaryObfuscator: dictionaryObfuscatorStrategy,
  noObfuscator: new NoObfuscatorStrategy(),
  htmlObfuscator: new HTMLObfuscatorStrategy(
    dictionaryObfuscatorStrategy,
    linkObfuscatorStrategy,
  ),
  linkObfuscator: linkObfuscatorStrategy,
};

export default ObfuscatorStrategyMap;
