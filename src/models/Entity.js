
import { DivIcon, LatLng, Map, Marker } from "leaflet";
import Circle from "./Circle.js";
import GeoJson from "./GeoJson.js";
import Logger from "../util/Logger.js"
import EntityConfig from "../configs/EntityConfig.js";
import EntityHistoryManager from "./EntityHistoryManager.js";
import TimelineEntry from "./TimelineEntry.js";

export default class Entity {
  /** @type {EntityConfig} */
  config;
  /** 
   * @private 
   * @type {Marker} 
   */
  marker;
  /** 
   * @private 
   * @type {object} 
   */
  hass;
  /** 
   * @private 
   * @type {Map}
   */
  map;
  /**
   * @private 
   * @type {string} 
   */
  _currentTitle;
  /** 
   * @private
   * @type {boolean} 
   */
  darkMode;
  /**
   * @private
   * @type {Circle}
   */
  circle;
  /**
   * @private
   * @type {GeoJson}
   */
  geoJson;
  /**
   * @private
   * @type {EntityHistoryManager}
   */
  historyManager;
  /** 
   * @private 
   * @type {TimelineEntry} 
   */
  currentTimelineEntry;
  /**
   * @private
   * @type {LatLng}
   */
  _currentLatLng;
  /**
   * @private
   * @type {LatLng}
   */
  _lastSetLatLng;

  constructor(config, hass, map, historyService, dateRangeManager, linkedEntityService, darkMode) {
    this.config = config;
    this.hass = hass;
    this.map = map;
    this.darkMode = darkMode;

    if (this.display == "state" || this.display == "attribute") {
      this._currentTitle = this.title;
    }
    this.circle = new Circle(this.config.circleConfig, this);
    this.geoJson = new GeoJson(this.config.geoJsonConfig, this);
    this.historyManager = new EntityHistoryManager(this, historyService, dateRangeManager, linkedEntityService);
  }

  get id() {
    return this.config.id;
  }

  get display() {
    return this.config.display;
  }



  /** @returns {object} */
  get state() {
    return this.hass.formatEntityState(this.hass.states[this.id], this.currentTimelineEntry?.state.s) ?? this.hass.formatEntityState(this.hass.states[this.id]);
  }

  /** @returns {{[key: string]: object}} */
  get attributes() {
    return this.currentTimelineEntry?.state.a ?? this.hass.states[this.id]?.attributes ?? {};
  }

  /** 
   * @private 
   * @returns {string}
   */
  get picture() {
    // If no configured picture, fallback to entity picture
    let picture = this.config.picture ?? this.attributes.entity_picture;
    // Skip if neither found and return null
    return picture ? this.hass.hassUrl(picture) : null;
  }

  /** @returns {LatLng} */
  get latLng() {
    if (this.config.fixedX && this.config.fixedY) {
      return new LatLng(this.config.fixedX, this.config.fixedY);
    }

    if (this._currentLatLng) {
      return this._currentLatLng;
    }

    // Do we have Lng/Lat directly?
    if (this.attributes.latitude && this.attributes.longitude) {
      return new LatLng(this.attributes.latitude, this.attributes.longitude);
    }

    // Get Lat/Lng of entity. Some entities such as "person" define device_trackers allowing
    // multiple lat/lng sources to be used. This method will call down through these looking for a
    // lat/lng value if none is defined on the parent entity.
    // If any, see if we can get a lng/lat from one instead
    let subTrackerIds = this.attributes.device_trackers ?? []
    for (let t = 0; t < subTrackerIds.length; t++) {
      const entity = this.hass.states[subTrackerIds[t]];
      if (entity?.attributes?.latitude && entity.attributes.longitude) {
        return new LatLng(entity.attributes.latitude, entity.attributes.longitude);
      }
    }

    if (this._lastSetLatLng) {
      return this._lastSetLatLng;
    }

    if (this.config.fallbackX && this.config.fallbackY) {
      return new LatLng(this.config.fallbackX, this.config.fallbackY);
    }

    Logger.warn("Entity: " + this.id + " has no latitude & longitude; skipping marker");
    return null;
  }

