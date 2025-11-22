import winston from 'winston';

import { env } from '../config/env';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp: time, ...meta }) => {
  const metaString =
    Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${time}] ${level}: ${message}${metaString}`;
});

export const logger = winston.createLogger({
  level: env.logLevel,
  format: combine(timestamp(), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), logFormat),
    }),
  ],
});

export type Logger = typeof logger;
