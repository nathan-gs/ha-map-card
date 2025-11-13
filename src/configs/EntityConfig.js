import HaMapUtilities from "../util/HaMapUtilities.js"
import Logger from "../util/Logger.js";
import CircleConfig from "./CircleConfig.js";
import GeoJsonConfig from "./GeoJsonConfig.js";

export default class EntityConfig {
  /** @type {string} */
  id;
  /** @type {string} */
  display;
  /** @type {string} */
  attribute;
  /** @type {string} */
  prefix;
  /** @type {string} */
  suffix;
  /** @type {number} */
  size;
  /** @type {Date} */
  historyStart;
  /** @type {Date} */
  historyEnd;

  /** @type {string} */
  historyStartEntity;
  historyStartEntitySuffix;
  /** @type {string} */
  historyEndEntity;
  historyEndEntitySuffix;

  /** @type {string} */
  historyLineColor;
  /** @type {boolean} */
  historyShowDots;
  /** @type {boolean} */
  historyShowLines;
  /** @type {number} */
  fixedX;
  /** @type {number} */
  fixedY;
  /** @type {number} */
  fallbackX;
  /** @type {number} */
  fallbackY;
  /** @type {string} */
  css;
  // Cannot be set via config. Passed from parent
  historyManagedExternally;

  /** @type {string} */
  picture;
  /** @type {string} */
  icon;
  /** @type {string} */
  color;
  /** @type {number} */
  gradualOpacity;
  /** @type {object} */
  tapAction;
  /** @type {boolean} */
  focusOnFit;
  /** @type {number} */
  zIndexOffset;
  /** @type {boolean} */
  useBaseEntityOnly;

  /** @type {CircleConfig} */
  circleConfig;

  /** @type {GeoJsonConfig} */
  geoJsonConfig;

  constructor(config, defaults) {
    this.id = (typeof config === 'string' || config instanceof String) ? config : config.entity;
    this.display = config.display ? config.display : "marker";
    this.attribute = config.attribute ? config.attribute : "";
    this.prefix = config.display === "attribute" ? (config.prefix ? config.prefix : "") : "";
    this.suffix = config.display === "attribute" ? (config.suffix ? config.suffix : "") : "";
    this.size = config.size ? config.size : 48;
    // If historyLineColor not set, inherit icon color
    this.color = config.color ?? this._generateRandomColor();
    this.gradualOpacity = config.gradual_opacity ? config.gradual_opacity : undefined;

    // Get history value to use (normal of default)
    const historyStart = config.history_start ?? defaults.historyStart;
    const historyEnd = config.history_end ?? defaults.historyEnd;

    // If start is an entity, setup entity config
    if (HaMapUtilities.isHistoryEntityConfig(historyStart)) {
      this.historyStartEntity = historyStart['entity'] ?? historyStart;
      this.historyStartEntitySuffix = historyStart['suffix'];
    } else {
      this.historyStart = historyStart ? HaMapUtilities.convertToAbsoluteDate(historyStart) : null;
    }

    // If end is an entity, setup entity config
    if (HaMapUtilities.isHistoryEntityConfig(historyEnd)) {
      this.historyEndEntity = historyEnd['entity'] ?? historyEnd;
      this.historyEndEntitySuffix = historyEnd['suffix'];
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
    this.icon = config.icon ?? null;

    // If no start/end date values are given, fallback to using date range manager
    this.usingDateRangeManager = (!historyStart && !historyEnd) && defaults.dateRangeManagerEnabled;

    // Tap action defaults to standard more-info.
    this.tapAction = (typeof config.tap_action == 'object') ? this.parseAction(config.tap_action) : { action: 'more-info' };

    this.focusOnFit = config.focus_on_fit ?? true;
    this.zIndexOffset = config.z_index_offset ? config.z_index_offset : 1;

    this.useBaseEntityOnly = config.use_base_entity_only ?? false;

    this.circleConfig = new CircleConfig(config.circle, this.color);
    this.geoJsonConfig = new GeoJsonConfig(config.geojson, this.color);
    Logger.debug(
      `[EntityConfig]: created with id: ${this.id}, display: ${this.display}, attribute: ${this.attribute}, prefix: ${this.prefix}, suffix: ${this.suffix}, size: ${this.size}, historyStart: ${this.historyStart}, historyEnd: ${this.historyEnd}, historyStartEntity: ${this.historyStartEntity}, historyEndEntity: ${this.historyEndEntity}, historyLineColor: ${this.historyLineColor}, historyShowDots: ${this.historyShowDots}, historyShowLines: ${this.historyShowLines}, fixedX: ${this.fixedX}, fixedY: ${this.fixedY}, fallbackX: ${this.fallbackX}, fallbackY: ${this.fallbackY}, css: ${this.css}, picture: ${this.picture}, icon: ${this.icon}, color: ${this.color}, gradualOpacity: ${this.gradualOpacity}, tapAction: ${this.tapAction}, focusOnFit: ${this.focusOnFit}, zIndexOffset: ${this.zIndexOffset}, useBaseEntityOnly: ${this.useBaseEntityOnly}, circleConfig: ${this.circleConfig}, geoJsonConfig: ${this.geoJsonConfig}`
    );
  }

  // Get tap action_data
  parseAction(tap_action) {
    // No additional props
    if (['more-info', 'none'].includes(tap_action.action)) {
      return {
        action: tap_action.action,
      };
    }

    if (tap_action.action == 'navigate') {
      // Validate
      if (!tap_action.navigation_path) throw new Error("'navigation_path' is required when using action 'navigate'");

      return {
        action: tap_action.action,
        navigation_path: tap_action.navigation_path
      };
    }
    if (tap_action.action == 'url') {
      // Validate
      if (!tap_action.url_path) throw new Error("'url_path' is required when using action 'url'");

      return {
        action: tap_action.action,
        url_path: tap_action.url_path
      };
    }

    if (tap_action.action == 'call-service') {
      // Validate
      if (!tap_action.service) throw new Error("'service' is required when using action 'call-service'");
      return {
        action: tap_action.action,
        service: tap_action.service,
        // I belive this is truely optional.
        data: tap_action.data
      };
    }

    throw Error(`Unknown tap action "${tap_action.action}". Ensure action on tap_action is set.`);
  }

  get hasHistory() {
    return this.historyStart != null || this.historyStartEntity != null || this.usingDateRangeManager === true;
  }

  _generateRandomColor() {
    // Generate pseudo-random color from provided entity id
    let str = this.id;

    // Generate a BigInt numeric hash of the string provided.
    // 53-bit hash based on cyrb53 (c) 2018 bryc (github.com/bryc). 
    // License: Public domain, https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    let hash = 4294967296 * (2097151 & h2) + (h1 >>> 0);

    // Now that we have a numeric hash, construct a CSS hsl() color with hue derived from the hash above (hash % 360), 95% saturation and 35% lightness.
    // Unlike the simplified RGB approach (#RRGGBB) this method produces colors with similar saturation and lightness, resulting in a more aesthetically pleasing palette.
    // N.B. hue value might be computed to a negative number which is not strictly allowed in HSL palette - but CSS handles these cases well.
    let color = `hsl(${hash % 360}, 95%, 35%)`;
    return color;
  }
}
