import { WordObfuscatorStrategy } from "./WordObfuscatorStrategy.js";
import { words } from "popular-english-words"

/**
 * This obfuscator replaces everything with random popular words from the english dictionary. So `The cat ran across the street.` would
 * become `And sat pin lasts son palace.`.
 */
export class DictionaryObfuscatorStrategy extends WordObfuscatorStrategy {

  obfuscateUncachedStringHelper(value) {
    const wordsArray = words.getMostPopularLength(100, value.length);
    // For long enough words, there may be no word long enough.
    if (wordsArray.length === 0) {
      const numOfFourLetterWords = value.length / 4;
      const fourLetterWords = words.getMostPopularLength(100, 4);
      let word = "";
      for (let i = 0; i < numOfFourLetterWords; i++) {
        const randomFourLetterWord = fourLetterWords[Math.floor(Math.random() * fourLetterWords.length)];
        word += randomFourLetterWord[0].toUpperCase() + randomFourLetterWord.slice(1);
      }
      wordsArray.push(word);
    }
    const randomIndex = Math.floor(Math.random() * wordsArray.length);
    let word = wordsArray[randomIndex];
    // Capitalize the first letter, if the original word was capitalized
    if (value[0] === value[0].toUpperCase()) {
      word = word[0].toUpperCase() + word.slice(1);
    }
    return word;
  }
}
