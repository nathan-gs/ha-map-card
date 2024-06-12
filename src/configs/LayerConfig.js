export default class LayerConfig {
  /** @type {String} */
  url;
  /** @type {Object} */
  options;

  historyProperty;
  historySource;
  historyForceMidnight;
  historySourceSuffix;

  constructor(url, options, historyConfig, attribution = null) {
    this.url = url;
    this.options = {...{attribution: attribution}, ...options};

    // history: propName
    // history:
    //   property: dateTime - value to set
    //   source: entity.myEntity - source for data. Default to auto (inherit from parent)
    //   suffix:
    //   force_midnight:
    if (historyConfig) {
      // Default source
      this.historySource = 'auto';
      // Array type
      if (historyConfig.property) {
        this.historyProperty = historyConfig.property;
        this.historySource = historyConfig.source ?? this.historySource;
        this.historyForceMidnight = historyConfig.force_midnight ?? false;
        this.historySourceSuffix = historyConfig.suffix;
      } else {
        // Singular
        this.historyProperty = historyConfig;
      }
    }
  }
}