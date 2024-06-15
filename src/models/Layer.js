import LayerConfig from "../configs/LayerConfig.js";
import Logger from "../util/Logger.js";
import L from 'leaflet';

export default class Layer {
  
  /** @type {string} */
  layerType;
  /** @type {LayerConfig} */
  config;
  /** @type {L.map} */
  map;

  constructor(layerType, config, map) {
    this.layerType = layerType;
    this.config = config;
    this.map = map;
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
    return this.config.url;
  }

  render() {
    Logger.debug(`Setting up layer of type ${this.layerType}`);
    if(this.isWms) {
      L.tileLayer.wms(this.config.url, this.config.options).addTo(this.map);
    }
    if(this.isTileLayer) {
      L.tileLayer(this.config.url, this.config.options).addTo(this.map);
    }
  }
}