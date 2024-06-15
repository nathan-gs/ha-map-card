import TimelineEntry from "../models/TimelineEntry.js"
import Logger from "../util/Logger.js"


export default class HaHistoryService {  

  connection = {};

  constructor(hass) {  
    this.hass = hass;  
  }  

  /** 
   * @param {string} entityId
   * @param {Date} start  
   * @param {Date} end
   * @param {Function} f
   */
  subscribe(entityId, start, end, f) {  
    let params = {  
      type: 'history/stream',  
      entity_ids: [entityId],
      significant_changes_only: true,
      start_time: start.toISOString()
    };

    if (end) {
      params.end_time = end.toISOString();
    }

    try {
      if(this.connection[entityId]) this.unsubscribeEntity(entityId);

      this.connection[entityId] = this.hass.connection.subscribeMessage(
        (message) => {
          message.states[entityId]?.map((state) => {
            if(state.a.latitude && state.a.longitude) {
              Logger.debug("[HaHistoryService]: received new msg for entity id: " + entityId);
              f(new TimelineEntry(new Date(state.lu * 1000), state.a.latitude, state.a.longitude));
            }
          });
        },
        params);
      Logger.debug(`[HaHistoryService] successfully subscribed to history from ${entityId} showing ${params.start_time} till ${params.end_time ?? 'now'}`);
    } catch (error) {        
      Logger.error(`Error retrieving history for entity ${entityId}: ${error}`, error);  
    }  
  }  

  unsubscribe() {
    for (const entityId in this.connection) {
      this.unsubscribeEntity(entityId);
    }
  }

  unsubscribeEntity(entityId) {
      this.connection[entityId]?.then((unsub) => unsub?.());
      this.connection[entityId] = undefined;
      Logger.debug("[HaHistoryService] unsubscribed history for " + entityId);
  }
}