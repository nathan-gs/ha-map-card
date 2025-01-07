import LayerConfig from "../configs/LayerConfig.js";
import HaUrlResolveService from "../services/HaUrlResolveService.js";
import Logger from "../util/Logger.js";
import Map from 'leaflet';
import TileLayer from "../leaflet/TileLayer.js";
import WMS from "../leaflet/WMS.js";

export default class Layer {
  
  /** @type {string} */
  layerType;
  /** @type {LayerConfig} */
  config;
  /** @type {Map} */
  map;
  /** @type {HaUrlResolveService} */
  urlResolver;

  /**
   * @param {string} layerType 
   * @param {object} config 
   * @param {Map} map 
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
      new WMS(this.url, this.config.options) :
      new TileLayer(this.url, this.config.options);

    this.urlResolver.registerLayer(layer, this.config.url);
    layer.addTo(this.map);
  }
}
