import LayerConfig from "../configs/LayerConfig.js";
import HaUrlResolveService from "../services/HaUrlResolveService.js";
import Logger from "../util/Logger.js";
import L from 'leaflet';
import { TileLayer2, tileLayer2 } from "../util/TileLayer2.js";

export default class Layer {
  
  /** @type {string} */
  layerType;
  /** @type {LayerConfig} */
  config;
  /** @type {L.map} */
  map;
  /** @type {HaUrlResolveService} */
  urlResolver;

  /**
   * @param {string} layerType 
   * @param {object} config 
   * @param {L.map} map 
   * @param {HaUrlResolveService} urlResolver 
   */
  constructor(layerType, config, map, urlResolver) {
    this.layerType = layerType;
    this.config = config;
    this.map = map;
    this.urlResolver = urlResolver;
  }

  get isWms() {
    return this.layerType === "wms";
  }

  get isTileLayer() {
    return this.layerType === "tile";
  }

  get options() {
    return this.config.options;
  }

  get url() { 
    return this.urlResolver.resolveUrl(this.config.url);
  }

  render() {
    Logger.debug(`[Layer]: Setting up layer of type ${this.layerType}`);
    const layer = this.isWms ? 
      tileLayer2.wms(this.url, this.config.options) :
      tileLayer2(this.url, this.config.options);
    this.urlResolver.registerLayer(layer, this.config.url);
    layer.addTo(this.map);
  }
}
