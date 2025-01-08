// Import necessary modules
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import Layer from './Layer.js';
import LayerConfig from "../configs/LayerConfig.js";
import HaUrlResolveService from "../services/HaUrlResolveService.js";
import Logger from "../util/Logger.js";
import L from 'leaflet';

jest.mock('../services/HaUrlResolveService.js');
jest.mock('../util/Logger.js');


describe('Layer', () => {
  let mockMap, mockUrlResolver, mockConfig;

  beforeEach(() => {
    mockMap = {
      addLayer: jest.fn(),
    };    
    mockUrlResolver = new HaUrlResolveService();
    mockConfig = new LayerConfig({
      url: 'test-url',
      options: { some: 'option' }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct properties', () => {
    const layer = new Layer('wms', mockConfig, mockMap, mockUrlResolver);
    expect(layer.layerType).toBe('wms');
    expect(layer.config).toBe(mockConfig);
    expect(layer.map).toBe(mockMap);
    expect(layer.urlResolver).toBe(mockUrlResolver);
  });

  it('should recognize WMS layer type', () => {
    const layer = new Layer('wms', mockConfig, mockMap, mockUrlResolver);
    expect(layer.isWms).toBe(true);
    expect(layer.isTileLayer).toBe(false);
  });

  it('should recognize tile layer type', () => {
    const layer = new Layer('tile', mockConfig, mockMap, mockUrlResolver);
    expect(layer.isWms).toBe(false);
    expect(layer.isTileLayer).toBe(true);
  });

  it('should return config options', () => {
    const layer = new Layer('wms', mockConfig, mockMap, mockUrlResolver);
    expect(layer.options).toBe(mockConfig.options);
  });

  it('should resolve URL with urlResolver', () => {
    mockUrlResolver.resolveUrl = jest.fn(() => 'resolved-url');
    const layer = new Layer('wms', mockConfig, mockMap, mockUrlResolver);
    expect(layer.url).toBe('resolved-url');
    expect(mockUrlResolver.resolveUrl).toHaveBeenCalledWith(mockConfig.url);
  });

  it('should setup a Tile layer correctly', () => {
    const layer = new Layer('tile', mockConfig, mockMap, mockUrlResolver);
    layer.render();

    expect(Logger.debug).toHaveBeenCalledWith('[Layer]: Setting up layer of type tile');
    expect(mockUrlResolver.registerLayer).toHaveBeenCalledWith(expect.any(Object), mockConfig.url);
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.any(L.TileLayer));
  });

  it('should setup a WMS layer correctly', () => {
    const layer = new Layer('wms', mockConfig, mockMap, mockUrlResolver);
    layer.render();

    expect(Logger.debug).toHaveBeenCalledWith('[Layer]: Setting up layer of type wms');
    expect(mockUrlResolver.registerLayer).toHaveBeenCalledWith(expect.any(Object), mockConfig.url);
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.any(L.TileLayer));

  });
});