import Logger from "../util/Logger.js"


/**
 * Attempt to locate "energy-date-selection" component on the page to act as date range selector.
 * If found, subscribe to date changes triggered by it.
 */
export default class HaDateRangeService {  

  hass;
  // Give up if not found.
  TIMEOUT = 10000;
  listeners = [];
  pollStartAt;

  connection;
  
  constructor(hass) {
    // Store ref to HASS
    this.hass = hass;
    this.pollStartAt = Date.now();

   Logger.debug("[HaDateRangeService] initializing");
    // Get collection, once we have it subscribe to listen for date changes.
    this.getEnergyDataCollectionPoll(
      (con) => { this.onConnect(con); }
    );
  }

  // Once connected, subscribe to date range changes
  onConnect(energyCollection) {
    this.connection = energyCollection.subscribe(collection => { 
        Logger.debug("[HaDateRangeService] date range changed");
        this.listeners.forEach(function(callback) { 
          callback(collection); 
        }); 
    });
    Logger.debug("[HaDateRangeService] Successfully connected to date range component");
  };

  // Wait for energyCollection to become available.
  getEnergyDataCollectionPoll(complete)
  {
      let energyCollection = null;
      // Has HA inited collection
      if (this.hass.connection['_energy']) {
        energyCollection =  this.hass.connection['_energy'];
      }
       
      if (energyCollection) {
        complete(energyCollection);
      } else if (Date.now() - this.pollStartAt > this.TIMEOUT) {
        Logger.error('Unable to connect to energy date selector. Make sure to add a `type: energy-date-selection` card to this screen.');
      } else {
        setTimeout(() => this.getEnergyDataCollectionPoll(complete), 100);
      }
  };

  // Register listener
  onDateRangeChange(method) {
    this.listeners.push(method);
  }

  disconnect(){
     this.listeners = [];
     // Unsub
     if(this.connection) this.connection();
     Logger.debug("[HaDateRangeService] Disconnecting");
  }
}