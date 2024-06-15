
import L from 'leaflet';
import { LitElement, html, css } from "lit";
import MapConfig from "../configs/MapConfig.js"
import HaHistoryService from "../services/HaHistoryService.js"
import HaDateRangeService from "../services/HaDateRangeService.js"
import HaLinkedEntityService from "../services/HaLinkedEntityService.js"
import HaMapUtilities from "../util/HaMapUtilities.js"
import Logger from "../util/Logger.js"

import Entity from "../models/Entity.js"
import Layer from '../models/Layer.js';
import LayerWithHistory from '../models/LayerWithHistory.js';
import LayerConfig from '../configs/LayerConfig.js';

export default class MapCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  firstRenderWithMap = true;
  /** @type {[Entity]} */
  entities = [];
  /** @type {L.Map} */
  map;
  resizeObserver;
  /** @type {L.LayerGroup} */
  historyLayerGroups = {};
  /** @type {HaHistoryService} */
  historyService;
  /** @type {HaLinkedEntityService} */
  linkedEntityService;
  /** @type {HaDateRangeService} */
  dateRangeManager;

  hasError = false;
  hadError = false;

  firstUpdated() {
    this.map = this._setupMap();
    // redraw the map every time it resizes
    this.resizeObserver = this._setupResizeObserver();
  };

  setUpHistory() {
    // Setup core history service
     this.historyService = new HaHistoryService(this.hass);

    // Is history date range enabled?
    if (this._config.historyDateSelection) {
      this.dateRangeManager = new HaDateRangeService(this.hass);
    }

    // Manages watching external entities.
    this.linkedEntityService = new HaLinkedEntityService(this.hass);     
  }

  refreshEntityHistory(ent) {
      Logger.debug(`Refreshing history for ${ent.id}: ${ent.currentHistoryStart} -> ${ent.currentHistoryEnd}`);
      // Remove layer if it already exists.
      if(this.historyLayerGroups[ent.id]) this.map.removeLayer(this.historyLayerGroups[ent.id]);

      this.historyLayerGroups[ent.id] = new L.LayerGroup();
      this.map.addLayer(this.historyLayerGroups[ent.id]);

      // Subscribe new history
      ent.setupHistory(this.historyService, ent.currentHistoryStart, ent.currentHistoryEnd);
  }

  render() {
    
    if (this.map) {
      if(!this.hasError && this.hadError) {
        HaMapUtilities.removeWarningOnMap(this.map, "Error found, check Console");
        HaMapUtilities.removeWarningOnMap(this.map, "Error found in first run, check Console");
        this.hadError = false;
      }

      // First render is without the map
      if (this.firstRenderWithMap) {
        try {

          this.setUpHistory();

          this.entities = this._firstRender(this.map, this.hass, this._config.entities);

          this.entities.forEach((ent) => {
            // Setup layer for entities history
            this.historyLayerGroups[ent.id] = new L.LayerGroup();
            this.map.addLayer(this.historyLayerGroups[ent.id]);

            let historyDebug = `History config for: ${ent.id}\n`;

            if (!ent.hasHistory) {
              historyDebug += `- Not enabled`;
              Logger.debug(historyDebug);
              return;
            }

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
          this.hasError = false;
        } catch (e) {
          this.hasError = true;
          this.hadError = true;
          Logger.error(e);
          HaMapUtilities.renderWarningOnMap(this.map, "Error found in first run, check Console");
        }
        this.firstRenderWithMap = false;
      }

      this.entities.forEach((ent) => {
        const stateObj = this.hass.states[ent.id];
        const {
          latitude,
          longitude,
        } = stateObj.attributes;
        try {
          ent.update(this.map, latitude, longitude, this.hass.formatEntityState(stateObj));

          ent.renderHistory().forEach((marker) => {
            marker.addTo(this.historyLayerGroups[ent.id]);
          });
          this.hasError = false;
        } catch (e) {
          this.hasError = true;
          this.hadError = true;
          Logger.error(e);
          HaMapUtilities.renderWarningOnMap(this.map, "Error found, check Console");
        }
      });
  
    }

    return html`
            <link rel="stylesheet" href="/static/images/leaflet/leaflet.css">
            <ha-card header="${this._config.title}" style="height: 100%">
                <div id="map" style="min-height: ${this._config.mapHeight}px"></div>
            </ha-card>
        `;
  }

  _firstRender(map, hass, entities) {
    Logger.debug("First Render with Map object, resetting size.")

    // Load layers (need hass to be available)
    this._addLayers(map, this._config.tileLayers, 'tile');
    this._addLayers(map, this._config.wms, 'wms');

    return entities.map((configEntity) => {
      const stateObj = hass.states[configEntity.id];
      const {
        latitude,
        longitude,
        //passive,
        icon,
        //radius,
        entity_picture,
        //gps_accuracy: gpsAccuracy,
        friendly_name
      } = stateObj.attributes;
      const state = hass.formatEntityState(stateObj);

      // If no configured picture, fallback to entity picture
      let picture = configEntity.picture ?? entity_picture;
      // Skip if neither found and return null
      picture = picture ? hass.hassUrl(picture) : null;

      // Attempt to setup entity. Skip on fail, so one bad entity does not affect others.
      try {
        const entity = new Entity(configEntity, latitude, longitude, icon, friendly_name, state, picture);      
        entity.marker.addTo(map);
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

  _setupResizeObserver() {
    if (this.resizeObserver) {
      return this.resizeObserver;
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === this.map?.getContainer()) {
          this.map?.invalidateSize();
        }
      }
    });

    resizeObserver.observe(this.map.getContainer());
    return resizeObserver;
  }

  /** @returns {L.Map} Leaflet Map */
  _setupMap() {    
    L.Icon.Default.imagePath = "/static/images/leaflet/images/";

    const mapEl = this.shadowRoot.querySelector('#map');
    let map = L.map(mapEl).setView(this._getLatLong(), this._config.zoom);

    map.addLayer(
      L.tileLayer(this._config.tileLayer.url, this._config.tileLayer.options)
    );
    return map;
  }

  /**
   * @param {L.Map} map
   * @param {[LayerConfig]} configs  
   * @param {string} layerType 
   */
  async _addLayers(map, configs, layerType) {
    configs.forEach((l) => {
      const layer = l.historyProperty 
      ? new LayerWithHistory(layerType, l, map, this.linkedEntityService, this.dateRangeManager)
      : new Layer(layerType, l, map);
      layer.render();
    });
  }

  setConfig(config) {
    this.config = config;
    this._config = new MapConfig(config);    
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return this._config.cardSize;
  }

  connectedCallback() {
    super.connectedCallback();
    // Reinitialize the map when the card gets reloaded but it's still in view
    if (this.shadowRoot.querySelector('#map')) {
      this.firstUpdated();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.firstRenderWithMap = true;
    }

    this.resizeObserver?.unobserve(this);
    this.historyService?.unsubscribe();
    this.dateRangeManager?.disconnect();
    this.linkedEntityService?.disconnect();
  }

  /** @returns {[number, number]} latitude & longitude */
  _getLatLong() { 
    if(Number.isFinite(this._config.x) && Number.isFinite(this._config.y)) {
      return [this._config.x, this._config.y];
    } else {
      return this._getLatLongFromFocusedEntity();
    }
  }

  /** @returns {[number, number]} latitude & longitude */
  _getLatLongFromFocusedEntity() {
    const entityId = this._config.focusEntity ? this._config.focusEntity : this._config.entities[0].id;
    const entity = this.hass.states[entityId];
    
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }
    if (!(entity.attributes.latitude || entity.attributes.longitude)) {
      throw new Error(`Entity ${entityId} has no longitude & latitude.`);
    }
    return [entity.attributes.latitude, entity.attributes.longitude];
  }

  static getStubConfig(hass) {
    // Find a power entity for default
    const sampleEntities = Object.keys(hass.states).filter(
      (entityId) => {
        const entity = hass.states[entityId];
        return (entity.state && entity.attributes && entity.attributes.latitude && entity.attributes.longitude); 
      }  
    );

    // Sample config
    return {
      type: 'custom:map-card',
      history_start: '24 hours ago',
      entities: sampleEntities
    };
  }

  static get styles() {
    return css`       
      #map {
        height: 100%;
        border-radius: var(--ha-card-border-radius,12px);
      }
      .leaflet-pane {
        z-index: 0 !important;
      }
      .leaflet-edit-resize {
        border-radius: 50%;
        cursor: nesw-resize !important;
      }
      .leaflet-control,
      .leaflet-top,
      .leaflet-bottom {
        z-index: 1 !important;
      }
      .leaflet-tooltip {
        padding: 8px;
        font-size: 90%;
        background: rgba(80, 80, 80, 0.9) !important;
        color: white !important;
        border-radius: 4px;
        box-shadow: none !important;
      }
      .marker {
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        font-size: var(--ha-marker-font-size, 1.5em);
        border-radius: 50%;
        border: 1px solid var(--ha-marker-color, var(--primary-color));
        color: var(--primary-text-color);
        background-color: var(--card-background-color);
      }
    `;
  }
}