import Logger from "../util/Logger.js";
import HaMapUtilities from "../util/HaMapUtilities.js";
import Layer from "./Layer.js";
import HaLinkedEntityService from "../services/HaLinkedEntityService.js";
import HaDateRangeService from "../services/HaDateRangeService.js";
import L from 'leaflet';

export default class LayerWithHistory extends Layer {

  /** @type {HaLinkedEntityService} */
  linkedEntityService;
  /** @type {HaDateRangeService} */
  dateRangeManager;
  /** @type {L.TileLayer} */
  layer;

  constructor(layerType, config, map, urlResolver, linkedEntityService, dateRangeManager) {
    super(layerType, config, map, urlResolver);
    this.linkedEntityService = linkedEntityService;
    this.dateRangeManager = dateRangeManager;
  }

  updateLayer(date) {    
    // Force date to midnight. Some WMS services ignore requests for any other times.
    // Useful when using "days ago" etc, given that can be a specific time.
    if (this.config.historyForceMidnight) {
      date.setUTCHours(0,0,0,0);
    }

    // Set date into `historyProperty` in WMS options
    this.options[this.config.historyProperty] = date.toISOString();

    // Draw our new layer
    let newLayer = this.isWms ? 
      L.tileLayer.wms(this.url, this.options).addTo(this.map) :
      L.tileLayer(this.url, this.options).addTo(this.map);

    // When its ready, remove the old one.
    newLayer.on('load', () => {
      newLayer.off();// remove events
      if(this.layer) this.map.removeLayer(this.layer);
      // And make this the new layer
      this.layer = newLayer;
    });

    Logger.debug(`Layer refreshed with ${this.config.historyProperty}=${date}`);
  }
  
  render() {

    // If source is auto
    if (this.config.historySource == 'auto') {
      // if we have a manager - use it
      if (this.dateRangeManager) {
        Logger.debug(`WMS Layer linked to date range.`);
        this.dateRangeManager.onDateRangeChange((range) => {
          this.updateLayer(range.start);
        });

        return;
      }

      // if we have a historyStart
      if (this.config.historyStart) {
        let historyStart = this.config.historyStart;

        // If start is an entity, setup entity config
        if (HaMapUtilities.isHistoryEntityConfig(historyStart)) {
          let entity = historyStart['entity'] ?? historyStart;
          Logger.debug(`WMS Layer linked entity history_start: ${entity}`);

          // Link history
          this.linkedEntityService.onStateChange(
            entity,
            (newState) => {
              const date = HaMapUtilities.getEntityHistoryDate(newState, historyStart['suffix']);
              this.updateLayer(date);
            }
          );  
        } else {
           // Fixed date?
           Logger.debug(`WMS Layer set with fixed history_start ${historyStart}`);
           this.updateLayer(HaMapUtilities.convertToAbsoluteDate(historyStart));
        }

        return;
      } 
    }

    // History source is set & not auto
    if (this.config.historySource) {
      // if historySource is its own entity. Listen to that instead.
      Logger.debug(`WMS Layer set to track custom date entity ${this.config.historySource}`);
      this.linkedEntityService.onStateChange(
        this.config.historySource, // Must provide a date.
        (newState) => {
          const date = HaMapUtilities.getEntityHistoryDate(newState, this.config.historySourceSuffix);
          this.updateLayer(date);
        }
      );
    }
  }

}