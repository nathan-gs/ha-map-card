import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

import "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

/*
 * Native Map
 * https://github.com/home-assistant/frontend/blob/master/src/components/map/ha-map.ts 
 * https://github.com/home-assistant/frontend/blob/master/src/panels/lovelace/cards/hui-map-card.ts
 */

class EntityConfig {
  /** @type {String} */
  id;
  /** @type {String} */
  display;
  /** @type {Int} */
  size;
  /** @type {Date} */
  historyStart;
  /** @type {Date} */
  historyEnd;

  /** @type {String} */
  historyStartEntity;
  historyStartEntitySuffix;
  /** @type {String} */
  historyEndEntity;
  historyEndEntitySuffix;

  /** @type {String} */
  historyLineColor;
  /** @type {Boolean} */
  historyShowDots;
  /** @type {Boolean} */
  historyShowLines;
  /** @type {Double} */
  fixedX;
  /** @type {Double} */
  fixedY;
  /** @type {Double} */
  fallbackX;
  /** @type {Double} */
  fallbackY;
  /** @type {String} */
  css;
  // Cannot be set via config. Passed from parent
  historyManagedExternally;
  
  /** @type {String} */
  picture;
  /** @type {String} */
  color;

  // Is valye of this config item a HistoryEntity vs a date
  isHistoryEntityConfig(value) {
    return (
        value &&
        (typeof value == 'object' && value['entity']) ||
        (typeof value == 'string' && value.includes('.'))
      );
  }

  constructor(config, defaults) {
    this.id = (typeof config === 'string' || config instanceof String)? config : config.entity;
    this.display = config.display ? config.display : "marker";
    this.size = config.size ? config.size : 48;
    // If historyLineColor not set, inherit icon color
    this.color = config.color ?? this._generateRandomColor();
    
    // Get history value to use (normal of default)
    const historyStart = config.history_start ?? defaults.historyStart;
    const historyEnd = config.history_end ?? defaults.historyEnd;

    // If start is an entity, setup entity config
    if (this.isHistoryEntityConfig(historyStart)) {
      this.historyStartEntity = historyStart['entity'] ?? historyStart;
      this.historyStartEntitySuffix = historyStart['suffix'] ?? 'hours ago';
    } else {
        this.historyStart = historyStart ? HaMapUtilities.convertToAbsoluteDate(historyStart) : null;
    }

    // If end is an entity, setup entity config
    if (this.isHistoryEntityConfig(historyEnd)) {
      this.historyEndEntity = historyStart['entity'] ?? historyStart;
      this.historyEndEntitySuffix = historyStart['suffix'] ?? 'hours ago';
    } else {
      this.historyEnd = HaMapUtilities.convertToAbsoluteDate(historyEnd ?? 'now');
    }

    this.historyLineColor = config.history_line_color ?? this.color;
    this.historyShowDots = config.history_show_dots ?? true;
    this.historyShowLines = config.history_show_lines ?? true;
    this.fixedX = config.fixed_x;
    this.fixedY = config.fixed_y;
    this.fallbackX = config.fallback_x;
    this.fallbackY = config.fallback_y;
    this.css = config.css ?? "text-align: center; font-size: 60%;";
    this.picture = config.picture ?? null;

    // If no start/end date values are given, fallback to using date range manager
    this.usingDateRangeManager = (!historyStart && !historyEnd) && defaults.dateRangeManagerEnabled;
  }

  get hasHistory() {
    return this.historyStart != null || this.historyStartEntity != null || this.usingDateRangeManager === true;
  }  

  _generateRandomColor() {
    return "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0");
  }
}

class LayerConfig {
  /** @type {String} */
  url;
  /** @type {Object} */
  options;

  constructor(url, options, attribution = null) {
    this.url = url;
    this.options = {...{attribution: attribution}, ...options};
  }

}

class TileLayerConfig extends LayerConfig {};
class WmsLayerConfig extends LayerConfig {};

