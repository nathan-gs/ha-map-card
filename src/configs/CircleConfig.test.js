import CircleConfig from './CircleConfig';
import { describe, expect, it, afterEach, beforeEach, jest } from "@jest/globals";

describe('CircleConfig', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with string config', () => {
      const config = "auto";
      const defaultColor = "#000000";
      const circle = new CircleConfig(config, defaultColor);

      expect(circle.enabled).toBe(true);
      expect(circle.source).toBe("auto");
      expect(circle.color).toBe(defaultColor);
      expect(circle.attribute).toBeUndefined();
    });

    it('should initialize with string config, not auto', () => {
      const config = "unused";
      const defaultColor = "#FFFFFF";
      const circle = new CircleConfig(config, defaultColor);

      expect(circle.enabled).toBe(false);      
    });

    it('should initialize with object config, source as attribute', () => {
      const config = {
        radius: 50,
        source: "unused",
        attribute: "some-attribute"
      };
      const defaultColor = "#FF0000";
      const circle = new CircleConfig(config, defaultColor);

      expect(circle.enabled).toBe(true);
      expect(circle.radius).toBe(50);
      expect(circle.source).toBe("attribute");
      expect(circle.color).toBe(defaultColor);
      expect(circle.attribute).toBe("some-attribute");
    });

    it('should initialize with object config, source as config', () => {
      const config = {
        radius: 50
      };
      const defaultColor = "#FFFFFF";
      const circle = new CircleConfig(config, defaultColor);

      expect(circle.enabled).toBe(true);
      expect(circle.radius).toBe(50);
      expect(circle.source).toBe("config");
      expect(circle.color).toBe(defaultColor);
      expect(circle.attribute).toBeUndefined();
    });

    it('should use default values for missing object properties', () => {
      const config = {};
      const defaultColor = "#FFFFFF";
      const circle = new CircleConfig(config, defaultColor);

      expect(circle.enabled).toBe(true);
      expect(circle.radius).toBe(0);
      expect(circle.source).toBe("auto");  // No valid source from empty object
      expect(circle.color).toBe(defaultColor);
      expect(circle.attribute).toBeUndefined();
    });

    it('should set source based on provided source if no attribute', () => {
      const config = {
        source: "gps_accuracy"
      };
      const defaultColor = "#000000";
      const circle = new CircleConfig(config, defaultColor);

      expect(circle.enabled).toBe(true);
      expect(circle.radius).toBe(0);
      expect(circle.source).toBe("attribute");
      expect(circle.color).toBe(defaultColor);
      expect(circle.attribute).toBe("gps_accuracy");
    });
  });

  describe('_setSource method', () => {
    let circle;

    beforeEach(() => {
      circle = new CircleConfig({}, "#000000");
    });

    it('should set source to attribute if attribute is provided', () => {
      circle._setSource("any-source", "some-attribute");
      expect(circle.source).toBe("attribute");
      expect(circle.attribute).toBe("some-attribute");
    });

    it('should set source to config if radius is set and no attribute', () => {
      circle.radius = 100;
      circle._setSource("any-source");
      expect(circle.source).toBe("config");
      expect(circle.attribute).toBeUndefined();
    });

    it('should set source based on provided valid source', () => {
      circle._setSource("gps_accuracy");
      expect(circle.source).toBe("attribute");
      expect(circle.attribute).toBe("gps_accuracy");
    });

  });
});