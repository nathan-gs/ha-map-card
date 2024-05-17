import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

import "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

/*
 * Native Map
 * https://github.com/home-assistant/frontend/blob/dev/src/components/map/ha-map.ts 
 */


class EntityConfig {
  id;
  display;
  size;
  hoursToShow;

  constructor(config) {
    this.id = (typeof config === 'string' || config instanceof String)? config : config.entity;
    this.display = config.display ? config.display : "marker";
    this.size = config.size ? config.size : 24;
    this.hoursToShow = config.hours_to_show ? config.hours_to_show : 0;
  }

  showPath(){
    return this.hoursToShow > 0;
  }
}

class MapCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  firstRenderWithMap = true;
  entities = [];
  /** @type {L.Map} */
  map;
  resizeObserver;


  firstUpdated() {
    this.map = this._setupMap();
    // redraw the map every time it resizes
    this.resizeObserver = this._setupResizeObserver();
  }
  
  render() {    
    if (this.map) {
      // First render is without the map
      if (this.firstRenderWithMap) {
        this.entities = this._firstRender(this.map, this.hass, this.config.entities);
        this.firstRenderWithMap = false;
      }
      this.entities.forEach((ent) => {
        const stateObj = this.hass.states[ent[0]];
        const {
          latitude,
          longitude,
        } = stateObj.attributes;
        const marker = ent[1];
        this._updateEntity(marker, latitude, longitude);
      });

    }

    return html`
            <link rel="stylesheet" href="/static/images/leaflet/leaflet.css">
            <ha-card header="${this._getTitle()}" style="height: 100%">
                <div id="map" style="min-height: ${this._getMapHeight()}px"></div>
            </ha-card>
        `;
  }

  _firstRender(map, hass, entities) {
    console.log("First Render with Map object, resetting size.")
    return entities.map((ent) => {
      const entityId = ent.id;
      const display = ent.display;
      const size = ent.size;
      const stateObj = hass.states[entityId];
      const {
        latitude,
        longitude,
        passive,
        icon,
        radius,
        entity_picture: entityPicture,
        gps_accuracy: gpsAccuracy,
        friendly_name
      } = stateObj.attributes;
      if (!(latitude && longitude)) {
        console.log(ent + " has no latitude & longitude");
      }
      let marker = null;
      switch(display) {
        case "icon":
          marker = this._drawEntityIcon(entityId, latitude, longitude, icon, friendly_name, size)
          break;
        case 'marker':
        default: 
          marker = this._drawEntityMarker(entityId, latitude, longitude, icon, friendly_name, entityPicture)
          break;
      }
      marker.addTo(map);
      return [entityId, marker];
    });
  }

  _markerCss(size) {
    return `style="height: ${size}px; width: ${size}px;"`;
  }

  _drawEntityIcon(entityId, latitude, longitude, icon, title, size) {
    let iconHtml = "";
    if(icon) {
      iconHtml = `<div class="marker" ${this._markerCss(size)}><ha-icon icon="${icon}">icon</ha-icon></div>`
    } else {
      const abbr = title
        .split(" ")
        .map((part) => part[0])
        .join("")
        .substr(0, 3)
        .toUpperCase();
        iconHtml = `<div class="marker" ${this._markerCss(size)}>${abbr}</div>`
    }
    const marker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        html: iconHtml,
        iconSize: [size, size],
        className: "",
      }),
      title: entityId,
    });
    return marker;
  }

  _drawEntityMarker(entityId, latitude, longitude, icon, title, entityPicture) {
    const abbr = title
        .split(" ")
        .map((part) => part[0])
        .join("")
        .substr(0, 3)
        .toUpperCase();

    const marker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        html: `
          <ha-entity-marker
            entity-id="${entityId}"
            entity-name="${abbr}"
            entity-icon="${icon}"
            entity-picture="${
              entityPicture ? this.hass.hassUrl(entityPicture) : ""
            }"
          ></ha-entity-marker>
        `,
        iconSize: [48, 48],
        className: "",
      }),
      title: entityId,
    });
    return marker;
  }

  _updateEntity(marker, latitude, longitude) {
    marker.setLatLng([latitude, longitude]);
  }

  _setupResizeObserver() {
    if (this.resizeObserver) {
      return this.resizeObserver;
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === this.map?.getContainer()) {
          this.map?.invalidateSize();
        }
      }
    });

    resizeObserver.observe(this.map.getContainer());
    return resizeObserver;
  }

  /** @returns {L.Map} */
  _setupMap() {    
    L.Icon.Default.imagePath = "/static/images/leaflet/images/";

    const mapEl = this.shadowRoot.querySelector('#map');
    let map = L.map(mapEl).setView(this._getLatLong(), this._getZoom());

    map.addLayer(
      L.tileLayer(this._getTileLayerUrl(), this._getTileLayerOptions())
    );
    this._addWmsLayers(map);
    this._addTileLayers(map);
    return map;
  }

  _addWmsLayers(map) {
    this._getWmsLayersConfig().forEach((l) => {
      L.tileLayer.wms(l.url, l.options).addTo(map);
    });
  }

  _addTileLayers(map) {
    this._getTileLayersConfig().forEach((l) => {
      L.tileLayer(l.url, l.options).addTo(map);
    });
  }

  _setConfigWithDefault(input, name, d = null) {
    if (!input[name]) {
      if (d == null) {
        throw new Error("Missing key " + name);
      }
      this.config[name] = d;
    } else {
      this.config[name] = input[name];
    }
  }

  setConfig(inputConfig) {
    this.config = {};    
    this._setConfigWithDefault(inputConfig, "zoom", 12);
    this.config["title"] = inputConfig["title"];
    this.config["focus_entity"] = inputConfig["focus_entity"];
    this.config["x"] = inputConfig["x"];
    this.config["y"] = inputConfig["y"];

    this._setConfigWithDefault(inputConfig, "card_size", 5);

    this.config["entities"] = (inputConfig["entities"] ? inputConfig.entities : []).map((ent) => {
      return new EntityConfig(ent);
    });
    //this._setConfigWithDefault(inputConfig, "css_id", "map-card-" + (new Date()).getTime());
    this._setConfigWithDefault(inputConfig, "wms", []);
    this._setConfigWithDefault(inputConfig, "tile_layers", []);
    this._setConfigWithDefault(inputConfig, "tile_layer_url", "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    this._setConfigWithDefault(inputConfig, "tile_layer_attribution", '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>');
    this._setConfigWithDefault(inputConfig, "tile_layer_options", {});
    if(!(Number.isFinite(this.config.x) && Number.isFinite(this.config.y)) && this.config.focus_entity == null && this.config.entities.length == 0) {
      throw new Error("We need a map latitude & longitude; set at least [x, y], a focus_entity or have at least 1 entities defined.");
    }
    
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return this.config.card_size;
  }

  connectedCallback() {
    super.connectedCallback();
    // Reinitialize the map when the card gets reloaded but it's still in view
    if (this.shadowRoot.querySelector('#map')) {
      this.firstUpdated();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }

    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this);
    }
  }

  /** @returns {String} */
  _getTileLayerUrl() {
    return this.config.tile_layer_url;
  }

  /** @returns {} */
  _getTileLayerOptions() {
    return {...{attribution: this._getTileLayerAttribution()}, ...this.config.tile_layer_options};
  }

  /** @returns {[url: String, options: {}]}} */
  _getWmsLayersConfig() {
    return this.config.wms;
  }

  /** @returns {[url: String, options: {}]}} */
  _getTileLayersConfig() {
    return this.config.tile_layers;
  }

  /** @returns {String} */
  _getTileLayerAttribution() {
    return this.config.tile_layer_attribution;
  }

  /** @returns {Int} */
  _getMapHeight() {
    if (this._getTitle()) {
      return (this.getCardSize() * 50) + 20 - 76 - 2;
    } else {
      return (this.getCardSize() * 50) + 20;
    }
  }
  

  /** @returns {[Double, Double]} */
  _getLatLongFromXY() {
    return [this.config.x, this.config.y];
  }

  /** @returns {[Double, Double]} */
  _getLatLong() {
    if(Number.isFinite(this.config.x) && Number.isFinite(this.config.y)) {
      return this._getLatLongFromXY();
    } else {
      return this._getLatLongFromFocusedEntity();
    }
  }

  /** @returns {[Double, Double]} */
  _getLatLongFromFocusedEntity() {   
    const entityId = this.config.focus_entity ? this.config.focus_entity : this.config.entities[0].id;
    const entity = this.hass.states[entityId];
    
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }
    if (!(entity.attributes.latitude || entity.attributes.longitude)) {
      throw new Error(`Entity ${entityId} has no longitude & latitude.`);
    }
    return [entity.attributes.latitude, entity.attributes.longitude];
  }

  /** @returns {Int} */
  _getZoom() {
    return this.config.zoom;
  }

  /** @returns {String} */
  _getTitle() {
    return this.config.title;
  }

  static get styles() {
    return css`       
      #map {
        height: 100%;
        border-radius: var(--ha-card-border-radius,12px);
      }
      .leaflet-pane {
        z-index: 0 !important;
      }
      .leaflet-edit-resize {
        border-radius: 50%;
        cursor: nesw-resize !important;
      }
      .leaflet-control,
      .leaflet-top,
      .leaflet-bottom {
        z-index: 1 !important;
      }
      .leaflet-tooltip {
        padding: 8px;
        font-size: 90%;
        background: rgba(80, 80, 80, 0.9) !important;
        color: white !important;
        border-radius: 4px;
        box-shadow: none !important;
      }
      .marker {
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        font-size: var(--ha-marker-font-size, 1.5em);
        border-radius: 50%;
        border: 1px solid var(--ha-marker-color, var(--primary-color));
        color: var(--primary-text-color);
        background-color: var(--card-background-color);
      }
    `;
  }
}

if (!customElements.get("map-card")) {
  customElements.define("map-card", MapCard);
  console.info(
    `%cnathan-gs/ha-map-card: VERSION`,
    'color: orange; font-weight: bold; background: black'
  )
}