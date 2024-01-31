import {Sequelize} from 'sequelize';
import {loadConfig} from '../utilities/ConfigUtillities.js';
import ObfuscatorStrategyMap from './obfuscators/ObfuscatorStrategyMap.js';
import logger from '../config/LogConfig.js';

/**
 * This class goes through all MySQL tables and obfuscates all the data in all the columns.
 */
export default class Obfuscator {

  constructor(dbConfig, configFile) {
    this.sequelize = new Sequelize(dbConfig);
    this.rules = loadConfig(configFile);
  }

  getTypeCategory(columnType) {
    const baseType = columnType.toLowerCase();

    if (baseType.startsWith('char') ||
      baseType.startsWith('varchar') ||
      baseType.startsWith('tinytext') ||
      baseType.startsWith('text') ||
      baseType.startsWith('mediumtext') ||
      baseType.startsWith('longtext')) {
      return 'string';
    }

    return columnType;
  }

  async obfuscateData() {
    logger.info('Obfuscating data from all tables...');
    try {
      const tables = await this.sequelize.getQueryInterface().showAllTables();
      for (const tableName of tables) {
        await this.obfuscate(tableName);
      }
    } catch (error) {
      logger.error(error, `An unexpected error occurred while obfuscating data`);
      throw error;
    }
  }

  async obfuscate(tableName) {

    logger.info(`Obfuscating table ${tableName}`);

    const tableRule = this.rules.tables.find(table => table.name === tableName);

    if (tableRule?.ignore) {
      logger.info(`Ignoring table ${tableName}`);
      return;
    }

    const columns = await this.sequelize.getQueryInterface().describeTable(tableName);

    let isUpdated = false;
    const records = await this.sequelize.query(`SELECT * FROM ${tableName}`, {type: Sequelize.QueryTypes.SELECT});
    for (const record of records) {

      for (const [columnName, columnDetails] of Object.entries(columns)) {

        const columnRule = tableRule?.columns?.find(col => col.name === columnName);
        const columnTypeCategory = this.getTypeCategory(columnDetails.type);
        const generalRule = this.rules.general.find(rule => rule.type === columnTypeCategory);

        const ruleToApply = columnRule || generalRule;
        const {obfuscationRule, ignorePattern, ignore = false} = ruleToApply || {};

        logger.debug(`Processing Table ${tableName} for value ${record[columnName]}`);
        if (ruleToApply && this.shouldObfuscate(tableName, columnName, record, ignorePattern)) {
          logger.debug(`Applied rule ${obfuscationRule}, Pattern to ignore ${ignorePattern} for value ${record[columnName]}`);
          record[columnName] = ObfuscatorStrategyMap[obfuscationRule].obfuscateString(record[columnName]);
          isUpdated = true;
        }
      }
    }

    const CHUNK_SIZE = 10000;
    const DISABLE_FK_CHECKS = 'SET FOREIGN_KEY_CHECKS = 0;';
    const ENABLE_FK_CHECKS = 'SET FOREIGN_KEY_CHECKS = 1;';

    if (isUpdated) {
      logger.debug("Before saving obfuscated rows to the database.");

      try {
        await this.sequelize.query(DISABLE_FK_CHECKS, {raw: true});

        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
          const chunk = records.slice(i, i + CHUNK_SIZE);
          await this.sequelize.getQueryInterface().bulkInsert(tableName, chunk, {
            updateOnDuplicate: Object.keys(columns)
          });
          logger.debug(`Saved ${chunk.length} obfuscated rows for table ${tableName} to the database`);
        }

      } catch (error) {
        logger.error(error, `Error updating table ${tableName}: ${error.message}`);
        throw error;
      } finally {
        await this.sequelize.query(ENABLE_FK_CHECKS, {raw: true});
      }
    }

  }

  shouldObfuscate(table, column, record, ignore, ignorePattern) {
    if (ignore) {
      return false;
    }

    if (ignorePattern === null) {
      return true;
    }

    const columnRule = this.rules.columns.find(col => col.name === column);
    if (columnRule?.ignore) {
      return false;
    }

    const value = record[column];

    const regex = new RegExp(ignorePattern, 'i');
    let isMatchingIgnorePattern = regex.test(value);

    if (isMatchingIgnorePattern) {
      logger.debug(`${table} => column '${column}' with value ${record[column]} will be excluded from obfuscation`);
    }

    return !isMatchingIgnorePattern;
  }

}
