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
   * @param {boolean} useBaseEntityOnly
   */
  subscribe(entityId, start, end, f, useBaseEntityOnly) {
    Logger.debug("[HaHistoryService]: Params entityId: " + entityId);
    Logger.debug("[HaHistoryService]: Params useBaseEntityOnly: " + useBaseEntityOnly);
    let trackerEntityIds;

    if (useBaseEntityOnly) {
      // Use only the base entity itself for tracking
      trackerEntityIds = [entityId];
      Logger.debug("[HaHistoryService]: tracking entity: " + entityId);
    } else {
      // Use the entity's device trackers if available
      trackerEntityIds = this.hass.states[entityId]?.attributes?.device_trackers ?? [];
      trackerEntityIds.push(entityId);
      Logger.debug("[HaHistoryService]: tracking following entities " + trackerEntityIds + " for entity: " + entityId);
    }

    let params = {  
      type: 'history/stream',  
      entity_ids: trackerEntityIds,
      significant_changes_only: false,
      start_time: start.toISOString()
    };

    if (end) {
      params.end_time = end.toISOString();
    }

    try {
      if(this.connection[entityId]) this.unsubscribeEntity(entityId);

      this.connection[entityId] = this.hass.connection.subscribeMessage(
        (message) => {
          // entities providing results
          Object.values(message.states).map((entity) => {
            // Each entity can return own results
            entity?.map((state) => {
              // Get states from each
              if(state.a.latitude && state.a.longitude) {
                Logger.debug("[HaHistoryService]: received new msg for entity id: " + entityId);
                f(new TimelineEntry(new Date(state.lu * 1000), state.a.latitude, state.a.longitude));
              } else {
                Logger.warn("[HaHistoryService]: received new msg without latitude/longitude for entity id: " + entityId);
              }
            });
          });
          
        },
        params);
      Logger.debug(`[HaHistoryService] successfully subscribed to history from ${entityId} showing ${params.start_time} till ${params.end_time ?? 'now'}`);
      Logger.debug(`[HaHistoryService] ${entityId} is connected to ${trackerEntityIds.length} location sources.`);
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