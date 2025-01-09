
import EntityHistory from "../models/EntityHistory.js";
import L, { LayerGroup, LatLng, Map } from "leaflet";
import Circle from "./Circle.js";
import Logger from "../util/Logger.js"
import EntityConfig from "../configs/EntityConfig.js";
import HaHistoryService from "../services/HaHistoryService.js";
import HaDateRangeService from "../services/HaDateRangeService.js";
import HaLinkedEntityService from "../services/HaLinkedEntityService.js";
import HaMapUtilities from "../util/HaMapUtilities.js";

export default class Entity {
  /** @type {EntityConfig} */
  config;  
  /** @type {L.Marker} */
  marker;
  /** @type {EntityHistory} */
  history;
  /** @type {LayerGroup} */
  historyLayerGroup;
  /** @type {object} */
  hass;
  /** @type {Map} */
  map;
  /** @type {string} */
  _currentState;
  /** @type {HaHistoryService} */
  historyService;
  /** @type {HaDateRangeService} */
  dateRangeManager;
  /** @type {HaLinkedEntityService} */
  linkedEntityService;

  // Set initial values
  /** @type {Date} */
  currentHistoryStart;
  /** @type {Date} */
  currentHistoryEnd;

  /** @type {[boolean]} */
  darkMode;
  /** @type {Circle} */
  circle;

  constructor(config, hass, map, historyService, dateRangeManager, linkedEntityService, darkMode) {
    this.config = config;
    this.hass = hass;
    this.map = map;
    this.darkMode = darkMode;
    this.historyService = historyService;
    this.dateRangeManager = dateRangeManager;
    this.linkedEntityService = linkedEntityService;

    if(this.display == "state") {
      this._currentState = this.title;
    }    
    this.circle = new Circle(this.config.circleConfig, this);
  }

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

  /** @returns {object} */
  get state() {
    return this.hass.states[this.id];
  }

  get picture() {
    // If no configured picture, fallback to entity picture
    let picture = this.config.picture ?? this.state.attributes.entity_picture;
    // Skip if neither found and return null
    return picture ? this.hass.hassUrl(picture) : null;
  }

  
  /** @returns {LatLng} */
  get latLng() {
    if(this.config.fixedX && this.config.fixedY) {
      return new LatLng(this.config.fixedX, this.config.fixedY);
    }
    
    // Do we have Lng/Lat directly?
    if (this.state.attributes.latitude && this.state.attributes.longitude) {
      return new LatLng(this.state.attributes.latitude, this.state.attributes.longitude);
    }
    
    // Get Lat/Lng of entity. Some entities such as "person" define device_trackers allowing
    // multiple lat/lng sources to be used. This method will call down through these looking for a
    // lat/lng value if none is defined on the parent entity.
    // If any, see if we can get a lng/lat from one instead
    let subTrackerIds = this.state?.attributes?.device_trackers ?? []
    for(let t=0; t<subTrackerIds.length; t++) {
      const entity = this.hass.states[subTrackerIds[t]];
      if (entity.attributes.latitude && entity.attributes.longitude) {
        return new LatLng(entity.attributes.latitude, entity.attributes.longitude);
      }
    }    
    
    Logger.warn("Entity: " + this.id + " has no latitude & longitude");
    if(this.config.fallbackX && this.config.fallbackY) {
      return new LatLng(this.config.fallbackX, this.config.fallbackY);
    }
    Logger.error("Entity: " + this.id + " has no fallback latitude & longitude");
    throw Error("Entity: " + this.id + " has no latitude & longitude and no fallback configured")
  }

  setup() {
    this.marker = this._createMapMarker();
    this.marker.addTo(this.map);
    this.setupHistory();
    
    this.circle.setup();
  }

  get friendlyName() {
    return this.state.attributes.friendly_name;
  }

