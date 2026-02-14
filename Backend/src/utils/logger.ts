import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

class Logger {
  private logDir: string;
  private logLevel: LogLevel;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logLevel = this.getLogLevel();
    this.ensureLogDir();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    return LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(_level);
    return requestedLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  private writeToFile(level: LogLevel, message: string) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}.log`;
    const filepath = path.join(this.logDir, filename);
    
    fs.appendFile(filepath, message + '\n', (err) => {
      if (err) console.error('Failed to write to log file:', err);
    });
  }

  private log(level: LogLevel, message: string, meta?: any) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);

    // Console output with colors
    const colors: Record<LogLevel, string> = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[90m', // Gray
    };
    const reset = '\x1b[0m';

    console.log(`${colors[level]}${formattedMessage}${reset}`);

    // File output (always write errors and warnings)
    if (level === LogLevel.ERROR || level === LogLevel.WARN) {
      this.writeToFile(level, formattedMessage);
    }
  }

  error(message: string, error?: Error | any) {
    const meta = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    this.log(LogLevel.ERROR, message, meta);
  }

  warn(message: string, meta?: any) {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  // Specialized logging methods
  request(req: any) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  response(req: any, res: any, responseTime: number) {
    this.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
  }

  database(query: string, duration: number) {
    this.debug('Database Query', {
      query: query.substring(0, 100), // Truncate long queries
      duration: `${duration}ms`,
    });
  }

  emergency(action: string, requestId: string, userId?: string) {
    this.info('Emergency Action', {
      action,
      requestId,
      userId,
    });
  }

  socket(event: string, userId?: string, data?: any) {
    this.debug('Socket Event', {
      event,
      userId,
      data,
    });
  }

  auth(action: string, userId?: string, success: boolean = true) {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.log(level, 'Auth Action', {
      action,
      userId,
      success,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Express middleware for request logging
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  logger.request(req);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.response(req, res, duration);
  });

  next();
};
