import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import MapCard from './MapCard.js';

jest.mock('leaflet');
jest.mock('lit', () => ({
  LitElement: class LitElement {
    static get properties() { return {}; }
    static get styles() { return ''; }
    requestUpdate() {}
    connectedCallback() {}
  },
  html: (strings) => strings.join(''),
  css: (strings) => strings.join('')
}));
jest.mock('../util/Logger.js');

describe('MapCard', () => {
  let card;

  beforeEach(() => {
    card = new MapCard();
    card.setup = jest.fn();
    card.requestUpdate = jest.fn();
    card.shadowRoot = {
      querySelector: jest.fn()
    };
  });

  describe('firstUpdated', () => {
    it('should call setup() when hass is available', () => {
      card.hass = { states: {}, themes: {} };

      card.firstUpdated();

      expect(card.setup).toHaveBeenCalled();
    });

    it('should not call setup() when hass is unavailable', () => {
      card.hass = undefined;

      card.firstUpdated();

      expect(card.setup).not.toHaveBeenCalled();
    });
  });

  describe('render', () => {
    beforeEach(() => {
      card._config = {
        title: 'Test',
        mapHeight: 300
      };
      card.hass = { states: {}, themes: { darkMode: false } };
      card.themeMode = 'light';
    });

    it('should call setup() when setupNeeded, hass is available, and #map exists', () => {
      card.setupNeeded = true;
      card.shadowRoot.querySelector.mockReturnValue(document.createElement('div'));

      card.render();

      expect(card.setup).toHaveBeenCalled();
      expect(card.shadowRoot.querySelector).toHaveBeenCalledWith('#map');
    });

    it('should not call setup() when setupNeeded is false', () => {
      card.setupNeeded = false;
      card.shadowRoot.querySelector.mockReturnValue(document.createElement('div'));

      card.render();

      expect(card.setup).not.toHaveBeenCalled();
    });

    it('should not call setup() when hass is unavailable', () => {
      card.setupNeeded = true;
      card.hass = undefined;
      card.shadowRoot.querySelector.mockReturnValue(document.createElement('div'));

      card.render();

      expect(card.setup).not.toHaveBeenCalled();
    });

    it('should not call setup() when #map element is missing', () => {
      card.setupNeeded = true;
      card.shadowRoot.querySelector.mockReturnValue(null);

      card.render();

      expect(card.setup).not.toHaveBeenCalled();
    });
  });

  describe('connectedCallback', () => {
    it('should request an update when setupNeeded is true', () => {
      card.setupNeeded = true;

      card.connectedCallback();

      expect(card.requestUpdate).toHaveBeenCalled();
    });

    it('should not request an update when setupNeeded is false', () => {
      card.setupNeeded = false;

      card.connectedCallback();

      expect(card.requestUpdate).not.toHaveBeenCalled();
    });
  });

  describe('_sameConfigExceptEntities', () => {
    it('ignores added, removed, and restyled entities without mutating either config', () => {
      const oldConfig = Object.freeze({
        zoom: 12,
        entities: ['geo_location.removed', { entity: 'geo_location.kept', color: 'red' }],
      });
      const newConfig = Object.freeze({
        zoom: 12,
        entities: [{ entity: 'geo_location.kept', color: 'yellow' }, 'geo_location.added'],
      });

      expect(card._sameConfigExceptEntities(oldConfig, newConfig)).toBe(true);
      expect(oldConfig.entities).toHaveLength(2);
      expect(newConfig.entities).toHaveLength(2);
    });

    it('treats missing and empty entity lists alike', () => {
      expect(card._sameConfigExceptEntities({ zoom: 12 }, { zoom: 12, entities: [] })).toBe(true);
    });

    it('ignores object key order at every depth, including inside arrays', () => {
      const oldConfig = {
        zoom: 12,
        map_options: { zoomControl: true, center: [1, 2] },
        tile_layers: [{ url: '/tiles', options: { opacity: 0.5, attribution: 'Tiles' } }],
      };
      const newConfig = {
        tile_layers: [{ options: { attribution: 'Tiles', opacity: 0.5 }, url: '/tiles' }],
        map_options: { center: [1, 2], zoomControl: true },
        zoom: 12,
      };

      expect(card._sameConfigExceptEntities(oldConfig, newConfig)).toBe(true);
    });

    it.each([
      [{ zoom: 12 }, { zoom: 13 }],
      [{ tile_layer_url: '/old' }, { tile_layer_url: '/new' }],
      [{ map_options: { zoomControl: true } }, { map_options: { zoomControl: false } }],
      [{ zoom: 12 }, { zoom: 12, title: 'New title' }],
      [{ zoom: 12, title: 'Old title' }, { zoom: 12 }],
      [{ map_options: { center: [1, 2] } }, { map_options: { center: [2, 1] } }],
      [{ tile_layers: [{ url: '/a' }, { url: '/b' }] }, { tile_layers: [{ url: '/b' }, { url: '/a' }] }],
    ])('detects changes to non-entity configuration: %j -> %j', (oldConfig, newConfig) => {
      expect(card._sameConfigExceptEntities(oldConfig, newConfig)).toBe(false);
    });
  });

  describe('_getChangedEntityIds', () => {
    it('reports added, removed, and restyled IDs while excluding unchanged entities', () => {
      const oldEntities = [
        'geo_location.kept',
        'geo_location.removed',
        { entity: 'geo_location.restyled', color: 'red', size: 20 },
      ];
      const newEntities = [
        { entity: 'geo_location.restyled', color: 'yellow', size: 15 },
        'geo_location.added',
        'geo_location.kept',
      ];

      expect(card._getChangedEntityIds(oldEntities, newEntities)).toEqual(new Set([
        'geo_location.removed', 'geo_location.restyled', 'geo_location.added',
      ]));
    });

    it('ignores entity list order and nested object key order', () => {
      const oldEntities = [
        'geo_location.other',
        { entity: 'geo_location.kept', tap_action: { action: 'call-service', data: { a: 1, b: 2 } } },
      ];
      const newEntities = [
        { tap_action: { data: { b: 2, a: 1 }, action: 'call-service' }, entity: 'geo_location.kept' },
        'geo_location.other',
      ];

      expect(card._getChangedEntityIds(oldEntities, newEntities)).toEqual(new Set());
    });

    it('detects a change from a string ID to a styled entity config', () => {
      expect(card._getChangedEntityIds(
        ['geo_location.strike'],
        [{ entity: 'geo_location.strike', color: 'red' }]
      )).toEqual(new Set(['geo_location.strike']));
    });

    it('handles empty lists', () => {
      expect(card._getChangedEntityIds([], [])).toEqual(new Set());
      expect(card._getChangedEntityIds([], ['geo_location.added'])).toEqual(new Set(['geo_location.added']));
      expect(card._getChangedEntityIds(['geo_location.removed'], [])).toEqual(new Set(['geo_location.removed']));
    });
  });

  describe('setConfig', () => {
    it('reconciles entity-only updates while preserving the map and its current view', () => {
      card.setConfig({ zoom: 12, entities: ['geo_location.old'] });
      const map = { remove: jest.fn(), setView: jest.fn() };
      card.map = map;
      card.hass = { states: {} };
      card.entitiesRenderService = { reconfigure: jest.fn() };
      card.setupNeeded = false;
      const newConfig = { entities: [{ entity: 'geo_location.new', color: 'red' }], zoom: 12 };

      card.setConfig(newConfig);

      expect(card.entitiesRenderService.reconfigure).toHaveBeenCalledWith(
        card._config.entities, card.hass, new Set(['geo_location.old', 'geo_location.new'])
      );
      expect(card._config.entities[0].id).toBe('geo_location.new');
      expect(card.config).toBe(newConfig);
      expect(card.map).toBe(map);
      expect(card.setupNeeded).toBe(false);
      expect(map.remove).not.toHaveBeenCalled();
      expect(map.setView).not.toHaveBeenCalled();
    });

    it('requests setup for the initial configuration', () => {
      card.setConfig({ entities: ['geo_location.strike'] });

      expect(card.setupNeeded).toBe(true);
    });

    it('requests a rebuild when map configuration changes', () => {
      card.setConfig({ zoom: 12, entities: ['geo_location.strike'] });
      card.map = {};
      card.entitiesRenderService = { reconfigure: jest.fn() };
      card.setupNeeded = false;

      card.setConfig({ zoom: 13, entities: ['geo_location.strike'] });

      expect(card.setupNeeded).toBe(true);
      expect(card.entitiesRenderService.reconfigure).not.toHaveBeenCalled();
    });

    it('keeps a pending map rebuild when another entity update arrives before rendering', () => {
      card.setConfig({ zoom: 12, entities: ['geo_location.strike'] });
      card.map = {};
      card.entitiesRenderService = { reconfigure: jest.fn() };
      card.setupNeeded = false;
      card.setConfig({ zoom: 13, entities: ['geo_location.strike'] });

      card.setConfig({ zoom: 13, entities: ['geo_location.strike', 'geo_location.added'] });

      expect(card.setupNeeded).toBe(true);
      expect(card.entitiesRenderService.reconfigure).not.toHaveBeenCalled();
    });
  });

  it('passes the latest hass snapshot into the normal entity render path', () => {
    card.setConfig({ entities: ['geo_location.strike'] });
    card.map = {};
    card.setupNeeded = false;
    card.hass = { states: {} };
    card.pluginsRenderService = { render: jest.fn() };
    card.tileLayersService = { render: jest.fn() };
    card.geoJsonRenderService = { render: jest.fn() };
    card.entitiesRenderService = { render: jest.fn() };
    card.initialViewRenderService = { render: jest.fn() };

    card.render();
    expect(card.entitiesRenderService.render).toHaveBeenLastCalledWith(card.hass);

    card.hass = { states: { 'geo_location.strike': { state: 'updated' } } };
    card.render();
    expect(card.entitiesRenderService.render).toHaveBeenLastCalledWith(card.hass);
  });
});
