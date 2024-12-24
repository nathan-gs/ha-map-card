
import L from 'leaflet';
import { LitElement, html, css } from "lit";
import MapConfig from "../configs/MapConfig.js"
import HaHistoryService from "../services/HaHistoryService.js"
import HaDateRangeService from "../services/HaDateRangeService.js"
import HaLinkedEntityService from "../services/HaLinkedEntityService.js"
import HaMapUtilities from "../util/HaMapUtilities.js"
import Logger from "../util/Logger.js"
import HaUrlResolveService from '../services/HaUrlResolveService.js';
import TileLayersService from '../services/render/TileLayersRenderService.js';
import EntitiesRenderService from '../services/render/EntitiesRenderService.js';
import InitialViewRenderService from '../services/render/InitialViewRenderService.js';

export default class MapCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  setupNeeded = true;  
  /** @type {L.Map} */
  map;
  resizeObserver;
  /** @type {HaHistoryService} */
  historyService;
  /** @type {HaLinkedEntityService} */
  linkedEntityService;
  /** @type {HaDateRangeService} */
  dateRangeManager;
  /** @type {HaUrlResolveService} */
  urlResolver;
  /** @type {string} */
  themeMode;
  /** @type {MapConfig} */
  _config;
  /** @type {TileLayersService} */
  tileLayersService;
  /** @type {EntitiesRenderService} */
  entitiesRenderService;
  /** @type {InitialViewRenderService} */
  initialViewRenderService;
  hasError = false;
  hadError = false;

  setup() {
    Logger.debug("[MapCard] Setting up map card");
    this.themeMode = this._config.themeMode;
    this.map = this._setupMap();
    // redraw the map every time it resizes
    this.resizeObserver = this._setupResizeObserver();
    
    this.tileLayersService = new TileLayersService(this.map, this._config.tileLayers, this._config.wms, this.urlResolver, this.linkedEntityService, this.dateRangeManager);
    // Setup core history service
    this.historyService = new HaHistoryService(this.hass);
    // Is history date range enabled?
    if (this._config.historyDateSelection) {
      this.dateRangeManager = new HaDateRangeService(this.hass);
    }    
    this.entitiesRenderService = new EntitiesRenderService(this.map, this.hass, this._config.entities, this.linkedEntityService, this.dateRangeManager, this.historyService, this._isDarkMode());
    this.initialViewRenderService = new InitialViewRenderService(this.map, this._config, this.hass, this.entitiesRenderService);
  
    try {
      this.tileLayersService.setup();
      this.entitiesRenderService.setup();
      this.initialViewRenderService.setup();

      this.setupNeeded = false;
      this.render();          
      this.hasError = false;
    } catch (e) {
      this.hasError = true;
      this.hadError = true;
      Logger.error(e);
      HaMapUtilities.renderWarningOnMap(this.map, "Error found in first run, check Console");
    }
    Logger.debug("[MapCard] Map card setup complete");
  }

  firstUpdated() {    
    this.setup();
  };


  render() {
    
    if (this.map) {
      if (this.setupNeeded) {
        this.setup();
      }
      this.tileLayersService.render();
      this.entitiesRenderService.render();
      this.initialViewRenderService.render();

      if(!this.hasError && this.hadError) {
        HaMapUtilities.removeWarningOnMap(this.map, "Error found, check Console");
        HaMapUtilities.removeWarningOnMap(this.map, "Error found in first run, check Console");
        this.hadError = false;
      }

    }

    return html`
            <link rel="stylesheet" href="/static/images/leaflet/leaflet.css">
            <ha-card header="${this._config.title}" style="height: 100%">
                <div id="map" style="min-height: ${this._config.mapHeight}px">
                  <ha-icon-button
                    label='Reset focus'
                    style='${this._isDarkMode() ? "color:#ffffff;" : "color:#000000;"} position: absolute; top: 75px; left: 3px; z-index: 1;'
                    @click=${this._fitMap}
                    tabindex="0"
                  >
                    <ha-icon icon="mdi:image-filter-center-focus"></ha-icon>
                  </ha-icon-button>
                </div>
            </ha-card>
        `;
  }

  _fitMap() {
    this.initialViewRenderService.setup();
  }

  _setupResizeObserver() {
    if (this.resizeObserver) {
      return this.resizeObserver;
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === this.map?.getContainer()) {
          this.map?.invalidateSize();
          this.initialViewRenderService?.setup();
        }
      }
    });

    resizeObserver.observe(this.map.getContainer());
    return resizeObserver;
  }

  /** @returns {L.Map} Leaflet Map */
  _setupMap() {
    // Manages watching external entities.
    this.linkedEntityService = new HaLinkedEntityService(this.hass);     
    this.urlResolver = new HaUrlResolveService(this.hass, this.linkedEntityService);
    
    L.Icon.Default.imagePath = "/static/images/leaflet/images/";

    const mapEl = this.shadowRoot.querySelector('#map');
    let map = L.map(mapEl, this._config.mapOptions);

    // Add dark class if darkmode
    this._isDarkMode() ? mapEl.classList.add('dark') : mapEl.classList.add('light');

    let tileUrl = this.urlResolver.resolveUrl(this._config.tileLayer.url);
    let layer = L.tileLayer(tileUrl, this._config.tileLayer.options);
    map.addLayer(layer);
    this.urlResolver.registerLayer(layer, this._config.tileLayer.url);    
    return map;
  }

  

  setConfig(config) {
    this.config = config;
    this._config = new MapConfig(config);
    this.setupNeeded = true;
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return this._config.cardSize;
  }

  connectedCallback() {
    super.connectedCallback();
    Logger.debug("[MapCard.connectedCallback] called");
    // Reinitialize the map when the card gets reloaded but it's still in view
    if (this.shadowRoot.querySelector('#map')) {
      this.setup();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    Logger.debug("[MapCard.disconnectedCallback] called");
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.setupNeeded = true;
    }

    this.resizeObserver?.unobserve(this);
    this.historyService?.unsubscribe();
    this.dateRangeManager?.disconnect();
    this.linkedEntityService?.disconnect();
  }

  _isDarkMode() {
    return (
      this.themeMode === "dark" ||
      (this.themeMode === "auto" && Boolean(this.hass.themes.darkMode))
    );
  }

  static getStubConfig(hass) {
    // Find a power entity for default
    const sampleEntities = Object.keys(hass.states).filter(
      (entityId) => {
        const entity = hass.states[entityId];
        return (entity.state && entity.attributes && entity.attributes.latitude && entity.attributes.longitude); 
      }  
    );

    // Sample config
    return {
      type: 'custom:map-card',
      history_start: '24 hours ago',
      entities: sampleEntities
    };
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
      #map.dark {
         background: #090909;
        color: #ffffff;
        --map-filter: invert(0.9) hue-rotate(170deg) brightness(1.5)
          contrast(1.2) saturate(0.3);
      }
      #map.dark .leaflet-control-attribution {
        background: #000000cc;
        color: #ffffff;
      }
      #map.dark .leaflet-control-attribution a {
        color: #ffffff;
      }
      #map.light {
        background: #ffffff;
        color: #000000;
        --map-filter: invert(0);
      }
      .dark .leaflet-bar a {
        background-color: #1c1c1c;
        color: #ffffff;
      }
      .dark .leaflet-bar a:hover {
        background-color: #313131;
      }
      .leaflet-tile-pane {
        filter: var(--map-filter);
      }
    `;
  }
}