class MapConfig {
  /** @type {String} */
  title;
  focusEntity;
  x;
  y;
  /** @type {Int} */
  zoom;
  /** @type {Int} */
  cardSize;
  /** @type {[EntityConfig]} */
  entities;
  /** @type {[WmsLayerConfig]} */
  wms;
  /** @type {[TileLayerConfig]} */
  tileLayers;
  /** @type {TileLayerConfig} */
  tileLayer;
   /** @type {Date|Entity} */
  historyStart;
  /** @type {Date|Entity} */
  historyEnd;

  historyDateSelection;

  /** @type {Bool} */
  debug = false;

  constructor(inputConfig) {
    this.title = inputConfig.title;
    this.focusEntity = inputConfig.focus_entity;
    this.x = inputConfig.x;
    this.y = inputConfig.y;
    this.zoom = this._setConfigWithDefault(inputConfig.zoom, 12);
    this.cardSize = this._setConfigWithDefault(inputConfig.card_size, 5);

    // Enable debug messaging. 
    // Card is quite chatty with this enabled.
    if (inputConfig.debug){
      HaMapUtilities.enableDebug();
    }

    // Default historyStart/historyEnd can be set at the top level.
    // Entities can override these dates on an individual basis.
    // 
    // If historyDateSelection is true, this replaces top level date functionality (and any entities that don't provide their own dates will also use this)
    this.historyDateSelection = inputConfig.history_date_selection ? true : false;
    if (this.historyDateSelection) {
      this.historyStart = null;
      this.historyEnd = null;
    } else {
        // Pass as is.
        this.historyStart = inputConfig.history_start ?? null;
        this.historyEnd = inputConfig.history_end ?? "now";
    }

    this.entities = (inputConfig["entities"] ? inputConfig.entities : []).map((ent) => {
      // Pass historyStart/ historyEnd defaults down to entity
      return new EntityConfig(ent, {
          historyStart: this.historyStart,
          historyEnd: this.historyEnd,
          // Is the date range manager enabled
          dateRangeManagerEnabled: (!!this.historyDateSelection)
      });

    });
    this.wms = (this._setConfigWithDefault(inputConfig.wms, [])).map((wms) => {
      return new WmsLayerConfig(wms.url, wms.options);
    });
    this.tileLayers = (this._setConfigWithDefault(inputConfig.tile_layers, [])).map((tile) => {
      return new TileLayerConfig(tile.url, tile.options);
    });

    this.tileLayer = new TileLayerConfig(
      this._setConfigWithDefault(inputConfig.tile_layer_url, "https://tile.openstreetmap.org/{z}/{x}/{y}.png"),
      this._setConfigWithDefault(inputConfig.tile_layer_options, {}),
      this._setConfigWithDefault(inputConfig.tile_layer_attribution, '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>')
    );
    if(!(Number.isFinite(this.x) && Number.isFinite(this.y)) && this.focusEntity == null && this.entities.length == 0) {
      throw new Error("We need a map latitude & longitude; set at least [x, y], a focus_entity or have at least 1 entities defined.");
    }
  }

  _setConfigWithDefault(input, d = null) {
    if (!input) {
      if (d == null) {
        throw new Error("Missing key ");
      }
      return d;
    } else {
      return input;
    }
  }

  get hasTitle() {
    return this.title != null;
  }

  /** @returns {Int} */
  get mapHeight() {
    if (this.hasTitle) {
      return (this.cardSize * 50) + 20 - 76 - 2;
    } else {
      return (this.cardSize * 50) + 20;
    }
  }
  
  /** @returns {[EntityConfig]} */
  get entitiesWithShowPath() {
    return this.entities.filter((ent) => ent.showPath);
  }

}

class EntityHistory {

  /** @type {String} */
  entityId;
  /** @type {[TimelineEntry]} */
  entries = [];
  /** @type {String} */
  color;
  /** @type {[Polyline|CircleMarker]} */
  mapPaths = [];
  showDots = true;
  showLines = true;
  needRerender = false;

  constructor(entityId, color, showDots, showLines) {
    this.entityId = entityId;
    this.color = color;
    this.showDots = showDots;
    this.showLines = showLines;
  }

  retrieve = (entry) => {
    this.entries.push(entry);
    this.needRerender = true;
  };

