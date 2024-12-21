import Logger from "../util/Logger.js"

export default class HaUrlResolveService {
  hass;
  
  constructor(hass) {
    this.hass = hass;
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
}