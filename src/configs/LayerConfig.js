export default class LayerConfig {
  /** @type {String} */
  url;
  /** @type {Object} */
  options;

  constructor(url, options, attribution = null) {
    this.url = url;
    this.options = {...{attribution: attribution}, ...options};
  }

}