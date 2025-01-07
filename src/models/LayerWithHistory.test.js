import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import LayerConfig from "../configs/LayerConfig";
import LayerWithHistory from "./LayerWithHistory";  
import HaUrlResolveService from "../services/HaUrlResolveService.js";
import HaLinkedEntityService from "../services/HaLinkedEntityService.js";
import HaDateRangeService from "../services/HaDateRangeService.js";

jest.mock('../services/HaUrlResolveService.js');
jest.mock('../services/HaLinkedEntityService.js');
jest.mock('../services/HaDateRangeService.js');



describe("LayerWithHistory", () => {
  let mockMap, mockUrlResolver, mockLinkedEntityService, mockDateRangeManager, mockConfig;

  beforeEach(() => {
    mockMap = {
      addLayer: jest.fn(),
    }; 
    mockUrlResolver = new HaUrlResolveService();
    mockLinkedEntityService = new HaLinkedEntityService();
    mockDateRangeManager = new HaDateRangeService();
    mockConfig = {
      historyForceMidnight: true,
      historyProperty: 'TIME',
      historySource: 'auto',
      url: 'test-url',
      historyStart: { entity: 'history_entity' },
      historySourceSuffix: 'suffix',
      options: {}
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should have a constructor", () => {
    expect(LayerWithHistory).toBeDefined();
  });

  it("should have a render method", () => {
    expect(new LayerWithHistory('tile', new LayerConfig(), {}, {}, {}, {} ).render).toBeDefined();
  });

  it('should if historyForceMidnight is set, set it to midnight', () => {
    const layerWithHistory = new LayerWithHistory('wms', mockConfig, mockMap, mockUrlResolver, mockLinkedEntityService, mockDateRangeManager);
    const date = new Date('2023-10-05T14:48:00Z');
    layerWithHistory.updateLayer(date);

    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
    expect(date.getUTCMilliseconds()).toBe(0);
  });

  it('should if a historyStart entity is defined, use the LinkedEntityService', () => {
    mockConfig.historyStart = { entity: 'some_entity' };
    const layerWithHistory = new LayerWithHistory('wms', mockConfig, mockMap, mockUrlResolver, mockLinkedEntityService, null);
    layerWithHistory.render();

    expect(mockLinkedEntityService.onStateChange).toHaveBeenCalledWith('some_entity', expect.any(Function));
  });


  it("should update the layer if there is a new date from the DateRangeManager", () => {
      
    const dateRangeManager = {
      listeners: [],
      onDateRangeChange: (callback) => {
        dateRangeManager.listeners.push(callback);
      },
      triggerDateRangeChange: (newDate) => {
        dateRangeManager.listeners.forEach((callback) => callback(newDate));
      }
    };
    const config = new LayerConfig();
    config.historySource = "auto";
    const layer = new LayerWithHistory("tile", config, {}, {}, {}, dateRangeManager);
    layer.updateLayer = jest.fn();
    layer.dateRangeManager = dateRangeManager;
    layer.render();
    dateRangeManager.triggerDateRangeChange("2023-01-01");
    expect(layer.updateLayer).toHaveBeenCalled();

  });

});