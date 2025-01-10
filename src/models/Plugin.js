export default class Plugin {
  constructor(map, name, options = {}) {
    // TODO error if map and name are undef?
    this.map = map;
    this.name = name;
    this.options = options;
  }

  init() { }

  // method that modifies the map itself
  renderMap() { }

  // used if the plugin needs to respond to state changes
  update() { }

}