  /**
   * @returns {[(Polyline|CircleMarker)]}
   */
  render() {
    if(this.needRerender == false || this.entries.length == 0) {
      return [];
    }
    this.mapPaths.forEach((marker) => marker.remove());
    this.mapPaths = [];

    for (let i = 0; i < this.entries.length - 1; i++) {
      const entry = this.entries[i];

      if(this.showDots) {
        this.mapPaths.push(
          L.circleMarker([entry.latitude, entry.longitude], 
            {
              color: this.color,
              radius: 3,
              interactive: true,
            }
          ).bindTooltip(entry.timestamp.toLocaleString(), {direction: 'top'})
        );
      }

      const nextEntry = this.entries[i + 1];
      const latlngs = [[entry.latitude, entry.longitude], [nextEntry.latitude, nextEntry.longitude]];

      if(this.showLines) {
        this.mapPaths.push(
          L.polyline(latlngs, {
            color: this.color,
            interactive: false,
          })
        );
      }
    }

    this.needRerender = false;
    return this.mapPaths;
  }

}

class Entity {
  /** @type {EntityConfig} */
  config;  
  marker;
  /** @type {[EntityHistory]} */
  histories = [];

  _currentState;

  // Set initial values
  currentHistoryStart;
  currentHistoryEnd;

  setHistoryDates(start, end){
    this.currentHistoryStart = start;
    this.currentHistoryEnd = end;
  }

  get id() {
    return this.config.id;
  }

  get display() {
    return this.config.display;
  }

  constructor(config, latitude, longitude, icon, title, state, picture) {
    this.config = config;
    if(this.display == "state") {
      title = state;
      this._currentState = state;
    }
    this.marker = this._createMapMarker(latitude, longitude, icon, title, picture);
  }

  _markerCss(size) {
    return `style="height: ${size}px; width: ${size}px;"`;
  }

  _abbr(title) {
    if(this.display == "state") {
      return title;
    }
    if(title.length < 5) {
      return title;
    }
    return title
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substr(0, 3)
      .toUpperCase();
  }

  get hasHistory() {
    return this.config.hasHistory;
  }

  _latlong(latitude, longitude) {
    if(this.config.fixedX && this.config.fixedY) {
      return [this.config.fixedX, this.config.fixedY];
    }
    if(latitude == null || longitude == null) {
      console.warn("Entity: " + this.id + " has no latitude & longitude");
      if(this.config.fallbackX == null || this.config.fallbackY == null) {
        console.error("Entity: " + this.id + " has no fallback latitude & longitude");
        throw Error("Entity: " + this.id + " has no latitude & longitude and no fallback configured")
      }
    }
    return [latitude ?? this.config.fallbackX, longitude ?? this.config.fallbackY];
  }

  update(map, latitude, longitude, state) {
    if(this.display == "state") {
      if(state != this._currentState) {
        HaMapUtilities.debug("[Entity] updating marker for " + this.id + " from " + this._currentState + " to " + state);
        this.marker.remove();
        this.marker = this._createMapMarker(latitude, longitude, null, state, null);
        this.marker.addTo(map);
        this._currentState = state;
      }
    }
    this.marker.setLatLng(this._latlong(latitude, longitude));
  }

  setupHistory(historyService, start, end) {
    if(this.hasHistory) {
      const entHist = new EntityHistory(this.id, this.config.historyLineColor, this.config.historyShowDots, this.config.historyShowLines);
      historyService.subscribe(entHist.entityId, start, end, entHist.retrieve);      
      this.histories.push(entHist);
    }  
  }

  /** @returns {[Polyline|CircleMarker]} */
  renderHistory() {
    return this.histories.map((entHist) => entHist.render()).flat();  
  }

  _createMapMarker(latitude, longitude, icon, title, picture) {
    HaMapUtilities.debug("[MarkerEntity] Creating marker for " + this.id + " with display mode " + this.display);
    if(this.display == "icon") {
      picture = null;
    }
    if(this.display == "state") {
      picture = null;
      icon = null;
    }

    const marker = L.marker(this._latlong(latitude, longitude), {
      icon: L.divIcon({
        html: `
          <map-card-entity-marker
            entity-id="${this.id}"
            title="${this._abbr(title)}"
            icon="${icon ?? ""}"
            picture="${
              picture ?? ""
            }"
            color="${this.config.color}"
            style="${this.config.css}"
            size="${this.config.size}"
          ></map-card-entity-marker>
        `,
        iconSize: [this.config.size, this.config.size],
        className: "",
      }),
      title: this.id,
    });
    return marker;
  }
}

