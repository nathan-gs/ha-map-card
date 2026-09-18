export default class Plugin {
  // The Home Assistant `hass` object. Set before init() is called and
  // refreshed before every update(), so it always holds the current state.
  hass;

  // can be overwritten if necessary
  constructor(map, name, options = {}) {
    // TODO error if map and name are undef?
    this.map = map;
    this.name = name;
    this.options = options;
  }

  async init() {
    // Optional, called after the plugin has been constructed
  }

  async renderMap() {
    // Mandatory, the method that modifies/updates the leaflet map itself
    throw new Error(`Plugin ${this.name} does not implement a renderMap() method!`, { cause: 'NotImplemented' });
  }

  async update() {
    // Optional, called by the PluginsRenderService.render method
    // useful if plugin needs to respond to HA state (read it from this.hass).
  }

  destroy() {
    // Mandatory. Called from PluginsRenderService.cleanup when the
    // MapCard.disconnectedCallback is called. Use this to clean up
    // the state, remove listeners, intervals, timers, etc.
    throw new Error(`Plugin ${this.name} does not implement a destroy() method!`, { cause: 'NotImplemented' });
  }
}
