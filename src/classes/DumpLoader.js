import { exec } from 'child_process';
import { Sequelize } from 'sequelize';
import util from 'util';
import logger from '../config/LogConfig.js';
import { createReadStream, createWriteStream } from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

const execAsync = util.promisify(exec);

export default class DumpLoader {

  constructor(dbConfig, dumpFilePath) {
    this.host = dbConfig.host;
    this.user = dbConfig.username;
    this.password = dbConfig.password;
    this.database = dbConfig.database;
    this.port = dbConfig.port;
    this.dialect = dbConfig.dialect;
    this.dumpFilePath = dumpFilePath;
    this.sequelize = new Sequelize(dbConfig);
  }

  async ensureSchemaExists() {
    try {

      await new Sequelize({
        host: this.host,
        username: this.user,
        password: this.password,
        database: "sys",
        port: this.port,
        dialect: this.dialect
      }).query(`CREATE DATABASE IF NOT EXISTS ${this.database}`);

      logger.info(`Database ${this.database} created or already exists.`);

    } catch (e) {
      logger.error(e, `An unexpected error occurred while creating temporary obfuscation database`);
      throw e;
    }
  }

  async filterOutSchemaStatements() {

    // Temp dump file.
    const tempFilePath = path.join(os.tmpdir(), `temp-dump-${Date.now()}.sql`);

    const readStream = createReadStream(this.dumpFilePath);
    const writeStream = createWriteStream(tempFilePath);

    try {
      const reader = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity
      });

      for await (const line of reader) {
        let modifiedLine = line;

        // Modify the line to comment out specific SQL statements
        if (line.match(/^(.*DROP DATABASE.*?;|.*CREATE DATABASE.*?;|USE .*?;)/i)) {
          modifiedLine = '-- ' + line;
        }

        writeStream.write(modifiedLine + '\n');
      }

      readStream.close();
      writeStream.close();

    } catch (e) {
      logger.error(e, 'An unexpected error occurred while removing the schema from the dump file');
      throw e;
    }

    return tempFilePath;
  };

  async loadDump() {

    let tempDumpFilePath;
    try {

      // Remove the exported schema from the dump file if exists.
      tempDumpFilePath = await this.filterOutSchemaStatements();

      // Create the temp database if not existing.
      await this.ensureSchemaExists();

      await this.sequelize.authenticate();
      logger.info('Connection to the temporary obfuscation database established successfully.');

      // Load the dump file
      logger.info('Loading dump file...');
      await this.load(tempDumpFilePath);
      logger.info(`Database loaded from the dump file < ${tempDumpFilePath}`);

    } catch (e) {
      logger.error(e, `An unexpected error occurred while loading the dump file < ${tempDumpFilePath} `);
      throw e;
    } finally {
      await this.sequelize.close();
    }
  }

  async load(dumpFilePath) {
    const command = `mysql -h ${this.host} -u ${this.user} -p${this.password} --port=${this.port} ${this.database} < ${dumpFilePath}`;
    await execAsync(command);
  }
}
