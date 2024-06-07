
export default class Logger {

    static _debugEnabled = false;

    static enableDebug() {
      Logger._debugEnabled = true;
      Logger.debug("Debug enabled.");
    }
  
    /**
     * Log debug message to console (if debug enabled).
     */
    static debug(message) {
      if (!Logger._debugEnabled) return;
      console.debug("[HaMapCard] " + message);
    }

    static error(...args) {
      console.error(...args);
    }

    static warn(...args) {      
      console.warn(...args);
    }

    static info(...args) {
      console.info(...args);
    }
}