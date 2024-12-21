import Logger from "../util/Logger.js"
import HaLinkedEntityService from "./HaLinkedEntityService.js"

export default class HaUrlResolveService {
  hass;
  /** @type {HaLinkedEntityService} */
  linkedEntityService;
  
  /** @type {object} */
  entityLayers = {};

  constructor(hass, linkedEntityService) {
    this.hass = hass;
    this.linkedEntityService = linkedEntityService;
  };



  /**
   * Resolve URL with states
   * @param {string} url
   * @returns {string}
   */
  resolveUrl(url) {
    return url.replace(/{{\s*states\(['"]([^'"]+)['"]\)\s*}}/g, (match, entityId) => {
      const state = this.hass.states[entityId];
      if(!state) {
        Logger.warn(`[HaUrlResolveService]: ${entityId} not found`);
      } else {
        Logger.debug(`[HaUrlResolveService]: ${entityId} resolving to ${state.state}`);
      }
      return state ? state.state : '';
    });
  }

  resolveEntities(url) {
    const regex = /{{\s*states\(['"]([^'"]+)['"]\)\s*}}/g;
    let match;
    const sensors = [];

    // Loop through all matches in the URL
    while ((match = regex.exec(url)) !== null) {
        sensors.push(match[1]); // match[1] contains the captured group which is the sensor name
    }
    
    return sensors;
  }

  registerLayer(layer, urlTemplate) {
    const entities = this.resolveEntities(urlTemplate);


    entities.forEach(entity => {
      this.entityLayers[entity] = this.entityLayers[entity] || new EntityLayers(entity, this);

      this.entityLayers[entity].layers.add(new LayerUrl(layer, urlTemplate));

      if(!this.entityLayers[entity].registered) {
        this.linkedEntityService.onStateChange(entity, () => {
          Logger.debug(`[HaUrlResolveService]: Updating layer ${layer.layer}`);
          this.entityLayers[entity].update();
        });
        this.entityLayers[entity].registered = true;
      }
    });
    
  }

  deregisterLayer(layer) {
    Object.keys(this.entityLayers).forEach(entity => {
      this.entityLayers[entity].layers = this.entityLayers[entity].layers.filter(layerUrl => layerUrl.layer !== layer);
    });

  }

}

class EntityLayers {
  constructor(entity, urlResolver) {
    this.entity = entity;
    this.layers = new Set();
    this.registered = false;
    this.urlResolver = urlResolver;
  }

  update() {
    this.layers.forEach(layer => {
      layer.layer.setUrl(this.urlResolver.resolveUrl(layer.urlTemplate));
    });
  }
}

class LayerUrl {
  constructor(layer, urlTemplate) {
    this.layer = layer;
    this.urlTemplate = urlTemplate;
  }
}