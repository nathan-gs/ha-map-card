
export default class Logger {

    static _debugEnabled = false;

    static enableDebug() {
      Logger._debugEnabled = true;
      Logger.debug("Debug enabled.");
    }
  
    static debug(...args) {
      if (!Logger._debugEnabled) return;
      if(args.length === 1) {
        console.debug("[HaMapCard] " + args[0]);
        return;
      } else {
        console.debug(...args);
      }
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