class TimelineEntry {  
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

class HaHistoryService {  

  connection = {};

  constructor(hass) {  
    this.hass = hass;  
  }  

  /** 
   * @param {String} entityId
   * @param {Date} start  
   * @param {Date} end
   * @param {Function} f
   **/
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
              f(new TimelineEntry(new Date(state.lu * 1000), state.a.latitude, state.a.longitude))
            }
          });
        },
        params);
      HaMapUtilities.debug(`[HaHistoryService] successfully subscribed to history from ${entityId} showing ${params.start_time} till ${params.end_time ?? 'now'}`);
    } catch (error) {        
      console.error(`Error retrieving history for entity ${entityId}: ${error}`);  
      console.error(error);
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
      HaMapUtilities.debug("[HaHistoryService] unsubscribed history for " + entityId);
  }
}

/**
 * Attempt to locate "energy-date-selection" component on the page to act as date range selector.
 * If found, subscribe to date changes triggered by it.
 */
class HaDateRangeService {  

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

   HaMapUtilities.debug("[HaDateRangeService] initializing");
    // Get collection, once we have it subscribe to listen for date changes.
    this.getEnergyDataCollectionPoll(
      (con) => { this.onConnect(con); }
    );
  }

  // Once connected, subscribe to date range changes
  onConnect(energyCollection) {
    this.connection = energyCollection.subscribe(collection => { 
        HaMapUtilities.debug("[HaDateRangeService] date range changed");
        this.listeners.forEach(function(callback) { 
          callback(collection); 
        }); 
    });
    HaMapUtilities.debug("[HaDateRangeService] Successfully connected to date range component");
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
        console.error('Unable to connect to energy date selector. Make sure to add a `type: energy-date-selection` card to this screen.');
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
     this.connection();
     HaMapUtilities.debug("HaDateRangeService: Disconnecting");
  }
}

/**
 * Linked entity service
 */
class HaLinkedEntityService {  

  hass;
  connections = {};
  listeners = {};
  
  constructor(hass, entity, suffix = 'hours ago') {
    // Store ref to HASS
    this.hass = hass;
  }

