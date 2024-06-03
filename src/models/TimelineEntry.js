export default class TimelineEntry {  
  /** @type {Date} */
  timestamp;
  /** @type {Double} */
  latitude;
  /** @type {Double} */
  longitude;

  constructor(timestamp, latitude, longitude) {  
    this.timestamp = timestamp;  
    this.latitude = latitude;  
    this.longitude = longitude;  
  }  
}
