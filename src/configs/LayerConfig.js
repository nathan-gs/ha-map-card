export default class LayerConfig {
  /** @type {String} */
  url;
  /** @type {Object} */
  options;

  constructor(url, options, historyConfig, attribution = null) {
    this.url = url;
    this.options = {...{attribution: attribution}, ...options};

    this.historyProperty;
    this.historySource;

    // history: propName
    // history:
    //   property: dateTime - value to set
    //   source: entity.myEntity - source for data. Default to auto (inherit from parent)
    if (historyConfig) {
      // Default source
      this.historySource = 'auto';
      // Array type
      if (historyConfig.property) {
        this.historyProperty = historyConfig.property;
        this.historySource = historyConfig.source ?? this.historySource;
      } else {
        // Singular
        this.historyProperty = historyConfig;
      }
    }

    console.log(this);
  }
}