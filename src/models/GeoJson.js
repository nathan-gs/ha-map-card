import L from "leaflet";
import Logger from "../util/Logger.js";
import GeoJsonConfig from "../configs/GeoJsonConfig.js";

export default class GeoJson {
  /** @type {GeoJsonConfig} */
  config;
  /** @type {Entity} */
  entity;
  /** @type {L.GeoJSON} */
  geoJsonLayer;

  /**
   * @param {GeoJsonConfig} config 
   * @param {Entity} entity 
   */
  constructor(config, entity) {
    this.config = config;
    this.entity = entity;
  }

  setup() {
    if (!this.config.enabled) {
      return;
    }

    try {
      const geoJsonData = this._getGeoJsonData();
      if (geoJsonData) {
        this._renderGeoJson(geoJsonData);
      }
    } catch (e) {
      Logger.error(`[GeoJson]: Failed to setup GeoJSON for ${this.entity.id}`, e);
    }
  }

  update() {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Remove existing layer
      if (this.geoJsonLayer) {
        this.entity.map.removeLayer(this.geoJsonLayer);
        this.geoJsonLayer = null;
      }

      // Re-render with updated data
      const geoJsonData = this._getGeoJsonData();
      if (geoJsonData) {
        this._renderGeoJson(geoJsonData);
      }
    } catch (e) {
      Logger.error(`[GeoJson]: Failed to update GeoJSON for ${this.entity.id}`, e);
    }
  }

  /**
   * @private
   * @returns {object|null}
   */
  _getGeoJsonData() {
    const attributeValue = this.entity.attributes[this.config.attribute];

    if (!attributeValue) {
      Logger.debug(`[GeoJson]: No data found in attribute '${this.config.attribute}' for ${this.entity.id}`);
      return null;
    }

    // If it's a string, try to parse it as JSON
    if (typeof attributeValue === 'string') {
      try {
        return JSON.parse(attributeValue);
      } catch (e) {
        Logger.error(`[GeoJson]: Failed to parse GeoJSON string from attribute '${this.config.attribute}' for ${this.entity.id}`, e);
        return null;
      }
    }

    // If it's already an object, use it directly
    if (typeof attributeValue === 'object') {
      return attributeValue;
    }

    Logger.warn(`[GeoJson]: Attribute '${this.config.attribute}' for ${this.entity.id} is not a valid GeoJSON object or string`);
    return null;
  }

  /**
   * @private
   * @param {object} geoJsonData 
   */
  _renderGeoJson(geoJsonData) {
    const style = {
      color: this.config.color,
      weight: this.config.weight,
      opacity: this.config.opacity,
      fillOpacity: this.config.fillOpacity
    };

    this.geoJsonLayer = L.geoJSON(geoJsonData, {
      style: () => style,
      pointToLayer: (feature, latlng) => {
        // For point features, create a circle marker with the configured style
        return L.circleMarker(latlng, {
          radius: 6,
          ...style,
          fillOpacity: 0.8
        });
      },
      onEachFeature: (feature, layer) => {
        // Add tooltip if feature has properties
        if (feature.properties) {
          const tooltipContent = this._createTooltipContent(feature.properties);
          if (tooltipContent) {
            layer.bindTooltip(tooltipContent, { direction: 'top' });
          }
        }

        // Make the layer clickable to show entity popup
        layer.on('click', (e) => {
          this._handleLayerClick(e);
        });
      }
    });

    this.geoJsonLayer.addTo(this.entity.map);
    Logger.debug(`[GeoJson]: Rendered GeoJSON for ${this.entity.id}`);
  }

  /**
   * @private
   * @param {object} properties
   * @returns {string}
   */
  _createTooltipContent(properties) {
    // Create a simple tooltip from properties
    const entries = Object.entries(properties)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .slice(0, 5); // Limit to first 5 properties

    return entries.length > 0 ? entries.join('<br>') : '';
  }

  /**
   * Handle click on GeoJSON layer to show entity popup
   * @private
   * @param {L.LeafletMouseEvent} e
   */
  _handleLayerClick(e) {
    // Stop propagation to prevent map click
    L.DomEvent.stopPropagation(e);

    // Create and dispatch hass-action event to show entity more-info dialog
    const event = new CustomEvent('hass-action', {
      bubbles: true,
      composed: true,
      detail: {
        config: {
          entity: this.entity.id,
          tap_action: this.entity.config.tapAction
        },
        action: 'tap'
      }
    });

    // Dispatch from the map container to ensure it bubbles up to Home Assistant
    this.entity.map.getContainer().dispatchEvent(event);

    Logger.debug(`[GeoJson]: Clicked on GeoJSON for ${this.entity.id}`);
  }
}