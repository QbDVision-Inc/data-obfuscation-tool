import {exec} from 'child_process';
import util from 'util';
import logger from '../config/LogConfig.js';

const execAsync = util.promisify(exec);

export default class DumpExporter {

  constructor(dbConfig, outputPath) {
    this.host = dbConfig.host;
    this.user = dbConfig.username;
    this.password = dbConfig.password;
    this.database = dbConfig.database;
    this.port = dbConfig.port;
    this.outputPath = outputPath;
  }

  async exportDump() {

    try {

      logger.info(`Exporting data to ${this.outputPath}...`);
      const command = `mysqldump -h ${this.host} -u ${this.user} --password=${this.password} --port=${this.port} ${this.database} > ${this.outputPath}`;
      await execAsync(command);
      logger.info(`Database dump exported successfully to ${this.outputPath}`);

    } catch (error) {
      logger.error(error, 'An unexpected error occurred while exporting database dump');
      throw error;
    }
  }

}
