"use strict";

const logger = require('../config/LogConfig');

let cache = new Map();

function obfuscate(value) {
  if (value?.length > 1) {
    const [a, b] = value;
    return `${a}${b}${'X'.repeat(value.length - 2)}`;
  }
  return value;
}

function stringObfuscate(string) {

  // Check if the string has been obfuscated before
  if (cache.has(string)) {
    logger.debug(`Cached obfuscated value ${cache.get(string)}`);
    return cache.get(string);
  }

  const stringPattern = /(\w+)/g; // Matches strings within quotes
  const obfuscatedString = string?.replace(stringPattern, (match, p1) => `${obfuscate(p1)}`);

  // Cache the obfuscated string
  cache.set(string, obfuscatedString);

  logger.debug(`Obfuscate valued ${obfuscatedString}`);
  return obfuscatedString;
}

function nameObfuscate(name) {
  return stringObfuscate(name);
}

function requestContextObfuscate(value) {
  return value;
}

module.exports = {stringObfuscate, nameObfuscate, requestContextObfuscate};
