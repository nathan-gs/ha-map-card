import L, {Map, LayerGroup, LatLngBounds} from "leaflet";
import "leaflet.markercluster";
import EntityConfig from "../../configs/EntityConfig";
import Entity from "../../models/Entity";
import Logger from "../../util/Logger";
import HaMapUtilities from "../../util/HaMapUtilities";
import HaDateRangeService from "../HaDateRangeService";
import HaLinkedEntityService from "../HaLinkedEntityService";
import HaHistoryService from "../HaHistoryService";
import FocusFollowConfig from "../../configs/FocusFollowConfig";


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
  /** @type {FocusFollowConfig} */
  focusFollowConfig;
  /** @type {L.MarkerClusterGroup} */
  markerClusterGroup;
  /** @type {boolean} */
  clusterMarkers;

  constructor(map, hass, focusFollowConfig, entityConfigs, linkedEntityService, dateRangeManager, historyService, isDarkMode, clusterMarkers = true) {
    this.map = map;
    this.hass = hass;
    this.focusFollowConfig = focusFollowConfig;
    this.entityConfigs = entityConfigs;
    this.linkedEntityService = linkedEntityService;
    this.dateRangeManager = dateRangeManager;
    this.historyService = historyService;
    this.isDarkMode = isDarkMode;
    this.clusterMarkers = clusterMarkers;
  }

  setup() {
    // Initialize marker cluster group if clustering is enabled
    Logger.debug("[EntitiesRenderService] Clustering enabled: " + this.clusterMarkers);
    if (this.clusterMarkers) {
      this.markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        removeOutsideVisibleBounds: false,
      });
      this.map.addLayer(this.markerClusterGroup);
      Logger.debug("[EntitiesRenderService] Marker cluster group created and added to map");
    }

    this.entities = this.entityConfigs.map((configEntity) => {
      // Attempt to setup entity. Skip on fail, so one bad entity does not affect others.
      try {
        const entity = new Entity(configEntity, this.hass, this.map, this.historyService, this.dateRangeManager, this.linkedEntityService, this.isDarkMode);
        entity.setup(this.markerClusterGroup);
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
      ent.update(this.markerClusterGroup);
    });
    this.updateInitialView();
  }

  toggleClustering() {
    this.clusterMarkers = !this.clusterMarkers;

    if (this.clusterMarkers) {
      // Enable clustering
      this.markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        removeOutsideVisibleBounds: false,
      });
      this.map.addLayer(this.markerClusterGroup);

      // Move all markers to cluster group
      this.entities.forEach((entity) => {
        if (entity.marker && this.map.hasLayer(entity.marker)) {
          this.map.removeLayer(entity.marker);
          this.markerClusterGroup.addLayer(entity.marker);
        }
      });
    } else {
      // Disable clustering
      if (this.markerClusterGroup) {
        this.markerClusterGroup.clearLayers();
        this.map.removeLayer(this.markerClusterGroup);
        this.markerClusterGroup = null;
      }

      // Add all markers directly to map
      this.entities.forEach((entity) => {
        if (entity.marker && !this.map.hasLayer(entity.marker)) {
          entity.marker.addTo(this.map);
        }
      });
    }
  }

  updateInitialView() {
    if(this.focusFollowConfig.isNone) {
      return;
    }
    const points = this.entities.filter(e => e.config.focusOnFit).map((e) => e.latLng);
    if(points.length === 0) {
      return;
    }
    // If not, get bounds of all markers rendered
    const bounds = (new LatLngBounds(points)).pad(0.1);
    if(this.focusFollowConfig.isContains) {
      if(this.map.getBounds().contains(bounds)) {
        return;
      }
    }
    this.map.fitBounds(bounds);
    Logger.debug("[EntitiesRenderService.updateInitialView]: Updating bounds to: " + points.join(","));
  }

  setInitialView() {
    const points = this.entities.filter(e => e.config.focusOnFit).map((e) => e.latLng);
    if(points.length === 0) {
      return;
    }
    // If not, get bounds of all markers rendered
    const bounds = (new LatLngBounds(points)).pad(0.1);    
    this.map.fitBounds(bounds);
    Logger.debug("[EntitiesRenderService.setInitialView]: Setting initial view to: " + points.join(","));
  }
}