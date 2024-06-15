export default class TimelineEntry {  
  /** @type {Date} */
  timestamp;
  /** @type {number} */
  latitude;
  /** @type {number} */
  longitude;

  constructor(timestamp, latitude, longitude) {  
    this.timestamp = timestamp;  
    this.latitude = latitude;  
    this.longitude = longitude;  
  }  
}
