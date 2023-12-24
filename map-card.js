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

class MapCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  firstRenderWithMap = true;
  entities = [];



  firstUpdated() {
    this.map = this._setupMap();
  }

  render() {

    if (this.map) {
      // First render is without the map
      if (this.firstRenderWithMap) {
        this.entities = this._firstRender(this.map, this.hass, this.config.entities);
        this.firstRenderWithMap = false;
      }
      this.entities.forEach((ent) => {
        const entity = ent[0];
        const marker = ent[1];
        this._updateEntity(entity, marker, this.hass);
      })

    }

    return html`
            <link rel="stylesheet" href="/static/images/leaflet/leaflet.css">
            <ha-card header="${this.getTitle()}">
                <div id="${this.getCSSId()}" style="height: ${this.getMapHeight()}px;"></div>
            </ha-card>
        `;
  }

  _firstRender(map, hass, entities) {
    console.log("First Render with Map object, resetting size.")
    map.invalidateSize();
    return entities.map((ent) => {
      const stateObj = hass.states[ent];
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
      const marker = this._drawEntityFirstTime(ent, latitude, longitude, icon, friendly_name);
      marker.addTo(map);
      return [ent, marker];
    });
  }

  _drawEntityFirstTime(entityId, latitude, longitude, icon, title) {
    if(icon) {
      var html = `<div class="marker"><ha-icon icon="${icon}">icon</ha-icon></div>`
    } else {
      const abbr = title
        .split(" ")
        .map((part) => part[0])
        .join("")
        .substr(0, 3);
        var html = `<div class="marker">${abbr}</div>`
    }
    // const marker = L.marker([stateObj.attributes.latitude, stateObj.attributes.longitude])
    //   .setIcon(new L.icon({
    //     iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    //     shadowIconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
    //   }))
    //   .bindPopup(entityId);
    const marker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        html: html,
        iconSize: [24, 24],
        className: "",
      }),
      title: entityId,
    });
    return marker;
  }

  _updateEntity(entityId, marker, hass) {
    const stateObj = this.hass.states[entityId];
    marker.setLatLng([stateObj.attributes.latitude, stateObj.attributes.longitude]);
  }

  _setupMap() {
    const mapEl = this.shadowRoot.querySelector('#' + this.getCSSId());
    let map = L.map(mapEl).setView([this.getX(), this.getY()], this.getZoom());

    map.addLayer(
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      })
    );
    this._addWmsLayers(map);
    return map;
  }

  _addWmsLayers(map) {
    this.config.wms.forEach((l) => {
      console.log(l);
      L.tileLayer.wms(l.url, l.options).addTo(map);
    });
  }

  setConfigWithDefault(input, name, d = null) {
    if (!input[name]) {
      if (d == null) {
        throw new Error("Missing key " + name);
      }
      this.config[name] = d;
    } else {
      this.config[name] = input[name];
    }
  }

  setMap(map) {
    this.config.map = map;
  }

  getMap() {
    return this.config.map;
  }

  setConfig(inputConfig) {
    this.config = {};
    this.setConfigWithDefault(inputConfig, "x");
    this.setConfigWithDefault(inputConfig, "y");
    this.setConfigWithDefault(inputConfig, "zoom", 12);
    this.config["title"] = inputConfig["title"];
    this.setConfigWithDefault(inputConfig, "card_size", 6);
    this.setConfigWithDefault(inputConfig, "entities", []);
    this.setConfigWithDefault(inputConfig, "css_id", "map-card-" + (new Date()).getTime());
    this.setConfigWithDefault(inputConfig, "wms", []);

  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return this.config.card_size;
  }

  getMapHeight() {
    if (this.getTitle()) {
      return (this.getCardSize() - 1) * 50;
    } else {
      return this.getCardSize() * 50;
    }
  }

  getCSSId() {
    return this.config.css_id;
  }

  getX() {
    return this.config.x;
  }

  getY() {
    return this.config.y;
  }

  getZoom() {
    return this.config.zoom;
  }

  getTitle() {
    return this.config.title;
  }

  static get styles() {
    return css`    
      :host {
          display:block;     
      }        
      .leaflet-pane {
        z-index: 0 !important;
      }
      .leaflet-control,
      .leaflet-top,
      .leaflet-bottom {
        z-index: 1 !important;
      }
      .marker {
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        width: 48px;
        height: 48px;
        font-size: var(--ha-marker-font-size, 1.5em);
        border-radius: 50%;
        border: 1px solid var(--ha-marker-color, var(--primary-color));
        color: var(--primary-text-color);
        background-color: var(--card-background-color);
      }
    `;
  }
}
customElements.define("map-card", MapCard);