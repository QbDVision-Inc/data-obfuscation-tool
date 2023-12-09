import fs from 'fs';
import yaml from 'js-yaml';
import logger from '../config/LogConfig.js';

export function loadConfig(configFile) {
  try {
    const fileContents = fs.readFileSync(configFile, 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    logger.error(e, `An unexpected error occurred while loading config file ${configFile}`);
    throw e;
  }
}
