"use strict"

const fs = require('fs');
const yaml = require('js-yaml');
const logger = require('../config/LogConfig');

function loadConfig(configFile) {
  try {
    const fileContents = fs.readFileSync(configFile, 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    logger.error(`An unexpected error occurred while loading config file ${configFile}`, e);
    throw e;
  }
}

module.exports = {loadConfig}