  setUpConnection(entity)
  {
    HaMapUtilities.debug(`[HaLinkedEntityService] initializing connection for ${entity}`);
    const connection  = this.hass.connection.subscribeMessage(
        (message) => {
          let state = null;

          if(message.a) state = message.a[entity].s; // new?
          if(message.c) state = message.c[entity]['+'].s; // change?

          if(state) {
            // If state is a number, attempt to parse as int, otherwise assume is and pass thru direct
            state = isNaN(state) ? state : parseInt(state);

            HaMapUtilities.debug(`[HaLinkedEntityService] ${entity} state updated to ${state}`);

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
    // Track entity if not already tracked.
    if (!this.connections[entity]) {
      this.setUpConnection(entity);
    }
    // Setup listeners array for entity
    if(!this.listeners[entity]) this.listeners[entity] = [];
    // Add callback
    this.listeners[entity].push(method);
  }

  disconnect() {
     this.listeners = {};
     // Unsub
     for (let [k, conn] of Object.entries(this.connections)) {
       conn.then(unsub => unsub());
     }

     this.connections = {};
     HaMapUtilities.debug("[HaLinkedEntityService] Disconnecting");
  }
}

class MapCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  firstRenderWithMap = true;
  /** @type {[Entity]} */
  entities = [];
  /** @type {L.Map} */
  map;
  resizeObserver;
  /** @type {L.LayerGroup} */
  historyLayerGroups = {};
  /** @type {HaHistoryService} */
  historyService;
  /** @type {HalinkedEntityService} */
  linkedEntityService;
  /** @type {HaDateRangeService} */
  dateRangeManager;


  hasError = false;
  hadError = false;

  firstUpdated() {
    this.map = this._setupMap();
    // redraw the map every time it resizes
    this.resizeObserver = this._setupResizeObserver();
  };

  setUpHistory() {
    // Setup core history service
     this.historyService = new HaHistoryService(this.hass);

    // Is history date range enabled?
    if (this.config.historyDateSelection) {
      this.dateRangeManager = new HaDateRangeService(this.hass);
    }

    // Manages watching external entities.
    this.linkedEntityService = new HaLinkedEntityService(this.hass);     
  }

  refreshEntityHistory(ent) {
      HaMapUtilities.debug(`[MapCard] Refreshing history for ${ent.id}: ${ent.currentHistoryStart} -> ${ent.currentHistoryEnd}`);
      // Remove layer if it already exists.
      if(this.historyLayerGroups[ent.id]) this.map.removeLayer(this.historyLayerGroups[ent.id]);

      this.historyLayerGroups[ent.id] = new L.LayerGroup();
      this.map.addLayer(this.historyLayerGroups[ent.id]);

      // Subscribe new history
      ent.setupHistory(this.historyService, ent.currentHistoryStart, ent.currentHistoryEnd);
  }

  render() {
    
    if (this.map) {
      if(!this.hasError && this.hadError) {
        HaMapUtilities.removeWarningOnMap(this.map, "Error found, check Console");
        HaMapUtilities.removeWarningOnMap(this.map, "Error found in first run, check Console");
        this.hadError = false;
      }

      // First render is without the map
      if (this.firstRenderWithMap) {
        try {

          this.setUpHistory();

          this.entities = this._firstRender(this.map, this.hass, this.config.entities);

          
          this.entities.forEach((ent) => {
            // Setup layer for entities history
            this.historyLayerGroups[ent.id] = new L.LayerGroup();
            this.map.addLayer(this.historyLayerGroups[ent.id]);

            let historyDebug = `History config for: ${ent.id}\n`;

            if (!ent.hasHistory) {
              historyDebug += `- Not enabled`;
              HaMapUtilities.debug(historyDebug);
              return;
            }

            // If entity is using the date range manager.
            if (ent.config.usingDateRangeManager) {
              // HaDateRangeService, HaLinkedEntityService and future services should use same structure.
              this.dateRangeManager.onDateRangeChange((range) => {
                ent.setHistoryDates(range.start, range.end);
                this.refreshEntityHistory(ent);
              });

              historyDebug += `- Using DateRangeManager`;
              HaMapUtilities.debug(historyDebug);
              return;
            }

            // If have start entity, link it
            if (ent.config.historyStartEntity) {
              this.linkedEntityService.onStateChange(
                ent.config.historyStartEntity,
                (newState) => {

                  // state: 2
                  // value = state+suffix = 2 hours
                  const suffix = ent.config.historyStartEntitySuffix;
                  const value = newState + (suffix ? ' ' + suffix : '');
                  const date = HaMapUtilities.convertToAbsoluteDate(value);

                  ent.setHistoryDates(date, ent.currentHistoryEnd);
                  this.refreshEntityHistory(ent);
                }
              );
             historyDebug += `- Start: linked entity "${ent.config.historyStartEntity}"\n`;
            } else {
              ent.currentHistoryStart = ent.config.historyStart;
              historyDebug +=`- Start: fixed date ${ent.currentHistoryStart}\n`;
            }

            // If have end entity, link it.
            if (ent.config.historyEndEntity) {
              this.linkedEntityService.onStateChange(
                ent.config.historyEndEntity,
                (newState) => {
                  // state: 2
                  // value = state+suffix = 2 hours
                  const suffix = ent.config.historyEndEntitySuffix;
                  const value = newState + (suffix ? ' ' + suffix : '');
                  const date = HaMapUtilities.convertToAbsoluteDate(value);

                  ent.setHistoryDates(ent.currentHistoryStart, date);
                  this.refreshEntityHistory(ent);
                }
              );
              historyDebug += `- End: linked entity "${ent.config.historyEndEntity}"\n`;
            } else {
              ent.currentHistoryEnd = ent.config.historyEnd;
              historyDebug += `- End: fixed date ${ent.currentHistoryEnd??'now'}\n`;
            }

            // Provide summary of config for each entities history
            HaMapUtilities.debug(historyDebug);

            // Render history now if this isn't dynamic.
            if (ent.config.historyStart && ent.config.historyEnd){
              ent.setupHistory(this.historyService, ent.config.historyStart, ent.config.historyEnd);
            }
            
          });
          this.hasError = false;
        } catch (e) {
          this.hasError = true;
          this.hadError = true;
          console.error(e);
          HaMapUtilities.renderWarningOnMap(this.map, "Error found in first run, check Console");
        }
        this.firstRenderWithMap = false;
      }

      this.entities.forEach((ent) => {
        const stateObj = this.hass.states[ent.id];
        const {
          latitude,
          longitude,
        } = stateObj.attributes;
        try {
          ent.update(this.map, latitude, longitude, this.hass.formatEntityState(stateObj));

          ent.renderHistory().forEach((marker) => {
            marker.addTo(this.historyLayerGroups[ent.id]);
          });
          this.hasError = false;
        } catch (e) {
          this.hasError = true;
          this.hadError = true;
          console.error(e);
          HaMapUtilities.renderWarningOnMap(this.map, "Error found, check Console");
        }
      });
  
    }

    return html`
            <link rel="stylesheet" href="/static/images/leaflet/leaflet.css">
            <ha-card header="${this.config.title}" style="height: 100%">
                <div id="map" style="min-height: ${this.config.mapHeight}px"></div>
            </ha-card>
        `;
  }

  _firstRender(map, hass, entities) {
    HaMapUtilities.debug("First Render with Map object, resetting size.")
    return entities.map((configEntity) => {
      const stateObj = hass.states[configEntity.id];
      const {
        latitude,
        longitude,
        passive,
        icon,
        radius,
        entity_picture,
        gps_accuracy: gpsAccuracy,
        friendly_name
      } = stateObj.attributes;
      const state = hass.formatEntityState(stateObj);

      // If no configured picture, fallback to entity picture
      let picture = configEntity.picture ?? entity_picture;
      // Skip if neither found and return null
      picture = picture ? hass.hassUrl(picture) : null;

      // Attempt to setup entity. Skip on fail, so one bad entity does not affect others.
      try {
        const entity = new Entity(configEntity, latitude, longitude, icon, friendly_name, state, picture);      
        entity.marker.addTo(map);
        return entity; 
      } catch (e){
         console.error("Entity: " + configEntity.id + " skipped due to missing data");
         HaMapUtilities.renderWarningOnMap(this.map, "Entity: " + configEntity.id + " could not be loaded. See console for details.");
         return null;
      }
    })
    // Remove skipped entities.
    .filter(v => v);
  }

  _setupResizeObserver() {
    if (this.resizeObserver) {
      return this.resizeObserver;
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === this.map?.getContainer()) {
          this.map?.invalidateSize();
        }
      }
    });

