// entity.test.js
import Entity from './Entity.js';
import L from 'leaflet';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

jest.mock('./Circle.js');
jest.mock('../util/Logger.js');
jest.mock('../configs/EntityConfig.js');
jest.mock('./EntityHistoryManager.js');

describe('Entity class', () => {
  let entityConfig, hass, map, historyService, dateRangeManager, linkedEntityService, darkMode;

  beforeEach(() => {
    entityConfig = {
      id: 'test-entity',
      display: 'state',
      circleConfig: {},
      fixedX: 0,
      fixedY: 0,
      fallbackX: 1,
      fallbackY: 1,
      color: 'red',
      size: 20,
      zIndexOffset: 0,
      tapAction: {},
      css: ''
    };
    hass = {
      states: {
        'test-entity': {
          attributes: {
            friendly_name: 'Test Entity',
            entity_picture: null,
            latitude: 40.7128,
            longitude: -74.0060
          }
        },
        hassUrl: jest.fn(url => url)
      },
      formatEntityState: jest.fn(state => 'ENTITY_STATE')
    };
    map = { addTo: jest.fn() };
    historyService = {};
    dateRangeManager = {};
    linkedEntityService = {};
    darkMode = false;

    L.marker = jest.fn(() => ({
      addTo: jest.fn(),
      setLatLng: jest.fn(),
      remove: jest.fn()
    }));
    L.divIcon = jest.fn(() => ({}));
    L.LatLng = jest.fn((lat, lng) => ({ lat, lng }));
  });

  describe('constructor', () => {
    it('initializes correctly', () => {
      entityConfig.display = 'state';
      const entity = new Entity(entityConfig, hass, map, historyService, dateRangeManager, linkedEntityService, darkMode);

      expect(entity.config).toBe(entityConfig);
      expect(entity.hass).toBe(hass);
      expect(entity.map).toBe(map);
      expect(entity.darkMode).toBe(darkMode);
      expect(entity._currentTitle).toBe('ENTITY_STATE');
      expect(entity.circle).toBeDefined();
      expect(entity.historyManager).toBeDefined();
    });
  });

  describe('getters', () => {
    let entity;

    beforeEach(() => {
      entity = new Entity(entityConfig, hass, map, historyService, dateRangeManager, linkedEntityService, darkMode);
    });

    it('should return the entity id', () => {
      expect(entity.id).toBe('test-entity');
    });

    it('should return the display', () => {
      expect(entity.display).toBe('state');
    });

    it('should return the hass.states for entity', () => {
      expect(entity.state).toBe(hass.states['test-entity']);
    });

    it('should return a picture', () => {
      expect(entity.picture).toBeNull();
    });

    it('should return the friendlyName', () => {
      expect(entity.friendlyName).toBe('Test Entity');
    });

    it('should return the tooltip', () => {
      expect(entity.tooltip).toBe('Test Entity');
    });

    it('should return an icon', () => {
      expect(entity.icon).toBeUndefined();
    });
  });

  describe('title getter', () => {

    it('returns the formatted state when display is state', () => {
      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
      entityConfig.display = 'state';

      expect(entity.title).toBe('ENTITY_STATE');
    });

    it('returns the friendly name when available', () => {
      hass.states['test-entity'].attributes.friendly_name = 'Friendly Name';
      entityConfig.display = 'marker';

      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
      expect(entity.title).toBe('FN');
    });

    it('returns the entity id when friendly name is not available', () => {
      hass.states['test-entity'].attributes.friendly_name = null;
      entityConfig.display = 'marker';

      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);

      expect(entity.title).toBe('TE');
    });

    it('returns the first letter of each word when friendly name is long', () => {
      hass.states['test-entity'].attributes.friendly_name = 'Long Friendly Name';
      entityConfig.display = 'marker';

      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
      expect(entity.title).toBe('LFN');
    });

    it('returns the first three letters of the first three words when friendly name is long', () => {
      hass.states['test-entity'].attributes.friendly_name = 'Long Friendly Name With More Words';
      entityConfig.display = 'marker';

      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
      expect(entity.title).toBe('LFN');
    });


  });


  describe('latLng getter', () => {
    it('returns fixed coordinates when present', () => {
      entityConfig.fixedX = 10;
      entityConfig.fixedY = 20;
      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
      const result = entity.latLng;
      
      expect(result.lat).toBe(10);
      expect(result.lng).toBe(20);
    });
  
    it('returns state attributes when fixed coordinates are not set', () => {
      hass.states['test-entity'].attributes = { latitude: 30, longitude: 40 };
      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
      
      expect(entity.latLng.lat).toBe(30);
      expect(entity.latLng.lng).toBe(40);
    });
  
    it('returns from device tracker if no direct attributes', () => {
      hass.states['test-entity'].attributes = {
        device_trackers: ['device1', 'device2']
      };
      hass.states['device1'] = { attributes: {} };
      hass.states['device2'] = { attributes: { latitude: 60, longitude: 70 } };
      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
      expect(entity.latLng.lat).toBe(60);
      expect(entity.latLng.lng).toBe(70);
    });
  
    it('returns fallback coordinates when no other options available', () => {
      hass.states['test-entity'].attributes = {};
      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
      expect(entity.latLng.lat).toBe(1);
      expect(entity.latLng.lng).toBe(1);
    });
  
    it('throws an error if no coordinates can be found', () => {
      entityConfig.fallbackX = null;
      entityConfig.fallbackY = null;
      hass.states['test-entity'].attributes = {};

      const entity = new Entity(entityConfig, hass, jest.fn(), jest.fn(), jest.fn(), jest.fn(), false);
      expect(() => entity.latLng).toThrow("Entity: test-entity has no latitude & longitude and no fallback configured");
    });
  })
});