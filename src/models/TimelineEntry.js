export default class TimelineEntry {  
  /** @type {Date} */
  timestamp;
  /** @type {string} */
  entityId;
  /** @type {object} */
  state;
  /** @type {string} */
  originalEntityId;

  constructor(timestamp, originalEntityId, entityId, state) {  
    this.timestamp = timestamp;  
    this.originalEntityId = originalEntityId;
    this.entityId = entityId;
    this.state = state;
  }

  /** @returns {number} */
  get latitude() {
    return this.state.a.latitude;
  }

  /** @returns {number} */
  get longitude() {
    return this.state.a.longitude;
  }
}
