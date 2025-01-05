import TileLayerConfig from "../../configs/TileLayerConfig";
import WmsLayerConfig from "../../configs/WmsLayerConfig";
import Layer from "../../models/Layer";
import LayerWithHistory from "../../models/LayerWithHistory";
import Map from "leaflet";
import LayerConfig from "../../configs/LayerConfig";
import HaUrlResolveService from "../HaUrlResolveService";
import HaLinkedEntityService from "../HaLinkedEntityService";
import HaDateRangeService from "../HaDateRangeService";


export default class TileLayersService {
  
  /** @type {Map} */
  map;
  /** @type {[TileLayerConfig]} */
  tileLayersConfig = [];
  /** @type {[WmsLayerConfig]} */
  wmsLayersConfig = [];
  /** @type {HaUrlResolveService} */
  urlResolver;
  /** @type {LinkedEntityService} */
  linkedEntityService;
  /** @type {DateRangeManager} */
  dateRangeManager;

  /**
   * @param {Map} map 
   * @param {TileLayerConfig} tileLayersConfig 
   * @param {WmsLayerConfig} wmsLayersConfig 
   * @param {HaUrlResolveService} urlResolver 
   * @param {HaLinkedEntityService} linkedEntityService 
   * @param {HaDateRangeService} dateRangeManager 
   */
  constructor(map, tileLayersConfig, wmsLayersConfig, urlResolver, linkedEntityService, dateRangeManager) {
    this.map = map;
    this.tileLayersConfig = tileLayersConfig;
    this.wmsLayersConfig = wmsLayersConfig;
    this.urlResolver = urlResolver;
    this.linkedEntityService = linkedEntityService;
    this.dateRangeManager = dateRangeManager;
  }

  async setup() {    
    this._addLayers(this.map, this.tileLayersConfig, 'tile');
    this._addLayers(this.map, this.wmsLayersConfig, 'wms');
  }

  async render() {}

  /**
   * @param {Map} map
   * @param {[LayerConfig]} configs  
   * @param {string} layerType 
   */
  _addLayers(map, configs, layerType) {
    configs.forEach((l) => {
      const layer = l.historyProperty 
      ? new LayerWithHistory(layerType, l, map, this.urlResolver, this.linkedEntityService, this.dateRangeManager)
      : new Layer(layerType, l, map, this.urlResolver);
      layer.render();
    });
  }
}