    resizeObserver.observe(this.map.getContainer());
    return resizeObserver;
  }

  /** @returns {L.Map} */
  _setupMap() {    
    L.Icon.Default.imagePath = "/static/images/leaflet/images/";

    const mapEl = this.shadowRoot.querySelector('#map');
    let map = L.map(mapEl).setView(this._getLatLong(), this.config.zoom);

    map.addLayer(
      L.tileLayer(this.config.tileLayer.url, this.config.tileLayer.options)
    );
    this._addWmsLayers(map);
    this._addTileLayers(map);
    return map;
  }

  _addWmsLayers(map) {
    this.config.wms.forEach((l) => {
      L.tileLayer.wms(l.url, l.options).addTo(map);
    });
  }

  _addTileLayers(map) {
    this.config.tileLayers.forEach((l) => {
      L.tileLayer(l.url, l.options).addTo(map);
    });
  }

  setConfig(inputConfig) {
    this.config = new MapConfig(inputConfig);    
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return this.config.cardSize;
  }

  connectedCallback() {
    super.connectedCallback();
    // Reinitialize the map when the card gets reloaded but it's still in view
    if (this.shadowRoot.querySelector('#map')) {
      this.firstUpdated();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.firstRenderWithMap = true;
    }

    this.resizeObserver?.unobserve(this);
    this.historyService?.unsubscribe();
    this.dateRangeService?.disconnect();
    this.linkedEntityService?.disconnect();
  }

  /** @returns {[Double, Double]} */
  _getLatLong() { 
    if(Number.isFinite(this.config.x) && Number.isFinite(this.config.y)) {
      return [this.config.x, this.config.y];
    } else {
      return this._getLatLongFromFocusedEntity();
    }
  }

  /** @returns {[Double, Double]} */
  _getLatLongFromFocusedEntity() {
    const entityId = this.config.focusEntity ? this.config.focusEntity : this.config.entities[0].id;
    const entity = this.hass.states[entityId];
    
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }
    if (!(entity.attributes.latitude || entity.attributes.longitude)) {
      throw new Error(`Entity ${entityId} has no longitude & latitude.`);
    }
    return [entity.attributes.latitude, entity.attributes.longitude];
  }

  static get styles() {
    return css`       
      #map {
        height: 100%;
        border-radius: var(--ha-card-border-radius,12px);
      }
      .leaflet-pane {
        z-index: 0 !important;
      }
      .leaflet-edit-resize {
        border-radius: 50%;
        cursor: nesw-resize !important;
      }
      .leaflet-control,
      .leaflet-top,
      .leaflet-bottom {
        z-index: 1 !important;
      }
      .leaflet-tooltip {
        padding: 8px;
        font-size: 90%;
        background: rgba(80, 80, 80, 0.9) !important;
        color: white !important;
        border-radius: 4px;
        box-shadow: none !important;
      }
      .marker {
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        font-size: var(--ha-marker-font-size, 1.5em);
        border-radius: 50%;
        border: 1px solid var(--ha-marker-color, var(--primary-color));
        color: var(--primary-text-color);
        background-color: var(--card-background-color);
      }
    `;
  }
}

