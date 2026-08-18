import EntitiesRenderService from "./EntitiesRenderService";
import Map from 'leaflet';
import HaMapUtilities from '../../util/HaMapUtilities.js';  
import Logger from "../../util/Logger.js";

export default class InitialViewRenderService {

  hass;
  config;
  /** @type {EntitiesRenderService} */
  entitiesRenderService;
  /** @type {Map} */
  map;

  constructor(map, config, hass, entitiesRenderService) {
    this.map = map;
    this.config = config;
    this.hass = hass;
    this.entitiesRenderService = entitiesRenderService;
  }

  setup() {
    Logger.debug("[InitialViewRenderService] Setting up initial view");
    const latLng = this.getConfiguredLatLong(this.config, this.hass);
    
    if (latLng) {
      Logger.debug("[InitialViewRenderService] Setting up initial view to " + latLng);
      this.map.setView(latLng, this.config.zoom);
      return;
    }
    this.entitiesRenderService.setInitialView();
  }

  render() { }

  /**
   * Get latLng based on configuration
   * - Return specific x/y if set
   * - Return x/y of focused entity if provided
   * - Return null (default behavior)
   * @param {object} config
   * @param {object} hass
   * @returns {[number, number]|null}
   */
  getConfiguredLatLong(config, hass) {
    if (Number.isFinite(config.x) && Number.isFinite(config.y)) {
      return [config.x, config.y];
    }

    if (config.focusEntity) {
      return this.getFocusedEntityLatLng(config.focusEntity, hass);
    }

    // Default
    return null;
  }

  /**
   *
   * @param {string} entityId
   * @param {object} hass
   * @returns {[number, number]}
   */
  getFocusedEntityLatLng(entityId, hass) {
    const entity = hass.states[entityId];

    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    // Get lat/lng (inc sub trackers)
    let latLng = HaMapUtilities.getEntityLatLng(entityId, hass.states);
    if (latLng) return latLng;

    // Unable to find
    throw new Error(`Entity ${entityId} has no longitude & latitude.`);
  }
}
