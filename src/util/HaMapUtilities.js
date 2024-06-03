/**
 * Shared utility methods for HaMapCard
 */
export default class HaMapUtilities {
  static _debugEnabled = false;

  static enableDebug() {
    HaMapUtilities._debugEnabled = true;
    HaMapUtilities.debug("Debug enabled.");
  }

  /**
   * Log debug message to console (if debug enabled).
   */
  static debug(message) {
    if (!HaMapUtilities._debugEnabled) return;
    console.debug("[HaMapCard] " + message);
  }

  static convertToAbsoluteDate(inputStr) {  
    // Check if the input string is a relative timestamp  
    var relativeTimePattern = /^\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i;  
    if (inputStr === 'now') {
      return null;
    } else if (relativeTimePattern.test(inputStr)) {  
      // Split the input string into parts  
      var parts = inputStr.split(' ');  

      // Get the number and the unit of time  
      var num = parseInt(parts[0]);  
      var unit = parts[1];  

      // Create a new Date object for the current time  
      var date = new Date();  

      // Subtract the appropriate amount of time  
      if (unit.startsWith('second')) {  
          date.setSeconds(date.getSeconds() - num);  
      } else if (unit.startsWith('minute')) {  
          date.setMinutes(date.getMinutes() - num);  
      } else if (unit.startsWith('hour')) {  
          date.setHours(date.getHours() - num);  
      } else if (unit.startsWith('day')) {  
          date.setDate(date.getDate() - num);  
      } else if (unit.startsWith('week')) {  
        date.setDate(date.getDate() - num * 7);  
      } else if (unit.startsWith('month')) {  
          date.setMonth(date.getMonth() - num);  
      } else if (unit.startsWith('year')) {  
          date.setFullYear(date.getFullYear() - num);  
      }    
      return date;  
    } else {  
      // If the input string is not a relative timestamp, try to parse it as an absolute date  
      var date = new Date(inputStr);  
      if (isNaN(date.getTime())) {  
        // If the date could not be parsed, throw an error  
        throw new Error("Invalid input string for Date: " + inputStr);  
      } else {  
        return date;  
      }  
    }  
  }

  // Show error message
  static renderWarningOnMap(map, message){
    L.control.attribution({prefix:'⚠️'}).addAttribution(message).addTo(map);
  }
  // Hide error message
  static removeWarningOnMap(map, message){
    L.control.attribution({prefix:'⚠️'}).removeAttribution(message).addTo(map);
  }
}