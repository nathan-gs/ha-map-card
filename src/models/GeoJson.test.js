import GeoJson from './GeoJson';
import GeoJsonConfig from '../configs/GeoJsonConfig';
import Logger from '../util/Logger';
import L from 'leaflet';

// Mock Leaflet
jest.mock('leaflet', () => ({
  geoJSON: jest.fn(() => ({
    addTo: jest.fn()
  })),
  circleMarker: jest.fn(),
  DomEvent: {
    stopPropagation: jest.fn()
  }
}));

// Mock Logger to suppress expected error messages in tests
jest.mock('../util/Logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('GeoJson', () => {
  let mockEntity;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      removeLayer: jest.fn(),
      getContainer: jest.fn(() => ({
        dispatchEvent: jest.fn()
      }))
    };

    mockEntity = {
      id: 'test-entity',
      map: mockMap,
      attributes: {},
      config: {
        tapAction: { action: 'more-info' }
      }
    };

    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should not render when config is disabled', () => {
      const config = new GeoJsonConfig(false, '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.setup();

      expect(L.geoJSON).not.toHaveBeenCalled();
    });

    it('should not render when attribute is missing', () => {
      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.setup();

      expect(L.geoJSON).not.toHaveBeenCalled();
    });

    it('should render GeoJSON from object attribute', () => {
      const geoJsonData = {
        type: 'Point',
        coordinates: [0, 0]
      };

      mockEntity.attributes = {
        zone_data: geoJsonData
      };

      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.setup();

      expect(L.geoJSON).toHaveBeenCalledWith(
        geoJsonData,
        expect.objectContaining({
          style: expect.any(Function),
          pointToLayer: expect.any(Function),
          onEachFeature: expect.any(Function)
        })
      );
    });

    it('should render GeoJSON from string attribute', () => {
      const geoJsonData = {
        type: 'Point',
        coordinates: [0, 0]
      };

      mockEntity.attributes = {
        zone_data: JSON.stringify(geoJsonData)
      };

      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.setup();

      expect(L.geoJSON).toHaveBeenCalledWith(
        geoJsonData,
        expect.any(Object)
      );
    });

    it('should handle invalid JSON string gracefully', () => {
      mockEntity.attributes = {
        zone_data: 'invalid json'
      };

      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.setup();

      expect(L.geoJSON).not.toHaveBeenCalled();
      expect(Logger.error).toHaveBeenCalled();
    });

    it('should apply custom style configuration', () => {
      const geoJsonData = {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
      };

      mockEntity.attributes = {
        zone_data: geoJsonData
      };

      const config = new GeoJsonConfig(
        {
          attribute: 'zone_data',
          color: '#00ff00',
          weight: 5,
          opacity: 0.8,
          fill_opacity: 0.5
        },
        '#ff0000'
      );
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.setup();

      const styleFunction = L.geoJSON.mock.calls[0][1].style;
      const style = styleFunction();

      expect(style).toEqual({
        color: '#00ff00',
        weight: 5,
        opacity: 0.8,
        fillOpacity: 0.5
      });
    });
  });

  describe('update', () => {
    it('should remove old layer and render new one', () => {
      const geoJsonData = {
        type: 'Point',
        coordinates: [0, 0]
      };

      mockEntity.attributes = {
        zone_data: geoJsonData
      };

      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      // Setup initial layer
      geoJson.setup();
      const initialCallCount = L.geoJSON.mock.calls.length;

      // Update with new data
      mockEntity.attributes.zone_data = {
        type: 'Point',
        coordinates: [1, 1]
      };

      geoJson.update();

      expect(mockMap.removeLayer).toHaveBeenCalled();
      expect(L.geoJSON).toHaveBeenCalledTimes(initialCallCount + 1);
    });

    it('should not render when config is disabled', () => {
      const config = new GeoJsonConfig(false, '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.update();

      expect(L.geoJSON).not.toHaveBeenCalled();
    });
  });

  describe('_createTooltipContent', () => {
    it('should create tooltip from properties', () => {
      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      const properties = {
        name: 'Test Zone',
        type: 'residential',
        population: 1000
      };

      const tooltip = geoJson._createTooltipContent(properties);

      expect(tooltip).toContain('name: Test Zone');
      expect(tooltip).toContain('type: residential');
      expect(tooltip).toContain('population: 1000');
    });

    it('should filter out null and undefined values', () => {
      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      const properties = {
        name: 'Test Zone',
        empty: null,
        missing: undefined,
        valid: 'value'
      };

      const tooltip = geoJson._createTooltipContent(properties);

      expect(tooltip).toContain('name: Test Zone');
      expect(tooltip).toContain('valid: value');
      expect(tooltip).not.toContain('empty');
      expect(tooltip).not.toContain('missing');
    });

    it('should limit to first 5 properties', () => {
      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      const properties = {
        prop1: 'value1',
        prop2: 'value2',
        prop3: 'value3',
        prop4: 'value4',
        prop5: 'value5',
        prop6: 'value6',
        prop7: 'value7'
      };

      const tooltip = geoJson._createTooltipContent(properties);
      const lines = tooltip.split('<br>');

      expect(lines.length).toBe(5);
    });

    it('should return empty string for empty properties', () => {
      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      const tooltip = geoJson._createTooltipContent({});

      expect(tooltip).toBe('');
    });
  });

  describe('click handling', () => {
    it('should add click handler to GeoJSON layers', () => {
      const geoJsonData = {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
      };

      mockEntity.attributes = {
        zone_data: geoJsonData
      };

      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.setup();

      // Verify onEachFeature was called
      expect(L.geoJSON).toHaveBeenCalledWith(
        geoJsonData,
        expect.objectContaining({
          onEachFeature: expect.any(Function)
        })
      );
    });

    it('should dispatch hass-action event when layer is clicked', () => {
      const geoJsonData = {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
      };

      mockEntity.attributes = {
        zone_data: geoJsonData
      };

      // Create a spy for dispatchEvent
      const dispatchEventSpy = jest.fn();
      mockMap.getContainer.mockReturnValue({
        dispatchEvent: dispatchEventSpy
      });

      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.setup();

      // Get the onEachFeature callback
      const onEachFeature = L.geoJSON.mock.calls[0][1].onEachFeature;

      // Create a mock layer with an 'on' method
      const mockLayer = {
        on: jest.fn(),
        bindTooltip: jest.fn()
      };

      // Call onEachFeature with a feature that has properties
      const feature = {
        properties: { name: 'Test Zone' }
      };
      onEachFeature(feature, mockLayer);

      // Verify click handler was registered
      expect(mockLayer.on).toHaveBeenCalledWith('click', expect.any(Function));

      // Get the click handler
      const clickHandler = mockLayer.on.mock.calls[0][1];

      // Create a mock click event
      const mockClickEvent = {
        originalEvent: new MouseEvent('click')
      };

      // Call the click handler
      clickHandler(mockClickEvent);

      // Verify event was dispatched
      expect(mockMap.getContainer).toHaveBeenCalled();
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'hass-action',
          detail: expect.objectContaining({
            config: {
              entity: 'test-entity',
              tap_action: { action: 'more-info' }
            },
            action: 'tap'
          })
        })
      );
    });

    it('should stop event propagation when layer is clicked', () => {
      const geoJsonData = {
        type: 'Point',
        coordinates: [0, 0]
      };

      mockEntity.attributes = {
        zone_data: geoJsonData
      };

      const config = new GeoJsonConfig('zone_data', '#ff0000');
      const geoJson = new GeoJson(config, mockEntity);

      geoJson.setup();

      // Get the onEachFeature callback
      const onEachFeature = L.geoJSON.mock.calls[0][1].onEachFeature;

      // Create a mock layer
      const mockLayer = {
        on: jest.fn()
      };

      // Call onEachFeature
      onEachFeature({}, mockLayer);

      // Get the click handler
      const clickHandler = mockLayer.on.mock.calls[0][1];

      // Create a mock click event
      const mockClickEvent = {
        originalEvent: new MouseEvent('click')
      };

      // Call the click handler
      clickHandler(mockClickEvent);

      // Verify stopPropagation was called
      expect(L.DomEvent.stopPropagation).toHaveBeenCalledWith(mockClickEvent);
    });
  });
});