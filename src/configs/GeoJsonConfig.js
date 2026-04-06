import Logger from "../util/Logger.js";

export default class GeoJsonConfig {
  /** @type {boolean} */
  enabled;
  /** @type {string} */
  attribute;
  /** @type {string} */
  color;
  /** @type {number} */
  weight;
  /** @type {number} */
  opacity;
  /** @type {number} */
  fillOpacity;
  /** @type {boolean} */
  hideMarker;

  /**
   * @param {object|string|boolean} config 
   * @param {string} defaultColor 
   */
  constructor(config, defaultColor) {
    // Handle disabled case
    if (config === false || config === null || config === undefined) {
      this.enabled = false;
      return;
    }

    // Handle simple string case (just attribute name)
    if (typeof config === 'string') {
      this.enabled = true;
      this.attribute = config;
      this.color = defaultColor;
      this.weight = 3;
      this.opacity = 1.0;
      this.fillOpacity = 0.2;
      this.hideMarker = false;
      return;
    }

    // Handle object configuration
    if (typeof config === 'object') {
      this.enabled = true;
      this.attribute = config.attribute || 'geo_location';
      this.color = config.color || defaultColor;
      this.weight = config.weight !== undefined ? config.weight : 3;
      this.opacity = config.opacity !== undefined ? config.opacity : 1.0;
      this.fillOpacity = config.fill_opacity !== undefined ? config.fill_opacity : 0.2;
      this.hideMarker = config.hide_marker !== undefined ? config.hide_marker : false;
    } else {
      this.enabled = false;
    }

    Logger.debug(
      `[GeoJsonConfig]: created with enabled: ${this.enabled}, attribute: ${this.attribute}, color: ${this.color}, weight: ${this.weight}, opacity: ${this.opacity}, fillOpacity: ${this.fillOpacity}, hideMarker: ${this.hideMarker}`
    );
  }
}