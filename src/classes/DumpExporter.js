"use strict";

const {exec} = require('child_process');
const util = require('util');
const logger = require('../config/LogConfig');
const execAsync = util.promisify(exec);

class DumpExporter {

  constructor(dbConfig, outputPath) {
    this.host = dbConfig.host;
    this.user = dbConfig.username;
    this.password = dbConfig.password;
    this.database = dbConfig.database;
    this.outputPath = outputPath;
  }

  async exportDump() {

    try {

      const command = `mysqldump -h ${this.host} -u ${this.user} --password=${this.password} ${this.database} > ${this.outputPath}`;
      await execAsync(command);
      logger.info(`Database dump exported successfully to ${this.outputPath}`);

    } catch (error) {
      logger.error('An unexpected error occurred while exporting database dump', error);
      throw error;
    }
  }

}

module.exports = DumpExporter;