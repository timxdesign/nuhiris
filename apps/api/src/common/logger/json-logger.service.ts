import { LoggerService, LogLevel } from '@nestjs/common';

export class JsonLoggerService implements LoggerService {
  log(message: string, context?: string): void {
    this.writeLog('info', message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.writeLog('error', message, context, { trace });
  }

  warn(message: string, context?: string): void {
    this.writeLog('warn', message, context);
  }

  debug(message: string, context?: string): void {
    this.writeLog('debug', message, context);
  }

  verbose(message: string, context?: string): void {
    this.writeLog('verbose', message, context);
  }

  setLogLevels(_levels: LogLevel[]): void {}

  private writeLog(
    level: string,
    message: string,
    context?: string,
    extra?: Record<string, unknown>,
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ?? 'Application',
      service: 'nuhiris-api',
      ...extra,
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
  }
}
