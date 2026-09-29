export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify({ level: 'debug', timestamp: new Date().toISOString(), message: msg, ...meta }));
    }
  },
};
