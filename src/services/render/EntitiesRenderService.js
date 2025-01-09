import {Map, LayerGroup, LatLngBounds} from "leaflet";
import EntityConfig from "../../configs/EntityConfig";
import Entity from "../../models/Entity";
import Logger from "../../util/Logger";
import HaMapUtilities from "../../util/HaMapUtilities";
import HaDateRangeService from "../HaDateRangeService";
import HaLinkedEntityService from "../HaLinkedEntityService";
import HaHistoryService from "../HaHistoryService";


export default class EntitiesRenderService {

  /** @type {[Entity]} */
  entities = [];
  /** @type {[EntityConfig]} */
  entityConfigs = [];
  /** @type {object} */
  hass;
  /** @type {Map} */
  map;
  /** @type {boolean} */
  isDarkMode = false;
  /** @type {HaDateRangeService} */
  dateRangeManager;
  /** @type {HaLinkedEntityService} */
  linkedEntityService;
  /** @type {HaHistoryService} */
  historyService;

  constructor(map, hass, entityConfigs, linkedEntityService, dateRangeManager, historyService, isDarkMode) {
    this.map = map;
    this.hass = hass;
    this.entityConfigs = entityConfigs;
    this.linkedEntityService = linkedEntityService;
    this.dateRangeManager = dateRangeManager;
    this.historyService = historyService;
    this.isDarkMode = isDarkMode;
  }

  setup() {
    this.entities = this.entityConfigs.map((configEntity) => {
      // Attempt to setup entity. Skip on fail, so one bad entity does not affect others.
      try {
        const entity = new Entity(configEntity, this.hass, this.map, this.historyService, this.dateRangeManager, this.linkedEntityService, this.isDarkMode);
        entity.setup();
        return entity; 
      } catch (e){
        Logger.error("Entity: " + configEntity.id + " skipped due to missing data", e);
        HaMapUtilities.renderWarningOnMap(this.map, "Entity: " + configEntity.id + " could not be loaded. See console for details.");
        return null;
      }
    })
    // Remove skipped entities.
    .filter(v => v);

  }

  async render() {
    this.entities.forEach((ent) => {
      ent.update();
    });
  }

  setInitialView() {
    const points = this.entities.filter(e => e.config.focusOnFit).map((e) => e.latLng);
    // If not, get bounds of all markers rendered
    const bounds = new LatLngBounds(points);
    this.map.fitBounds(bounds.pad(0.1));
    Logger.debug("[EntitiesRenderService.setInitialView]: Setting initial view to: " + points.join(","));
  }
}