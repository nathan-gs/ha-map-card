
import { DivIcon, LatLng, Map, Marker } from "leaflet";
import Circle from "./Circle.js";
import GeoJson from "./GeoJson.js";
import Logger from "../util/Logger.js"
import EntityConfig from "../configs/EntityConfig.js";
import EntityHistoryManager from "./EntityHistoryManager.js";
import TimelineEntry from "./TimelineEntry.js";

export default class Entity {
  /** @type {EntityConfig} */
  config;
  /** 
   * @private 
   * @type {Marker} 
   */
  marker;
  /** 
   * @private 
   * @type {object} 
   */
  hass;
  /** 
   * @private 
   * @type {Map}
   */
  map;
  /**
   * @private 
   * @type {string} 
   */
  _currentTitle;
  /** 
   * @private
   * @type {boolean} 
   */
  darkMode;
  /**
   * @private
   * @type {Circle}
   */
  circle;
  /**
   * @private
   * @type {GeoJson}
   */
  geoJson;
  /**
   * @private
   * @type {EntityHistoryManager}
   */
  historyManager;
  /** 
   * @private 
   * @type {TimelineEntry} 
   */
  currentTimelineEntry;
  /** 
   * @private
   * @type {LatLng} 
   */
  _currentLatLng;

  constructor(config, hass, map, historyService, dateRangeManager, linkedEntityService, darkMode) {
    this.config = config;
    this.hass = hass;
    this.map = map;
    this.darkMode = darkMode;

    if (this.display == "state" || this.display == "attribute") {
      this._currentTitle = this.title;
    }
    this.circle = new Circle(this.config.circleConfig, this);
    this.geoJson = new GeoJson(this.config.geoJsonConfig, this);
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
    return this.hass.formatEntityState(this.hass.states[this.id], this.currentTimelineEntry?.state.s) ?? this.hass.formatEntityState(this.hass.states[this.id]);
  }

  /** @returns {{[key: string]: object}} */
  get attributes() {
    return this.currentTimelineEntry?.state.a ?? this.hass.states[this.id].attributes;
  }

  /** 
   * @private 
   * @returns {string}
   */
  get picture() {
    // If no configured picture, fallback to entity picture
    let picture = this.config.picture ?? this.attributes.entity_picture;
    // Skip if neither found and return null
    return picture ? this.hass.hassUrl(picture) : null;
  }

  /** @returns {LatLng} */
  get latLng() {
    if (this.config.fixedX && this.config.fixedY) {
      return new LatLng(this.config.fixedX, this.config.fixedY);
    }

    if (this._currentLatLng) {
      return this._currentLatLng;
    }

    // Do we have Lng/Lat directly?
    if (this.attributes.latitude && this.attributes.longitude) {
      return new LatLng(this.attributes.latitude, this.attributes.longitude);
    }

    // Get Lat/Lng of entity. Some entities such as "person" define device_trackers allowing
    // multiple lat/lng sources to be used. This method will call down through these looking for a
    // lat/lng value if none is defined on the parent entity.
    // If any, see if we can get a lng/lat from one instead
    let subTrackerIds = this.attributes.device_trackers ?? []
    for (let t = 0; t < subTrackerIds.length; t++) {
      const entity = this.hass.states[subTrackerIds[t]];
      if (entity.attributes.latitude && entity.attributes.longitude) {
        return new LatLng(entity.attributes.latitude, entity.attributes.longitude);
      }
    }

    Logger.warn("Entity: " + this.id + " has no latitude & longitude");
    if (this.config.fallbackX && this.config.fallbackY) {
      return new LatLng(this.config.fallbackX, this.config.fallbackY);
    }
    Logger.error("Entity: " + this.id + " has no fallback latitude & longitude");
    throw Error("Entity: " + this.id + " has no latitude & longitude and no fallback configured")
  }

  setup() {
    // Only add marker if GeoJSON is not configured to hide it
    if (!this.config.geoJsonConfig.hideMarker) {
      this.marker = this.createMapMarker();
      this.marker.addTo(this.map);
    }
    this.historyManager.setup();
    this.circle.setup();
    this.geoJson.setup();
  }

  /** @param {TimelineEntry} entry */
  react(entry) {
    if (entry.entityId == this.id) {
      this.currentTimelineEntry = entry;
    }
    this._currentLatLng = new LatLng(entry.latitude, entry.longitude);
  }

  get friendlyName() {
    return this.attributes.friendly_name ?? this.id;
  }

  /** @returns {string} */
  get title() {
    if (this.display == "state") {
      return this.state;
    }
    if (this.display == "attribute") {
      return this.hass.formatEntityAttributeValue(this.hass.states[this.id], this.config.attribute);
    }
    const title = this.friendlyName;
    if (title.length < 5) {
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
    return this.config.icon ?? this.attributes.icon;
  }

  async update() {
    // Only update marker if it exists (not hidden by GeoJSON config)
    if (this.marker) {
      if (this.display == "state" || this.display == "attribute") {
        if (this.title != this._currentTitle) {
          Logger.debug("[Entity] updating marker for " + this.id + " from " + this._currentTitle + " to " + this.title);
          this.marker.remove();
          this.marker = this.createMapMarker();
          this.marker.addTo(this.map);
          this._currentTitle = this.title;
        }
      }
      this.marker.setLatLng(this.latLng);
    }
    this.historyManager.update();
    this.circle.update();
    this.geoJson.update();
  }

  /**
   * @private 
   * @returns {Marker}
   */
  createMapMarker() {
    Logger.debug("[MarkerEntity] Creating marker for " + this.id + " with display mode " + this.display);
    let icon = this.icon;
    let picture = this.picture;
    if (this.display == "icon") {
      picture = null;
    }
    if (this.display == "state" || this.display == "attribute") {
      picture = null;
      icon = null;
    }

    const extraCssClasses = this.darkMode ? "dark" : "";

    return new Marker(this.latLng, {
      icon: new DivIcon({
        html: `
          <map-card-entity-marker
            entity-id="${this.id}"
            title="${this.title}"
            prefix="${this.config.prefix}"
            suffix="${this.config.suffix}"
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
