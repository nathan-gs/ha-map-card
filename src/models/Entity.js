
import EntityHistory from "../models/EntityHistory.js";
import HaMapUtilities from "../util/HaMapUtilities.js";


export default class Entity {
  /** @type {EntityConfig} */
  config;  
  marker;
  /** @type {[String]} */
  title;
  /** @type {[EntityHistory]} */
  histories = [];

  _currentState;

  // Set initial values
  currentHistoryStart;
  currentHistoryEnd;

  setHistoryDates(start, end){
    this.currentHistoryStart = start;
    this.currentHistoryEnd = end;
  }

  get id() {
    return this.config.id;
  }

  get display() {
    return this.config.display;
  }

  constructor(config, latitude, longitude, icon, title, state, picture) {
    this.config = config;
    if(this.display == "state") {
      title = state;
      this._currentState = state;
    }
    this.title = title;
    this.marker = this._createMapMarker(latitude, longitude, icon, title, picture);
  }

  _markerCss(size) {
    return `style="height: ${size}px; width: ${size}px;"`;
  }

  _abbr(title) {
    if(this.display == "state") {
      return title;
    }
    if(title.length < 5) {
      return title;
    }
    return title
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substr(0, 3)
      .toUpperCase();
  }

  get hasHistory() {
    return this.config.hasHistory;
  }

  _latlong(latitude, longitude) {
    if(this.config.fixedX && this.config.fixedY) {
      return [this.config.fixedX, this.config.fixedY];
    }
    if(latitude == null || longitude == null) {
      console.warn("Entity: " + this.id + " has no latitude & longitude");
      if(this.config.fallbackX == null || this.config.fallbackY == null) {
        console.error("Entity: " + this.id + " has no fallback latitude & longitude");
        throw Error("Entity: " + this.id + " has no latitude & longitude and no fallback configured")
      }
    }
    return [latitude ?? this.config.fallbackX, longitude ?? this.config.fallbackY];
  }

  update(map, latitude, longitude, state) {
    if(this.display == "state") {
      if(state != this._currentState) {
        HaMapUtilities.debug("[Entity] updating marker for " + this.id + " from " + this._currentState + " to " + state);
        this.marker.remove();
        this.marker = this._createMapMarker(latitude, longitude, null, state, null);
        this.marker.addTo(map);
        this._currentState = state;
      }
    }
    this.marker.setLatLng(this._latlong(latitude, longitude));
  }

  setupHistory(historyService, start, end) {
    if(this.hasHistory) {
      const entHist = new EntityHistory(this.id, this.title, this.config.historyLineColor, this.config.historyShowDots, this.config.historyShowLines);
      historyService.subscribe(entHist.entityId, start, end, entHist.retrieve);      
      this.histories.push(entHist);
    }  
  }

  /** @returns {[Polyline|CircleMarker]} */
  renderHistory() {
    return this.histories.map((entHist) => entHist.render()).flat();  
  }

  _createMapMarker(latitude, longitude, icon, title, picture) {
    HaMapUtilities.debug("[MarkerEntity] Creating marker for " + this.id + " with display mode " + this.display);
    if(this.display == "icon") {
      picture = null;
    }
    if(this.display == "state") {
      picture = null;
      icon = null;
    }

    const marker = L.marker(this._latlong(latitude, longitude), {
      icon: L.divIcon({
        html: `
          <map-card-entity-marker
            entity-id="${this.id}"
            title="${this._abbr(title)}"
            tooltip="${title}"
            icon="${icon ?? ""}"
            picture="${
              picture ?? ""
            }"
            color="${this.config.color}"
            style="${this.config.css}"
            size="${this.config.size}"
          ></map-card-entity-marker>
        `,
        iconSize: [this.config.size, this.config.size],
        className: "",
      }),
      title: this.id,
    });
    return marker;
  }
}