  /** @returns {string} */
  get title() {
    if(this.display == "state") {
      return this.hass.formatEntityState(this.state);;
    }
    const title = this.friendlyName;
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

  /** @returns {string} */
  get tooltip() {
    return this.friendlyName ?? "";
  }

  get icon() {
    return this.config.icon ?? this.state.attributes.icon;
  }

  _markerCss(size) {
    return `style="height: ${size}px; width: ${size}px;"`;
  }

  get hasHistory() {
    return this.config.hasHistory;
  }

  async update() {
    if(this.display == "state") {
      if(this.state != this._currentState) {
        Logger.debug("[Entity] updating marker for " + this.id + " from " + this._currentState + " to " + this.state);
        this.marker.remove();
        this.marker = this._createMapMarker();
        this.marker.addTo(this.map);
        this._currentState = this.state;
      }
    }
    this.marker.setLatLng(this.latLng);
    this.renderHistory();
    this.circle.update();
  }


  refreshEntityHistory() {
    Logger.debug(`[Entity] Refreshing history for ${this.id}: ${this.currentHistoryStart} -> ${this.currentHistoryEnd}`);
    // Remove layer if it already exists.
    if(this.historyLayerGroup) this.map.removeLayer(this.historyLayerGroup);

    this.historyLayerGroup = new LayerGroup();
    this.map.addLayer(this.historyLayerGroup);

    // Subscribe new history
    this.setupEntityHistories(this.currentHistoryStart, this.currentHistoryEnd);
  }

  setupHistory() {    
    let historyDebug = `History config for: ${this.id}\n`;
      
    if (!this.hasHistory) {
      historyDebug += `- Not enabled`;
      Logger.debug(historyDebug);
      return;
    }

    // Setup layer for entities history
    this.historyLayerGroup = new LayerGroup();
    this.map.addLayer(this.historyLayerGroup);

    // If entity is using the date range manager.
    if (this.config.usingDateRangeManager) {
      // HaDateRangeService, HaLinkedEntityService and future services should use same structure.
      this.dateRangeManager.onDateRangeChange((range) => {
        this.setHistoryDates(range.start, range.end);
        this.refreshEntityHistory(this.map, this.historyService);
      });

      historyDebug += `- Using DateRangeManager`;
      Logger.debug(historyDebug);
    }

    // If have start entity, link it
    if (this.config.historyStartEntity) {
      this.linkedEntityService.onStateChange(
        this.config.historyStartEntity,
        (newState) => {
            const date = HaMapUtilities.getEntityHistoryDate(newState, this.config.historyStartEntitySuffix);
            this.setHistoryDates(date, this.currentHistoryEnd);
            this.refreshEntityHistory(this.map, this.historyService);
          }
        );
        historyDebug += `- Start: linked entity "${this.config.historyStartEntity}"\n`;
      } else {
        this.currentHistoryStart = this.config.historyStart;
        historyDebug += `- Start: fixed date ${this.currentHistoryStart}\n`;
      }

      // If have end entity, link it.
      if (this.config.historyEndEntity) {
        this.linkedEntityService.onStateChange(
          this.config.historyEndEntity,
          (newState) => {
            const date = HaMapUtilities.getEntityHistoryDate(newState, this.config.historyEndEntitySuffix);
            this.setHistoryDates(this.currentHistoryStart, date);
            this.refreshEntityHistory(this.map, this.historyService);
          }
        );
        historyDebug += `- End: linked entity "${this.config.historyEndEntity}"\n`;
      } else {
        this.currentHistoryEnd = this.config.historyEnd;
        historyDebug += `- End: fixed date ${this.currentHistoryEnd??'now'}\n`;
      }

      // Provide summary of config for each entities history
      Logger.debug(historyDebug);

      // Render history now if start is fixed and end isn't dynamic
      if (this.config.historyStart && !this.config.historyEndEntity) {
        this.setupEntityHistories(this.config.historyStart, this.config.historyEnd);
      }      
    }
    
  setupEntityHistories(start, end) {
    this.history = new EntityHistory(this.id, this.tooltip, this.config.historyLineColor, this.config.gradualOpacity, this.config.historyShowDots, this.config.historyShowLines);
    this.historyService.subscribe(this.history.entityId, start, end, this.history.retrieve, this.config.useBaseEntityOnly);
  }

  renderHistory() {
    if(!this.hasHistory) {
      return;
    }
    this.history?.render().flat().forEach((marker) => {
      marker.addTo(this.historyLayerGroup);
    });
  }

  
  _createMapMarker() {
    Logger.debug("[MarkerEntity] Creating marker for " + this.id + " with display mode " + this.display);
    let icon = this.icon;
    let picture = this.picture;
    if(this.display == "icon") {
      picture = null;
    }
    if(this.display == "state") {
      picture = null;
      icon = null;
    }

    const extraCssClasses = this.darkMode ? "dark" : "";

    const marker = L.marker(this.latLng, {
      icon: L.divIcon({
        html: `
          <map-card-entity-marker
            entity-id="${this.id}"
            title="${this.title}"
            tooltip="${this.tooltip}"
            icon="${icon ?? ""}"
            picture="${
              picture ?? ""
            }"
            color="${this.config.color}"
            style="${this.config.css}"
            size="${this.config.size}"
            extra-css-classes="${extraCssClasses}"
            tap-action='${JSON.stringify(this.config.tapAction)}'
          ></map-card-entity-marker>
        `,
        iconSize: [this.config.size, this.config.size],
        className: ''
      }),
      title: this.id,
      zIndexOffset: this.config.zIndexOffset
    });
    return marker;
  }

}