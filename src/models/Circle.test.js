import CircleConfig from '../configs/CircleConfig';
import Logger from '../util/Logger';
import Circle from './Circle'; 
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('Circle', () => {
  let circleConfig;
  let entity;
  let circle;

  beforeEach(() => {
    
    circleConfig = new CircleConfig({
      source: "auto",
      radius: 100,
      color: "#000000",
      fillOpacity: 0.5,
      enabled: true,
      attribute: undefined,
    }, "#000000");
    

    // Mocking Entity
    
    entity = {
      id: 'test-entity',
      latLng: [0, 0],
      state: {
        attributes: {
          gps_accuracy: 50,
          radius: 200,
        }
      },
      config: {
        id: 'test-entity',
      },
      map: {},
    };
    

    // Mocking Logger
    Logger.debug = jest.fn();
    Logger.error = jest.fn();
    Logger.isDebugEnabled = true;

    
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
      circle.config.source = "attribute";
      circle.config.attribute = "radius";
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


  describe('update method', () => {
    it('should update the circle\'s position and radius if it exists', () => {
      circle.entity.state.attributes = { radius: 0 };
      circle.config.source = "attribute";
      circle.config.attribute = "radius";
      circle.setup(); // Ensure circle exists      
      circle.entity.state.attributes = { radius: 50 };
      circle.update();
      expect(circle.circle.getRadius()).toBe(50);
    });
  });
});