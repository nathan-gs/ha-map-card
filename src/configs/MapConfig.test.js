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

// auto-entities sends one entry per matching include rule, so an entity
// matching three rules arrived three times and drew three markers at one point.
describe("MapConfig.firstPerEntity", () => {
  it("keeps the first entry per entity and drops the rest", () => {
    const out = MapConfig.firstPerEntity([
      { entity: "device_tracker.t", color: "#299FD5", size: 30 },
      { entity: "device_tracker.s" },
      { entity: "device_tracker.t", size: 30 },
      { entity: "device_tracker.t", color: "red" },
    ]);
    expect(out).toEqual([
      { entity: "device_tracker.t", color: "#299FD5", size: 30 },
      { entity: "device_tracker.s" },
    ]);
  });

  it("treats a bare string and an object for the same entity as one", () => {
    expect(MapConfig.firstPerEntity(["device_tracker.t", { entity: "device_tracker.t", color: "red" }]))
      .toEqual(["device_tracker.t"]);
    expect(MapConfig.firstPerEntity([new String("device_tracker.t"), "device_tracker.t"])).toHaveLength(1);
  });

  it("keeps order and leaves a list without duplicates alone", () => {
    const list = [{ entity: "b" }, { entity: "a" }, "c"];
    expect(MapConfig.firstPerEntity(list)).toEqual(list);
    expect(MapConfig.firstPerEntity([])).toEqual([]);
  });

  it("passes entries with no entity id through, however many", () => {
    const odd = [{ color: "red" }, { color: "red" }, { entity: "" }, { entity: "" }, null];
    expect(MapConfig.firstPerEntity(odd)).toEqual(odd);
  });

  it("is what the constructor uses", () => {
    const cfg = new MapConfig({
      x: 0.1, y: 0.1,
      entities: [{ entity: "device_tracker.t", color: "#299FD5" }, { entity: "device_tracker.t" }, "device_tracker.s"],
    });
    expect(cfg.entities.map((e) => e.id)).toEqual(["device_tracker.t", "device_tracker.s"]);
    expect(cfg.entities[0].color).toBe("#299FD5");
  });

  it("does not change the input array", () => {
    const list = [{ entity: "a" }, { entity: "a" }];
    MapConfig.firstPerEntity(list);
    expect(list).toHaveLength(2);
  });
});
