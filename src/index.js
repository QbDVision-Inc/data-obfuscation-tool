import DumpLoader from "./classes/DumpLoader.js";
import Obfuscator from "./classes/Obfuscator.js";
import DumpExporter from "./classes/DumpExporter.js";
import path from "path";
import {loadConfig} from "./utilities/ConfigUtillities.js";

import logger from "./config/LogConfig.js";

const obfuscationCfg = path.join('obfuscationCfg.yaml');
const {database, inputDump, outputDump} = loadConfig('config.yaml');

/**
 * Main entry point.
 * @returns {Promise<void>}
 */
async function main() {

  try {
    await new DumpLoader(database, inputDump).loadDump();
  } catch (e) {
    logger.error(e, 'Failed to load initial dump');
    process.exit(1);
  }

  try {
    await new Obfuscator(database, obfuscationCfg).obfuscateData();
  } catch (e) {
    logger.error(e, 'Failed to obfuscate the data');
    process.exit(1);
  }

  try {
    await new DumpExporter(database, outputDump).exportDump();
  } catch (e) {
    logger.error(e, 'Failed to export the data dump');
    process.exit(1);
  }

}

main();
