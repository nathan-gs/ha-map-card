/**
 * Configuration for GeoJSON layers from Home Assistant entity attributes
 */
export default class GeoJsonLayerConfig {
  /** @type {string} Entity ID containing GeoJSON data */
  entity;
  /** @type {string|null} Attribute path to GeoJSON data (supports dot notation and array access) */
  attribute;
  /** @type {string} Line/border color */
  color;
  /** @type {number} Line width */
  width;
  /** @type {string} Fill color for polygons */
  fillColor;
  /** @type {number} Fill opacity (0-1) */
  fillOpacity;
  /** @type {number} Line opacity (0-1) */
  opacity;

  /**
   * @param {object} config - Configuration object
   */
  constructor(config) {
    if (!config.entity) {
      throw new Error("GeoJSON layer requires an 'entity' property");
    }

    this.entity = config.entity;
    this.attribute = config.attribute || null;
    this.color = config.color || '#3388ff';
    this.width = config.width || 3;
    this.fillColor = config.fill_color || config.color || '#3388ff';
    this.fillOpacity = config.fill_opacity ?? 0.2;
    this.opacity = config.opacity ?? 1.0;
  }

  /**
   * Get Leaflet style object for this layer
   * @returns {object} Leaflet style options
   */
  getStyle() {
    return {
      color: this.color,
      weight: this.width,
      fillColor: this.fillColor,
      fillOpacity: this.fillOpacity,
      opacity: this.opacity
    };
  }
}
