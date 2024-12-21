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