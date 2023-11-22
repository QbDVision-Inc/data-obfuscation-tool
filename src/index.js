"use strict";

const DumpLoader = require('../src/classes/DumpLoader');
const Obfuscator = require("./classes/Obfuscator");
const DumpExporter = require("./classes/DumpExporter");
const path = require('path');
const {loadConfig} = require('./utilities/ConfigUtillities');

const logger = require('./config/LogConfig');

const obfuscationCfg = path.join(__dirname, 'config', 'obfuscationCfg.yaml');
const {database, inputDump, outputDump} = loadConfig('config.yaml');

/**
 * Main entry point.
 * @returns {Promise<void>}
 */
async function main() {

  try {
    await new DumpLoader(database, inputDump).loadDump();
  } catch (e) {
    logger.error('Failed to load initial dump', e);
    process.exit(1);
  }

  try {
    await new Obfuscator(database, obfuscationCfg).obfuscateData();
  } catch (e) {
    process.exit(1);
  }

  try {
    await new DumpExporter(database, outputDump).exportDump();
  } catch (e) {
    logger.error('Failed to export the data dump', e);
  }

}

main();
