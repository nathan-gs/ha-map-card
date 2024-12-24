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
  /** @type {object.<string,LayerGroup>} */
  historyLayerGroups = {};
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
        const stateObj = this.hass.states[configEntity.id];
        const {
          //passive,
          icon: entity_icon,
          //radius,
          entity_picture,
          //gps_accuracy: gpsAccuracy,
          friendly_name
        } = stateObj.attributes;

        const state = this.hass.formatEntityState(stateObj);

        // Get lat lng
        let latLng = this.getEntityLatLng(configEntity.id, this.hass.states);
        const latitude = latLng[0] ?? null;
        const longitude = latLng[1] ?? null;

        // If no configured picture, fallback to entity picture
        let picture = configEntity.picture ?? entity_picture;
        // Skip if neither found and return null
        picture = picture ? this.hass.hassUrl(picture) : null;

        // Override icon?
        let icon = configEntity.icon ?? entity_icon;

        const entity = new Entity(configEntity, latitude, longitude, icon, friendly_name, state, picture, this.isDarkMode);      
        entity.marker.addTo(this.map);
        return entity; 
      } catch (e){
        Logger.error("Entity: " + configEntity.id + " skipped due to missing data", e);
        HaMapUtilities.renderWarningOnMap(this.map, "Entity: " + configEntity.id + " could not be loaded. See console for details.");
        return null;
      }
    })
    // Remove skipped entities.
    .filter(v => v);

    this.setupHistory()
  }

  async setupHistory() {
    this.entities.forEach((ent) => {
      
      let historyDebug = `History config for: ${ent.id}\n`;
      
      if (!ent.hasHistory) {
        historyDebug += `- Not enabled`;
        Logger.debug(historyDebug);
        return;
      }

      // Setup layer for entities history
      this.historyLayerGroups[ent.id] = new LayerGroup();
      this.map.addLayer(this.historyLayerGroups[ent.id]);

      // If entity is using the date range manager.
      if (ent.config.usingDateRangeManager) {
        // HaDateRangeService, HaLinkedEntityService and future services should use same structure.
        this.dateRangeManager.onDateRangeChange((range) => {
          ent.setHistoryDates(range.start, range.end);
          this.refreshEntityHistory(ent);
        });

        historyDebug += `- Using DateRangeManager`;
        Logger.debug(historyDebug);
        return;
      }

      // If have start entity, link it
      if (ent.config.historyStartEntity) {
        this.linkedEntityService.onStateChange(
          ent.config.historyStartEntity,
          (newState) => {
            const date = HaMapUtilities.getEntityHistoryDate(newState, ent.config.historyStartEntitySuffix);
            ent.setHistoryDates(date, ent.currentHistoryEnd);
            this.refreshEntityHistory(ent);
          }
        );
        historyDebug += `- Start: linked entity "${ent.config.historyStartEntity}"\n`;
      } else {
        ent.currentHistoryStart = ent.config.historyStart;
        historyDebug += `- Start: fixed date ${ent.currentHistoryStart}\n`;
      }

      // If have end entity, link it.
      if (ent.config.historyEndEntity) {
        this.linkedEntityService.onStateChange(
          ent.config.historyEndEntity,
          (newState) => {
            const date = HaMapUtilities.getEntityHistoryDate(newState, ent.config.historyEndEntitySuffix);
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
      Logger.debug(historyDebug);

      // Render history now if start is fixed and end isn't dynamic
      if (ent.config.historyStart && !ent.config.historyEndEntity) {
        ent.setupHistory(this.historyService, ent.config.historyStart, ent.config.historyEnd);
      }
      
    });
  }

  refreshEntityHistory(ent) {
    Logger.debug(`Refreshing history for ${ent.id}: ${ent.currentHistoryStart} -> ${ent.currentHistoryEnd}`);
    // Remove layer if it already exists.
    if(this.historyLayerGroups[ent.id]) this.map.removeLayer(this.historyLayerGroups[ent.id]);

    this.historyLayerGroups[ent.id] = new LayerGroup();
    this.map.addLayer(this.historyLayerGroups[ent.id]);

    // Subscribe new history
    ent.setupHistory(this.historyService, ent.currentHistoryStart, ent.currentHistoryEnd);
}

  async render() {
    this.entities.forEach((ent) => {
      const stateObj = this.hass.states[ent.id];
      // Get location
      const latLng = this.getEntityLatLng(ent.id, this.hass.states);
      const latitude = latLng[0] ?? null;
      const longitude = latLng[1] ?? null;

      ent.update(this.map, latitude, longitude, this.hass.formatEntityState(stateObj));

      ent.renderHistory().forEach((marker) => {
        marker.addTo(this.historyLayerGroups[ent.id]);
      });
    });
  }

  // Get Lat/Lng of entity. Some entities such as "person" define device_trackers allowing
  // multiple lat/lng sources to be used. This method will call down through these looking for a
  // lat/lng value if none is defined on the parent entity.
  getEntityLatLng(entityId, states) {
    let entity = states[entityId];

    // Do we have Lng/Lat directly?
    if (entity.attributes.latitude && entity.attributes.longitude) {
        return [entity.attributes.latitude, entity.attributes.longitude];
    }

    // If any, see if we can get a lng/lat from one instead
    let subTrackerIds = states[entityId]?.attributes?.device_trackers ?? []
    for(let t=0; t<subTrackerIds.length; t++) {
      entity = states[subTrackerIds[t]];
      if (entity.attributes.latitude && entity.attributes.longitude) {
          return [entity.attributes.latitude, entity.attributes.longitude];
      }
    }

    // :(
    return null;
  }

  setInitialView() {
    const points = this.entities.filter(e => e.config.focusOnFit).map((e) => e.marker.getLatLng());
    // If not, get bounds of all markers rendered
    const bounds = new LatLngBounds(points);
    this.map.fitBounds(bounds.pad(0.1));
    Logger.debug("[EntitiesRenderService.setInitialView]: Setting initial view to: " + points.join(","));
  }
}