  setup(clusterGroup = null) {
    // Only add marker if GeoJSON is not configured to hide it and we have a
    // position. Missing/unknown coords used to throw here and abort the rest
    // of the card (#91, #173).
    if (!this.config.geoJsonConfig?.hideMarker && this.latLng) {
      this.marker = this.createMapMarker();

      // Bind distance tooltip if configured
      if (this.config.distanceEntity) {
        this.marker.bindTooltip('', {
          permanent: true,
          direction: 'top',
          offset: [0, -this.config.size / 2 - 5],
          className: 'distance-tooltip'
        });
        this.updateDistanceTooltip(this.hass);
      }

      if (clusterGroup) {
        Logger.debug("[Entity] Adding marker for " + this.id + " to cluster group");
        clusterGroup.addLayer(this.marker);
      } else {
        Logger.debug("[Entity] Adding marker for " + this.id + " directly to map");
        this.marker.addTo(this.map);
      }
      // Initialize last set position to prevent immediate update
      this._lastSetLatLng = this.latLng;
      // Track the current place so update() can recreate the pill on zone change
      this._currentPlaceIcon = this.placeIcon;
      this._clusterGroup = clusterGroup;
      // For `display: pill`, the offset callout + leader only show at/above
      // pillCalloutMinZoom; recreate the marker when zoom crosses that boundary
      // so it isn't obtrusive when zoomed out region-wide.
      if (this.display == "pill") {
        this._calloutActive = this.map.getZoom() >= this.config.pillCalloutMinZoom;
        this._onZoomEnd = () => {
          if (!this.marker) return;
          const active = this.map.getZoom() >= this.config.pillCalloutMinZoom;
          if (active !== this._calloutActive) {
            this._calloutActive = active;
            this._recreateMarker();
          }
        };
        this.map.on("zoomend", this._onZoomEnd);
      }
    }
    this.historyManager.setup();
    this.circle.setup();
    this.geoJson.setup();
  }

  /**
   * Remove and rebuild the marker in place (preserving cluster membership).
   * @private
   */
  _recreateMarker() {
    const cg = this._clusterGroup;
    this.marker.remove();
    this.marker = this.createMapMarker();
    if (cg) {
      cg.addLayer(this.marker);
    } else {
      this.marker.addTo(this.map);
    }
    this._currentTitle = this.title;
    this._currentPlaceIcon = this.placeIcon;
  }

  /** @param {TimelineEntry} entry */
  react(entry) {
    if (entry.entityId == this.id) {
      this.currentTimelineEntry = entry;
    }
    this._currentLatLng = new LatLng(entry.latitude, entry.longitude);
  }

  get friendlyName() {
    return this.attributes.friendly_name ?? this.id;
  }

  /** @returns {string} */
  get title() {
    // Use custom label if provided
    if (this.config.label) {
      return this.config.label;
    }
    if (this.display == "state") {
      return this.state;
    }
    if (this.display == "attribute") {
      return this.hass.formatEntityAttributeValue(this.hass.states[this.id], this.config.attribute);
    }
    const title = this.friendlyName;
    if (title.length < 5) {
      return title;
    }
    const regex = /[ _/-]/;
    return title
      .split(regex)
      .map((part) => part[0])
      .join("")
      .substr(0, 3)
      .toUpperCase();
  }

  /** @returns {string} */
  get tooltip() {
    // placeName only resolves in pill mode and when inside a zone.
    const placeName = this.placeName;
    if (placeName) {
      // "<person> is at <place>" - strip a trailing tracker-ish suffix so
      // "Mom Location" reads as "Mom is at Extended Family".
      const who = (this.friendlyName ?? "").replace(/\s+(location|tracker|device|phone|gps)$/i, "");
      return `${who} is at ${placeName}`;
    }
    return this.friendlyName ?? "";
  }

