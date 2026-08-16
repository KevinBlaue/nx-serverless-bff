type LogLevel = 'ERROR' | 'INFO' | 'WARN';

type LogContext = Record<string, boolean | number | string | undefined>;

function write(level: LogLevel, message: string, context: LogContext): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === 'WARN') {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.info(JSON.stringify(entry));
}

export const logger = {
  error: (message: string, context: LogContext = {}): void => write('ERROR', message, context),
  info: (message: string, context: LogContext = {}): void => write('INFO', message, context),
  warn: (message: string, context: LogContext = {}): void => write('WARN', message, context),
};
