import LayerConfig from "../configs/LayerConfig.js";
import HaUrlResolveService from "../services/HaUrlResolveService.js";
import Logger from "../util/Logger.js";
import L from 'leaflet';

export default class Layer {
  
  /** @type {string} */
  layerType;
  /** @type {LayerConfig} */
  config;
  /** @type {L.map} */
  map;
  /** @type {HaUrlResolveService} */
  urlResolver;

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
    Logger.debug(`Setting up layer of type ${this.layerType}`);
    const layer = this.isWms ? 
      L.tileLayer.wms(this.url, this.config.options) :
      L.tileLayer(this.url, this.config.options).addTo(this.map);
    this.urlResolver.registerLayer(layer, this.config.url);
    layer.addTo(this.map);
  }
}