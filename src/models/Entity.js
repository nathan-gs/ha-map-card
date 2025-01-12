
import L, { LatLng, Map } from "leaflet";
import Circle from "./Circle.js";
import Logger from "../util/Logger.js"
import EntityConfig from "../configs/EntityConfig.js";
import EntityHistoryManager from "./EntityHistoryManager.js";

export default class Entity {
  /** @type {EntityConfig} */
  config;
  /** @type {L.Marker} */
  marker;
  /** @type {object} */
  hass;
  /** @type {Map} */
  map;
  /** @type {string} */
  _currentTitle;
  /** @type {[boolean]} */
  darkMode;
  /** @type {Circle} */
  circle;
  /** @type {EntityHistoryManager} */
  historyManager;

  constructor(config, hass, map, historyService, dateRangeManager, linkedEntityService, darkMode) {
    this.config = config;
    this.hass = hass;
    this.map = map;
    this.darkMode = darkMode;

    if(this.display == "state") {
      this._currentTitle = this.title;
    }
    this.circle = new Circle(this.config.circleConfig, this);
    this.historyManager = new EntityHistoryManager(this, historyService, dateRangeManager, linkedEntityService);
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
    this.historyManager.setup();
    this.circle.setup();
  }

  get friendlyName() {
    return this.state.attributes?.friendly_name ?? this.id;
  }

  /** @returns {string} */
  get title() {
    if(this.display == "state") {
      return this.hass.formatEntityState(this.state);
    }
    const title = this.friendlyName;
    if(title.length < 5) {
      return title;
    }
    const regex = /[ _/-]/; 
    return title
      .split(regex)
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

  async update() {
    if(this.display == "state") {
      if(this.title != this._currentTitle) {
        Logger.debug("[Entity] updating marker for " + this.id + " from " + this._currentTitle + " to " + this.state);
        this.marker.remove();
        this.marker = this._createMapMarker();
        this.marker.addTo(this.map);
        this._currentTitle = this.title;
      }
    }
    this.marker.setLatLng(this.latLng);
    this.historyManager.update();
    this.circle.update();
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

    return L.marker(this.latLng, {
      icon: L.divIcon({
        html: `
          <map-card-entity-marker
            entity-id="${this.id}"
            title="${this.title}"
            tooltip="${this.tooltip}"
            icon="${icon ?? ""}"
            picture="${picture ?? ""}"
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
  }
}