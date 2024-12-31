import TileLayersRenderService from "./TileLayersRenderService";

describe("TileLayersRenderService", () => {
  describe("render", () => {
    it("should have a method", () => {
      expect(new TileLayersRenderService().render).toBeDefined();
    });
  });

  describe("setup", () => {
    it("should have a method", () => {
      expect(new TileLayersRenderService().setup).toBeDefined();
    });
  });
});