  get icon() {
    return this.config.icon ?? this.attributes.icon;
  }

  /**
   * The HA zone state object the entity is currently inside (a "named place"),
   * or null when it isn't in one. Drives the place-pill marker. Matches the
   * entity's RAW state against each zone's friendly_name (case-insensitive);
   * the home zone reports state "home".
   * @returns {object|null}
   */
  get zoneState() {
    const raw = this.hass.states[this.id]?.state;
    if (!raw || ["not_home", "away", "unknown", "unavailable"].includes(raw.toLowerCase())) {
      return null;
    }
    const target = raw.toLowerCase();
    for (const eid in this.hass.states) {
      if (!eid.startsWith("zone.")) continue;
      const fn = (this.hass.states[eid].attributes?.friendly_name ?? "").toLowerCase();
      if (fn && fn === target) {
        return this.hass.states[eid];
      }
    }
    if (target === "home" && this.hass.states["zone.home"]) {
      return this.hass.states["zone.home"];
    }
    return null;
  }

  /** @returns {string|null} mdi icon of the current named place (pill mode only). */
  get placeIcon() {
    if (this.display != "pill") return null;
    const z = this.zoneState;
    return z ? (z.attributes?.icon ?? "mdi:map-marker") : null;
  }

  /** @returns {string|null} friendly_name of the current named place (pill mode only). */
  get placeName() {
    if (this.display != "pill") return null;
    const z = this.zoneState;
    return z ? (z.attributes?.friendly_name ?? null) : null;
  }

  /**
   * Format distance value for display
   * @param {number} meters - Distance in meters
   * @param {string} unit - Unit preference (km, mi, or auto)
   * @returns {string} Formatted distance string
   */
  formatDistance(meters, unit) {
    if (!meters || isNaN(meters)) return '';
    const m = parseFloat(meters);
    
    if (unit === 'mi') {
      const miles = m / 1609.344;
      return miles < 0.1 ? Math.round(m * 3.28084) + ' ft' : miles.toFixed(1) + ' mi';
    }
    
    // Default to km/m (metric)
    if (unit === 'km' || unit === 'auto') {
      return m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m';
    }
    
    // Fallback
    if (m >= 1000) return (m / 1000).toFixed(1) + ' km';
    return Math.round(m) + ' m';
  }

  /**
   * Update the distance tooltip content from linked entity
   * @param {object} hass - Home Assistant object
   */
  updateDistanceTooltip(hass) {
    if (!this.config.distanceEntity || !this.marker) return;
    
    const entity = hass?.states?.[this.config.distanceEntity];
    if (entity && entity.state) {
      const distance = this.formatDistance(entity.state, this.config.distanceUnit);
      if (distance) {
        this.marker.setTooltipContent(distance);
      }
    }
  }

  async update(clusterGroup = null) {
    // Entity recovered a position after being unknown/unavailable.
    if (!this.marker && !this.config.geoJsonConfig?.hideMarker && this.latLng) {
      this.marker = this.createMapMarker();
      if (clusterGroup) {
        clusterGroup.addLayer(this.marker);
      } else {
        this.marker.addTo(this.map);
      }
      this._lastSetLatLng = this.latLng;
      this._currentPlaceIcon = this.placeIcon;
    }

    // Only update marker if it exists (not hidden by GeoJSON config)
    if (this.marker) {
      // Recreate the marker when the display title changes (state/attribute
      // modes) OR when the entity enters/leaves a named place (place-pill).
      const titleChanged = (this.display == "state" || this.display == "attribute") && this.title != this._currentTitle;
      const placeIconChanged = this.placeIcon != this._currentPlaceIcon;
      if (titleChanged || placeIconChanged) {
        Logger.debug("[Entity] recreating marker for " + this.id + " (title/place change)");
        // When recreating marker, we need to track if it was in a cluster
        const wasInCluster = clusterGroup && clusterGroup.hasLayer(this.marker);
        this.marker.remove();
        this.marker = this.createMapMarker();
        if (wasInCluster) {
          clusterGroup.addLayer(this.marker);
        } else if (clusterGroup) {
          clusterGroup.addLayer(this.marker);
        } else {
          this.marker.addTo(this.map);
        }
        this._currentTitle = this.title;
        this._currentPlaceIcon = this.placeIcon;
      }

      this.updateMarkerPosition();
    }

    this.historyManager.update();
    this.circle.update();
    this.geoJson.update();
  }

