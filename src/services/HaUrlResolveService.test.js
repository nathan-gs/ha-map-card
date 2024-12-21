import HaUrlResolveService from "./HaUrlResolveService";
import {describe, expect, it} from "@jest/globals";

describe("HaUrlResolveService", () => {
 
  describe("resolveUrl", () => {
    it("should resolve URLs with states", () => {
      const hass = {
        states: {
          "sensor.mySensor": { state: "on" },
        },
      };
      const haUrlResolveService = new HaUrlResolveService(hass);
      const url = "http://localhost:8123/{{ states('sensor.mySensor') }}/test";
      expect(haUrlResolveService.resolveUrl(url)).toBe("http://localhost:8123/on/test");
    });

    it("should resolve URLs without states", () => {
      const hass = {
        states: {
          "sensor.mySensor": { state: "off" },
        },
      };
      const haUrlResolveService = new HaUrlResolveService(hass);
      const url = "http://localhost:8123/bla/test";
      expect(haUrlResolveService.resolveUrl(url)).toBe("http://localhost:8123/bla/test");
    });

    it("should resolve URLs with multiple states", () => {
      const hass = {
        states: {
          "sensor.mySensor": { state: "on" },
          "sensor.myOtherSensor": { state: "wordmap" },
        },
      };
      const haUrlResolveService = new HaUrlResolveService(hass);
      const url = "http://localhost:8123/{{ states('sensor.mySensor') }}/test/{{ states('sensor.myOtherSensor') }}";
      expect(haUrlResolveService.resolveUrl(url)).toBe("http://localhost:8123/on/test/wordmap");
    });
    
    it("should resolve URLs with missing states", () => {
      const hass = {
        states: {
          "sensor.mySensor": { state: "on" },
        },
      };
      const haUrlResolveService = new HaUrlResolveService(hass);
      const url = "http://localhost:8123/{{ states('sensor.mySensor') }}/test/{{ states('sensor.myOtherSensor') }}/bla";
      expect(haUrlResolveService.resolveUrl(url)).toBe("http://localhost:8123/on/test//bla");
    });
  });

  describe("resolveEntities", () => {
    it("should resolve URLs with states", () => {
      const haUrlResolveService = new HaUrlResolveService({});
      const url = "http://localhost:8123/{{ states('sensor.mySensor') }}/test";
      expect(haUrlResolveService.resolveEntities(url)).toEqual(["sensor.mySensor"]);
    });

    it("should resolve URLs with multiple states", () => {
      
      const haUrlResolveService = new HaUrlResolveService({});
      const url = "http://localhost:8123/{{ states('sensor.mySensor') }}/test/{{ states('sensor.myOtherSensor') }}";
      expect(haUrlResolveService.resolveEntities(url)).toEqual(["sensor.mySensor", "sensor.myOtherSensor"]);
    });
  });

  describe("onUpdate of state", () => {
    it("should call the setUrl method", () => {

      const linkedEntityService = {
        onStateChange: jest.fn(),
      };
      const haUrlResolveService = new HaUrlResolveService({}, linkedEntityService);
      const layer = { setUrl: jest.fn() };

      haUrlResolveService.registerLayer(layer, "http://localhost:8123/{{ states('sensor.mySensor') }}/test");

      expect(haUrlResolveService.entityLayers["sensor.mySensor"].layers.size).toBe(1);
      
      expect(linkedEntityService.onStateChange).toHaveBeenCalled();

      
    });

    it("only keep layers with extractable entities", () => {
      const hass = {};
      const linkedEntityService = {
        onStateChange: jest.fn(),
      };
      const haUrlResolveService = new HaUrlResolveService(hass, linkedEntityService);
      const layer = {};
      haUrlResolveService.registerLayer(layer, "http://localhost:8123/bla/test");
      expect(haUrlResolveService.entityLayers).toEqual({});
      haUrlResolveService.deregisterLayer(layer);
      expect(haUrlResolveService.entityLayers).toEqual({});


    });

    it("should add layers to the entityLayers", () => {
      const linkedEntityService = {
        onStateChange: jest.fn(),
      };
      const haUrlResolveService = new HaUrlResolveService({}, linkedEntityService);
      const layer1 = {};

      haUrlResolveService.registerLayer(layer1, "http://localhost:8123/{{ states('sensor.mySensor') }}/test");
      expect(haUrlResolveService.entityLayers["sensor.mySensor"].layers.size).toBe(1);
      expect(Object.keys(haUrlResolveService.entityLayers).length).toBe(1);

      const layer2 = {};
      haUrlResolveService.registerLayer(layer2, "http://localhost:8123/{{ states('sensor.mySensor') }}/test");
      expect(haUrlResolveService.entityLayers["sensor.mySensor"].layers.size).toBe(2);
      expect(Object.keys(haUrlResolveService.entityLayers).length).toBe(1);

      const layer3 = {};
      haUrlResolveService.registerLayer(layer3, "http://localhost:8123/{{ states('sensor.myOtherSensor') }}/test");
      expect(haUrlResolveService.entityLayers["sensor.myOtherSensor"].layers.size).toBe(1);
      expect(Object.keys(haUrlResolveService.entityLayers).length).toBe(2);
    });
  });
});