import EntityConfig from "./EntityConfig.js";
import PluginConfig from "./PluginConfig.js";
import TileLayerConfig from "./TileLayerConfig.js";
import WmsLayerConfig from "./WmsLayerConfig.js";
import Logger from "../util/Logger.js";
import Entity from "../models/Entity.js";


export default class MapConfig {
  /** @type {string} */
  title;
  focusEntity;
  /** @type {number} */
  x;
  /** @type {number} */
  y;
  /** @type {number} */
  zoom;
  /** @type {number} */
  cardSize;
  /** @type {[EntityConfig]} */
  entities;
  /** @type {[WmsLayerConfig]} */
  wms;
  /** @type {[TileLayerConfig]} */
  tileLayers;
  /** @type {TileLayerConfig} */
  tileLayer;
  /** @type {[PluginConfig]} */
  plugins;
   /** @type {Date|Entity} */
  historyStart;
  /** @type {Date|Entity} */
  historyEnd;
  /** @type {boolean} */
  historyDateSelection;
  /** @type {string} */
  themeMode;
  /** @type {object} */
  mapOptions;
  /** @type {string} */
  focusFollow;

  /** @type {boolean} */
  debug = false;

  constructor(inputConfig) {
    this.title = inputConfig.title;
    this.focusEntity = inputConfig.focus_entity;
    this.focusFollow = ['refocus', 'contains', 'none' ].includes(inputConfig.focus_follow) ? inputConfig.focus_follow : "none";
    this.x = inputConfig.x;
    this.y = inputConfig.y;
    this.zoom = this._setConfigWithDefault(inputConfig.zoom, 12);
    this.cardSize = this._setConfigWithDefault(inputConfig.card_size, 5);
    this.mapOptions = this._setConfigWithDefault(inputConfig.map_options, {});

    // Get theme mode.
    this.themeMode = ['dark', 'light', 'auto'].includes(inputConfig.theme_mode) ? inputConfig.theme_mode : 'auto';

    // Enable debug messaging. 
    // Card is quite chatty with this enabled.
    if (inputConfig.debug){
      Logger.enableDebug();
    }

    // Default historyStart/historyEnd can be set at the top level.
    // Entities can override these dates on an individual basis.
    // 
    // If historyDateSelection is true, this replaces top level date functionality (and any entities that don't provide their own dates will also use this)
    this.historyDateSelection = inputConfig.history_date_selection ? true : false;
    if (this.historyDateSelection) {
      this.historyStart = null;
      this.historyEnd = null;
    } else {
        // Pass as is.
        this.historyStart = inputConfig.history_start ?? null;
        this.historyEnd = inputConfig.history_end ?? "now";
    }

    this.entities = (inputConfig["entities"] ? inputConfig.entities : []).map((ent) => {
      // Pass historyStart/ historyEnd defaults down to entity
      return new EntityConfig(ent, {
          historyStart: this.historyStart,
          historyEnd: this.historyEnd,
          // Is the date range manager enabled
          dateRangeManagerEnabled: (!!this.historyDateSelection)
      });
    });


    // Allow as none array
    let wms = this._setConfigWithDefault(inputConfig.wms, []);
    this.wms = (this._setConfigWithDefault(Array.isArray(wms) ? wms : [wms], [])).map((wms) => {
      return new WmsLayerConfig(wms.url, wms.options, wms.history);
    });

    // Allow as none array
    let tile_layers = this._setConfigWithDefault(inputConfig.tile_layers, []);
    this.tileLayers = (this._setConfigWithDefault(Array.isArray(tile_layers) ? tile_layers : [tile_layers], [])).map((tile) => {
      return new TileLayerConfig(tile.url, tile.options, tile.history);
    });

    // Allow as none array
    let plugins = this._setConfigWithDefault(inputConfig.plugins, []);
    this.plugins = (this._setConfigWithDefault(Array.isArray(plugins) ? plugins : [plugins], [])).map((plugin) => {
      return new PluginConfig(plugin.url, plugin.name, plugin.options);
    });

    this.tileLayer = new TileLayerConfig(
      this._setConfigWithDefault(inputConfig.tile_layer_url, "https://tile.openstreetmap.org/{z}/{x}/{y}.png"),
      this._setConfigWithDefault(inputConfig.tile_layer_options, {}),
      null, // Default layer doesn't pass history by default.
      this._setConfigWithDefault(inputConfig.tile_layer_attribution, '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>')
    );
    if(!(Number.isFinite(this.x) && Number.isFinite(this.y)) && this.focusEntity == null && this.entities.length == 0) {
      throw new Error("We need a map latitude & longitude; set at least [x, y], a focus_entity or have at least 1 entities defined.");
    }
  }

  _setConfigWithDefault(input, d = null) {
    if (!input) {
      if (d == null) {
        throw new Error("Missing key ");
      }
      return d;
    } else {
      return input;
    }
  }

  /** @returns {boolean} if there is a title */
  get hasTitle() {
    return this.title != null;
  }

  /** @returns {number} the map height */
  get mapHeight() {
    if (this.hasTitle) {
      return (this.cardSize * 50) + 20 - 76 - 2;
    } else {
      return (this.cardSize * 50) + 20;
    }
  }
  
  /** @returns {[EntityConfig]} */
  get entitiesWithShowPath() {
    return this.entities.filter((ent) => ent.showPath);
  }

  get isFocusFollowRefocus() {
    return this.focusFollow == "refocus";
  }

  get isFocusFollowNone() {
    return this.focusFollow == "none";
  }

  get isFocusFollowContains() {
    return this.focusFollow == "contains";
  }
}
