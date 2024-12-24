import InitialViewRenderService from "./InitialViewRenderService";

describe("InitialViewRenderService", () => {
  describe("render", () => {
    it("should have a method", () => {
      expect(new InitialViewRenderService().render).toBeDefined();
    });
  });

  describe("setup", () => {
    it("should have a method", () => {
      expect(new InitialViewRenderService().setup).toBeDefined();
    });
  });
});