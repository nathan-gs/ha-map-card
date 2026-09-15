import MapConfig from "./MapConfig.js";
import L from "leaflet";
import { describe, expect, it } from "@jest/globals";

describe("MapConfig", () => {
  describe("constructor", () => {
    it("mapOptions", () => {
      const mapConfig = new MapConfig({
        x: 0.1,
        y: 0.1,
        map_options: { dragging: true },
      });

      expect(mapConfig.mapOptions.dragging).toBe(true);
    });

    it("allows disabling the default tile layer", () => {
      const mapConfig = new MapConfig({
        x: 0.1,
        y: 0.1,
        tile_layer_url: "",
      });

      expect(mapConfig.tileLayer).toBeNull();
    });

    it("normalizes simple CRS", () => {
      const mapConfig = new MapConfig({
        x: 0.1,
        y: 0.1,
        map_options: { crs: "simple", minZoom: -4 },
      });

      expect(mapConfig.mapOptions.crs).toBe(L.CRS.Simple);
      expect(mapConfig.mapOptions.minZoom).toBe(-4);
    });

    it("complains when neither a [X, Y], an entity or a focus entity is given", () => {
      expect(() =>  new MapConfig({})).toThrowError("We need a map latitude & longitude; set at least [x, y], a focus_entity or have at least 1 entities defined.");
    });

  });
});
