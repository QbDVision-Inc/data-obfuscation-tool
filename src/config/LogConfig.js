import pino from 'pino';

/**
 * To see debug logs, set the environment variable PINO_LOG_LEVEL to 'debug'. ex:
 *    Linux: export PINO_LOG_LEVEL=debug
 *    Windows: set PINO_LOG_LEVEL=debug
 */
export default pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  },
  level: process.env.PINO_LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
});
