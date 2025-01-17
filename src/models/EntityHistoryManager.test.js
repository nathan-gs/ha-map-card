import EntityHistoryManager from './EntityHistoryManager';
import { LayerGroup } from 'leaflet';
import Entity from './Entity';
import HaHistoryService from '../services/HaHistoryService';
import HaDateRangeService from '../services/HaDateRangeService';
import HaLinkedEntityService from '../services/HaLinkedEntityService';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../util/Logger');
jest.mock('../util/HaMapUtilities');
jest.mock('../services/HaHistoryService');
jest.mock('../services/HaDateRangeService');
jest.mock('../services/HaLinkedEntityService');

describe('EntityHistoryManager', () => {
  let entityHistoryManager;
  let entity;

  beforeEach(() => {
    const entityConfig = { id: 'testEntity', hasHistory: true, usingDateRangeManager: true, historyStart: new Date(), historyEnd: new Date(), historyLineColor: 'blue', gradualOpacity: 0.5, historyShowDots: true, historyShowLines: true }
    const map = { addLayer: jest.fn() };
    const hass = { states: { 'testEntity': { attributes: { friendly_name: 'Test Entity' } } } };
    const mockHistoryService = new HaHistoryService();
    const mockDateRangeManager = new HaDateRangeService();
    const mockLinkedEntityService = new HaLinkedEntityService();
    entity = new Entity(entityConfig, hass, map, mockHistoryService, mockDateRangeManager, mockLinkedEntityService, true);
    
    entityHistoryManager = new EntityHistoryManager(entity, mockHistoryService, mockDateRangeManager, mockLinkedEntityService);
    entityHistoryManager.historyLayerGroup = new LayerGroup();
  });

  describe('hasHistory getter', () => {
    it('should return the hasHistory config of the entity', () => {
      expect(entityHistoryManager.hasHistory).toBe(true);
    });
  });

  describe('setup', () => {
    it('should initialize historyLayerGroup and setup listeners if hasHistory is true', () => {
      const spyAddLayer = jest.spyOn(entity.map, 'addLayer');
      entityHistoryManager.setup();
      expect(spyAddLayer).toHaveBeenCalledWith(entityHistoryManager.historyLayerGroup);
      spyAddLayer.mockRestore();
    });
  });

  describe('setupListeners', () => {

    it('should setup listeners for LinkedEntityService for history start and end dates', () => {
      const mockOnStateChange = jest.fn();
      entityHistoryManager.linkedEntityService.onStateChange = mockOnStateChange;

      entityHistoryManager.entity.config.historyStartEntity = 'startEntity';
      entityHistoryManager.entity.config.historyEndEntity = 'endEntity';
      entityHistoryManager.setupListeners();
      
      expect(mockOnStateChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('setHistoryDates', () => {
    it('should update currentHistoryStart and currentHistoryEnd', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-12-31');
      entityHistoryManager.setHistoryDates(start, end);
      expect(entityHistoryManager.currentHistoryStart).toEqual(start);
      expect(entityHistoryManager.currentHistoryEnd).toEqual(end);
    });
  });

  describe('refreshHistory', () => {
    it('should clear layers and subscribe to history', () => {
      const spyClearLayers = jest.spyOn(entityHistoryManager.historyLayerGroup, 'clearLayers');
      const spySubscribe = jest.spyOn(entityHistoryManager.historyService, 'subscribe');
      
      entityHistoryManager.refreshHistory();
      
      expect(spyClearLayers).toHaveBeenCalled();
      expect(spySubscribe).toHaveBeenCalled();
      
      spyClearLayers.mockRestore();
      spySubscribe.mockRestore();
    });
  });

  describe('subscribeHistory', () => {
    it('should create new EntityHistory and call subscribe on historyService', () => {
      const spySubscribe = jest.spyOn(entityHistoryManager.historyService, 'subscribe');
      entityHistoryManager.subscribeHistory(new Date(), new Date());
      expect(spySubscribe).toHaveBeenCalledWith(entity.id, expect.any(Date), expect.any(Date), expect.any(Function), undefined);
      spySubscribe.mockRestore();
    });
  });

  describe('update', () => {
    it('should update markers if history exists', () => {
      entityHistoryManager.historyLayerGroup.clearLayers = jest.fn();
      entityHistoryManager.history = { update: jest.fn(() => [[{ addTo: jest.fn() }]])};
      entityHistoryManager.update();
      expect(entityHistoryManager.history.update).toHaveBeenCalled();
    });
  });
});