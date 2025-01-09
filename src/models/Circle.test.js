import { Circle as LeafletCircle } from 'leaflet';
import CircleConfig from '../configs/CircleConfig';
import Entity from './Entity';
import Logger from '../util/Logger';
import Circle from './Circle'; 

jest.mock('leaflet', () => ({
  Circle: jest.fn(() => ({
    addTo: jest.fn(),
    setLatLng: jest.fn(),
    setRadius: jest.fn(),
  })),
}));

jest.mock('../configs/CircleConfig', () => {
  return jest.fn().mockImplementation(() => ({
    source: "auto",
    radius: 100,
    color: "#000000",
    fillOpacity: 0.5,
    enabled: true,
    attribute: undefined,
  }));
});

jest.mock('./Entity', () => {
  return jest.fn().mockImplementation(() => ({
    id: 'test-entity',
    latLng: [0, 0],
    state: {
      attributes: {
        gps_accuracy: 50,
        radius: 200,
      }
    },
    map: {},
  }));
});

jest.mock('../util/Logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  isDebugEnabled: true,
}));

describe('Circle', () => {
  let circleConfig;
  let entity;
  let circle;

  beforeEach(() => {
    circleConfig = new CircleConfig({}, "#000000");
    entity = new Entity();
    circle = new Circle(circleConfig, entity);
  });

  describe('radius getter', () => {
    it('should return radius from config when source is config', () => {
      circle.config.source = "config";
      expect(circle.radius).toBe(100);
    });

    it('should return attribute value when source is attribute', () => {
      circle.config.source = "attribute";
      circle.config.attribute = "gps_accuracy";
      expect(circle.radius).toBe(50);
    });

    it('should return gps_accuracy when source is auto and gps_accuracy exists', () => {
      circle.config.source = "auto";
      expect(circle.radius).toBe(50);
    });

    it('should return radius from attributes when source is auto and no gps_accuracy', () => {
      entity.state.attributes = { radius: 200 };
      expect(circle.radius).toBe(200);
    });

    it('should return config radius if no other source applies', () => {
      entity.state.attributes = {};
      expect(circle.radius).toBe(100);
    });

    it('should return 0 if nothing else applies', () => {
      entity.state.attributes = {};
      circle.config.radius = 0;
      expect(circle.radius).toBe(0);
    });
  });

  describe('radiusLog method', () => {
    it('should log appropriate debug messages based on the radius source', () => {
      circle.radiusLog();
      expect(Logger.debug).toHaveBeenCalledWith(`[Circle]: for test-entity, using auto, with gps_accuracy, resulting in: 50`);
      expect(Logger.debug).toHaveBeenCalledWith(`[Circle]: No radius, falling back to 0`);
    });
  });

  describe('setup method', () => {
    it('should create and add a circle to the map if enabled', () => {
      circle.setup();
      expect(LeafletCircle).toHaveBeenCalledWith([0, 0], {
        radius: 50,
        color: "#000000",
        fillOpacity: 0.5
      });
      expect(circle.circle.addTo).toHaveBeenCalledWith(entity.map);
    });

  });

  describe('update method', () => {
    it('should update the circle\'s position and radius if it exists', () => {
      circle.setup(); // Ensure circle exists
      circle.update();
      expect(circle.circle.setLatLng).toHaveBeenCalledWith([0, 0]);
      expect(circle.circle.setRadius).toHaveBeenCalledWith(50);
    });
  });
});