  updateMarkerPosition() {
    if (!this.marker) return;
    const newLatLng = this.latLng;
    if (!newLatLng) return;
    const threshold = this.config.positionUpdateThreshold;
    // Update position only if it has changed significantly (configurable threshold in meters)
    if (!this._lastSetLatLng || this.map.distance(this._lastSetLatLng, newLatLng) > threshold) {
      this.marker.setLatLng(newLatLng);
      this._lastSetLatLng = newLatLng;
    }
  }

  /**
   * @private 
   * @returns {Marker}
   */
  createMapMarker() {
    Logger.debug("[MarkerEntity] Creating marker for " + this.id + " with display mode " + this.display);
    let icon = this.icon;
    let picture = this.picture;
    if (this.display == "icon") {
      picture = null;
    }
    if (this.display == "state" || this.display == "attribute") {
      picture = null;
      icon = null;
    }

    const extraCssClasses = this.darkMode ? "dark" : "";
    // Pill mode (opt-in via display: pill): zone icon + initials when the entity
    // is in a named place; falls back to the normal initials marker otherwise.
    // placeIcon already returns null unless display === "pill".
    const placeIcon = this.placeIcon;
    if (this.display == "pill") {
      icon = null;
    }
    // Pill-callout geometry (must match MapCardEntityMarker's pill render): the
    // pill sits up-left of the point with a short leader line down-right to a
    // dot on the exact location, so it doesn't cover what's underneath. The
    // callout only engages at/above pillCalloutMinZoom; zoomed out, the pill
    // centers on the point with no leader (so it isn't obtrusive region-wide).
    const s = this.config.size;
    const pillW = 2 * s + 14;
    const pillH = s + 8;
    const off = Math.round(s * 0.7);
    const boxW = pillW + off;
    const boxH = pillH + off;
    const callout = placeIcon != null && this.map.getZoom() >= this.config.pillCalloutMinZoom;

    const marker = new Marker(this.latLng, {
      icon: new DivIcon({
        html: `
          <map-card-entity-marker
            entity-id="${this.id}"
            title="${this.title}"
            label="${this.config.label ?? ""}"
            prefix="${this.config.prefix}"
            suffix="${this.config.suffix}"
            tooltip="${this.tooltip}"
            icon="${icon ?? ""}"
            picture="${picture ?? ""}"
            place-icon="${placeIcon ?? ""}"
            callout="${callout}"
            color="${this.config.color}"
            style="${this.config.css}"
            size="${this.config.size}"
            extra-css-classes="${extraCssClasses}"
            tap-action='${JSON.stringify(this.config.tapAction)}'
          ></map-card-entity-marker>
        `,
        iconSize: placeIcon ? (callout ? [boxW, boxH] : [pillW, pillH]) : [s, s],
        iconAnchor: placeIcon ? (callout ? [boxW - 2, boxH - 2] : [pillW / 2, pillH / 2]) : [s / 2, s / 2],
        className: ''
      }),
      zIndexOffset: this.config.zIndexOffset
    });
    // Instant hover label: a Leaflet tooltip opens on mouseover with no delay,
    // unlike the native `title` attribute (which the browser holds ~1s). The
    // distance feature (setup) rebinds a permanent tooltip when configured.
    if (!this.config.distanceEntity) {
      marker.bindTooltip(this.tooltip, {
        direction: "top",
        offset: [0, -this.config.size / 2 - 4]
      });
    }
    return marker;
  }
}
