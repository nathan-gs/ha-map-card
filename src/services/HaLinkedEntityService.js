import Logger from "../util/Logger.js"

/**
 * Linked entity service
 */
export default class HaLinkedEntityService {  

  hass;
  connections = {};
  listeners = {};
  
  constructor(hass, entity, suffix = 'hours ago') {
    // Store ref to HASS
    this.hass = hass;
    suffix;
  }

  // Don't wait, we'll fire events when ready
  async setUpConnection(entity)
  {
    // Skip if already connected
    if (this.connections[entity]) return;

    Logger.debug(`[HaLinkedEntityService] initializing connection for ${entity}`);
    const connection  = this.hass.connection.subscribeMessage(
        (message) => {
          let state = null;

          if(message.a) state = message.a[entity].s; // new?
          if(message.c) state = message.c[entity]['+'].s; // change?

          if(state) {
            // If state is a number, attempt to parse as int, otherwise assume is and pass thru direct
            state = isNaN(state) ? state : parseInt(state);

            Logger.debug(`[HaLinkedEntityService] ${entity} state updated to ${state}`);

            // Hit callback for all listeners listing to entities changes
            this.listeners[entity].forEach(function(callback) { 
              callback(state)
            }); 
          }
        },
        {
            type: "subscribe_entities",
            entity_ids: [entity],
        }
      );
      // Track connection for entity
      this.connections[entity] = connection;
  }

  // Register listener
  onStateChange(entity, method) {
    // Setup connection if we need it.
    this.setUpConnection(entity);
    
    // Setup listeners array for entity
    if(!this.listeners[entity]) this.listeners[entity] = [];

    // Add callback
    this.listeners[entity].push(method);
  }

  disconnect() {
    this.listeners = {};
    // Unsub
    for (let [k, conn] of Object.entries(this.connections)) {
      k
      conn.then(unsub => unsub());
    }

    this.connections = {};
    Logger.debug("[HaLinkedEntityService] Disconnecting");
  }
}