class MapCardEntityMarker extends LitElement {
  static get properties() {
    return {
      'entityId': {type: String, attribute: 'entity-id'},
      'title': {type: String, attribute: 'title'},
      'picture': {type: String, attribute: 'picture'},
      'icon': {type: String, attribute: 'icon'},
      'color': {type: String, attribute: 'color'},
      'size': {type: Number}
    };
  }

  render() {
   return html`
      <div
        class="marker ${this.picture ? "picture" : ""}"
        style="border-color: ${this.color}; height: ${this.size}px; width: ${this.size}px;"
        @click=${this._badgeTap}
      >
        ${this._inner()}
      </div>
    `;
  };

  _badgeTap(ev) {
    ev.stopPropagation();
    if (this.entityId) {
      // https://developers.home-assistant.io/blog/2023/07/07/action-event-custom-cards/
      const actions = {
        entity: this.entityId,
        tap_action: {
          action: "more-info",
        }
      };

      const event = new Event('hass-action', {bubbles: true, composed: true});
      event.detail = { config: actions, action: 'tap'};
      this.dispatchEvent(event);
    }
  }

  _inner() {
    if(this.picture) {
      return html`<div class="entity-picture" style="background-image: url(${this.picture})"></div>`
    }
    if(this.icon) {
      return html`<ha-icon icon="${this.icon}">icon</ha-icon>`
    }
    return this.title;
  }

  static get styles() {
    return css`
      .marker {
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        width: 48px;
        height: 48px;
        font-size: var(--ha-marker-font-size, 1.5em);
        border-radius: 50%;
        border: 1px solid var(--ha-marker-color, var(--primary-color));
        color: var(--primary-text-color);
        background-color: var(--card-background-color);
      }
      .marker.picture {
        overflow: hidden;
      }
      .entity-picture {
        background-size: cover;
        height: 100%;
        width: 100%;
      }
    `;
  }
}

/**
 * Shared utility methods for HaMapCard
 */
class HaMapUtilities {
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

if (!customElements.get("map-card")) {
  customElements.define("map-card", MapCard);
  customElements.define("map-card-entity-marker", MapCardEntityMarker);
  console.info(
    `%cnathan-gs/ha-map-card: VERSION`,
    'color: orange; font-weight: bold; background: black'
  )
}