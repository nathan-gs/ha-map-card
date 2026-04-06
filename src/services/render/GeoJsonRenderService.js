import L from "leaflet";
import GeoJsonLayerConfig from "../../configs/GeoJsonLayerConfig.js";
import Logger from "../../util/Logger.js";

/**
 * Service to render GeoJSON layers from Home Assistant entity data
 */
export default class GeoJsonRenderService {
  /** @type {L.Map} */
  map;
  /** @type {object} Home Assistant object */
  hass;
  /** @type {[GeoJsonLayerConfig]} */
  configs = [];
  /** @type {Map<string, {layer: L.GeoJSON, config: GeoJsonLayerConfig}>} */
  layers = new Map();

  /**
   * @param {L.Map} map - Leaflet map instance
   * @param {object} hass - Home Assistant object
   * @param {[GeoJsonLayerConfig]} configs - Array of GeoJSON layer configurations
   */
  constructor(map, hass, configs) {
    this.map = map;
    this.hass = hass;
    this.configs = configs;
  }

  /**
   * Initial setup - creates empty layers
   */
  setup() {
    Logger.debug(`[GeoJsonRenderService]: Setting up ${this.configs.length} GeoJSON layers`);

    this.configs.forEach((config) => {
      try {
        // Create an empty GeoJSON layer with styling
        const layer = L.geoJSON(null, {
          style: () => config.getStyle(),
          pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 6,
              ...config.getStyle()
            });
          }
        });

        layer.addTo(this.map);
        this.layers.set(config.entity, { layer, config });
        Logger.debug(`[GeoJsonRenderService]: Created layer for entity ${config.entity}`);
      } catch (e) {
        Logger.error(`[GeoJsonRenderService]: Failed to create layer for ${config.entity}`, e);
      }
    });
  }

  /**
   * Render/update GeoJSON data from entity states
   * @param {object} hass - Home Assistant object (optional, uses stored if not provided)
   */
  render(hass) {
    if (hass) this.hass = hass;

    this.layers.forEach(({ layer, config }, entityId) => {
      try {
        const geoJsonData = this._getGeoJsonFromEntity(config);

        if (geoJsonData) {
          // Clear existing data and add new
          layer.clearLayers();
          layer.addData(geoJsonData);
          Logger.debug(`[GeoJsonRenderService]: Updated layer for ${entityId}`);
        } else {
          // No data available, clear the layer
          layer.clearLayers();
        }
      } catch (e) {
        Logger.error(`[GeoJsonRenderService]: Failed to update layer for ${entityId}`, e);
      }
    });
  }

  /**
   * Extract GeoJSON data from a Home Assistant entity
   * @param {GeoJsonLayerConfig} config - Layer configuration
   * @returns {object|null} GeoJSON object or null if not available
   */
  _getGeoJsonFromEntity(config) {
    const entityState = this.hass.states[config.entity];

    if (!entityState) {
      Logger.debug(`[GeoJsonRenderService]: Entity ${config.entity} not found`);
      return null;
    }

    let data;

    if (config.attribute) {
      // Get data from a specific attribute path
      data = this._getNestedValue(entityState.attributes, config.attribute);
    } else {
      // Try to use the entire attributes object or state as GeoJSON
      data = entityState.attributes.geojson || entityState.attributes;
    }

    if (!data) {
      Logger.debug(`[GeoJsonRenderService]: No data found for ${config.entity} at attribute ${config.attribute}`);
      return null;
    }

    // Convert to proper GeoJSON format if needed
    return this._normalizeGeoJson(data);
  }

  /**
   * Get a nested value from an object using dot notation and array access
   * Supports paths like "routes[0].geometry" or "data.coordinates"
   * @param {object} obj - Object to traverse
   * @param {string} path - Path string
   * @returns {*} Value at path or undefined
   */
  _getNestedValue(obj, path) {
    if (!obj || !path) return undefined;

    // Parse path: handle both dot notation and array brackets
    // "routes[0].geometry" -> ["routes", "0", "geometry"]
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');

    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Normalize data to valid GeoJSON format
   * @param {object} data - Raw data that might be GeoJSON
   * @returns {object|null} Valid GeoJSON object or null
   */
  _normalizeGeoJson(data) {
    if (!data) return null;

    // If it's already a valid GeoJSON object
    if (data.type && ['Feature', 'FeatureCollection', 'Point', 'LineString',
        'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon',
        'GeometryCollection'].includes(data.type)) {
      return data;
    }

    // If it has coordinates directly (geometry without type wrapper)
    if (data.coordinates && Array.isArray(data.coordinates)) {
      // Try to infer the geometry type from coordinates structure
      const coords = data.coordinates;
      let type = 'Point';

      if (Array.isArray(coords[0])) {
        if (Array.isArray(coords[0][0])) {
          type = 'Polygon';
        } else {
          type = 'LineString';
        }
      }

      return {
        type: 'Feature',
        geometry: {
          type: type,
          coordinates: coords
        },
        properties: {}
      };
    }

    // If it's an array of coordinates (simple line)
    if (Array.isArray(data) && data.length > 0) {
      // Check if it's an array of [lng, lat] pairs
      if (Array.isArray(data[0]) && data[0].length >= 2 &&
          typeof data[0][0] === 'number') {
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: data
          },
          properties: {}
        };
      }
    }

    Logger.debug(`[GeoJsonRenderService]: Could not normalize data to GeoJSON`, data);
    return null;
  }

  /**
   * Clean up layers when component is disconnected
   */
  cleanup() {
    this.layers.forEach(({ layer }) => {
      layer.remove();
    });
    this.layers.clear();
  }
}
