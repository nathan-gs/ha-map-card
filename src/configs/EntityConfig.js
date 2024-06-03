import HaMapUtilities from "../util/HaMapUtilities.js"

export default class EntityConfig {
  /** @type {String} */
  id;
  /** @type {String} */
  display;
  /** @type {Int} */
  size;
  /** @type {Date} */
  historyStart;
  /** @type {Date} */
  historyEnd;

  /** @type {String} */
  historyStartEntity;
  historyStartEntitySuffix;
  /** @type {String} */
  historyEndEntity;
  historyEndEntitySuffix;

  /** @type {String} */
  historyLineColor;
  /** @type {Boolean} */
  historyShowDots;
  /** @type {Boolean} */
  historyShowLines;
  /** @type {Double} */
  fixedX;
  /** @type {Double} */
  fixedY;
  /** @type {Double} */
  fallbackX;
  /** @type {Double} */
  fallbackY;
  /** @type {String} */
  css;
  // Cannot be set via config. Passed from parent
  historyManagedExternally;
  
  /** @type {String} */
  picture;
  /** @type {String} */
  color;

  // Is valye of this config item a HistoryEntity vs a date
  isHistoryEntityConfig(value) {
    return (
        value &&
        (typeof value == 'object' && value['entity']) ||
        (typeof value == 'string' && value.includes('.'))
      );
  }

  constructor(config, defaults) {
    this.id = (typeof config === 'string' || config instanceof String)? config : config.entity;
    this.display = config.display ? config.display : "marker";
    this.size = config.size ? config.size : 48;
    // If historyLineColor not set, inherit icon color
    this.color = config.color ?? this._generateRandomColor();
    
    // Get history value to use (normal of default)
    const historyStart = config.history_start ?? defaults.historyStart;
    const historyEnd = config.history_end ?? defaults.historyEnd;

    // If start is an entity, setup entity config
    if (this.isHistoryEntityConfig(historyStart)) {
      this.historyStartEntity = historyStart['entity'] ?? historyStart;
      this.historyStartEntitySuffix = historyStart['suffix'] ?? 'hours ago';
    } else {
        this.historyStart = historyStart ? HaMapUtilities.convertToAbsoluteDate(historyStart) : null;
    }

    // If end is an entity, setup entity config
    if (this.isHistoryEntityConfig(historyEnd)) {
      this.historyEndEntity = historyEnd['entity'] ?? historyEnd;
      this.historyEndEntitySuffix = historyEnd['suffix'] ?? 'hours ago';
    } else {
      this.historyEnd = HaMapUtilities.convertToAbsoluteDate(historyEnd ?? 'now');
    }

    this.historyLineColor = config.history_line_color ?? this.color;
    this.historyShowDots = config.history_show_dots ?? true;
    this.historyShowLines = config.history_show_lines ?? true;
    this.fixedX = config.fixed_x;
    this.fixedY = config.fixed_y;
    this.fallbackX = config.fallback_x;
    this.fallbackY = config.fallback_y;
    this.css = config.css ?? "text-align: center; font-size: 60%;";
    this.picture = config.picture ?? null;

    // If no start/end date values are given, fallback to using date range manager
    this.usingDateRangeManager = (!historyStart && !historyEnd) && defaults.dateRangeManagerEnabled;
  }

  get hasHistory() {
    return this.historyStart != null || this.historyStartEntity != null || this.usingDateRangeManager === true;
  }  

  _generateRandomColor() {
    return "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0");
  }
}

class LayerConfig {
  /** @type {String} */
  url;
  /** @type {Object} */
  options;

  constructor(url, options, attribution = null) {
    this.url = url;
    this.options = {...{attribution: attribution}, ...options};
  }

}