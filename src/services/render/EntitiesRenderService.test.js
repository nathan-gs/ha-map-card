import EntitiesRenderService from "./EntitiesRenderService";
import { LatLng } from "leaflet";

describe("EntitiesRenderService", () => {
  describe("render", () => {
    it("should have a method", () => {
      expect(new EntitiesRenderService().render).toBeDefined();
    });
  });

  describe("setup", () => {
    it("should have a method", () => {
      expect(new EntitiesRenderService().setup).toBeDefined();
    });
  });

  describe("setInitialView", () => {
    it("With 2 Latlngs", () => {
      const map = {
        setView: jest.fn(),
        fitBounds: jest.fn(),
      };
      const hass = {};
      const entitiesRenderService = new EntitiesRenderService(map, [], hass, {}, {}, {}, true);
      
      // Test data
      const testData = [
        [1.1, 2.1],
        [ 2.1, 3.1],
        [ 1.7, -4.9]
      ];
      entitiesRenderService.entities = testDataToMarker(testData);

      entitiesRenderService.setInitialView();
      expect(map.fitBounds).toBeCalledWith({"_northEast": {"lat": 2.2, "lng": 3.9000000000000004}, "_southWest": {"lat": 1, "lng": -5.7}});
    });
  });
});

function testDataToMarker(testData) {
  return testData.map((data) => {
    return {     
      marker: {
        getLatLng: () => { return new LatLng(data[0], data[1]) },
      },
      config: {
        focusOnFit: true,
      },
    };
  });
}