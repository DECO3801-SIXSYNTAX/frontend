export class Logger {
    static info(message: string, ...optional: any[]) {
      console.info(`[INFO] ${new Date().toISOString()} - ${message}`, ...optional);
    }
  
    static error(message: string, ...optional: any[]) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...optional);
    }
  
    static warn(message: string, ...optional: any[]) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...optional);
    }
  }
  