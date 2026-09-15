import { jest, describe, it, expect } from '@jest/globals';
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

    it("should apply the view immediately when the container is already sized", () => {
      const MockResizeObserver = jest.fn();
      globalThis.ResizeObserver = MockResizeObserver;

      const map = {
        getContainer: () => ({ clientWidth: 100, clientHeight: 100 }),
        setView: jest.fn()
      };
      const config = { x: 51, y: 3, zoom: 12 };
      const service = new InitialViewRenderService(map, config, {}, {});

      service.setup();

      expect(map.setView).toHaveBeenCalledWith([51, 3], 12);
      expect(MockResizeObserver).not.toHaveBeenCalled();
    });

    it("should defer the view when the container has no dimensions yet", () => {
      const container = { clientWidth: 0, clientHeight: 0 };
      let observerCallback;
      globalThis.ResizeObserver = jest.fn((cb) => {
        observerCallback = cb;
        return { observe: jest.fn(), disconnect: jest.fn() };
      });

      const map = {
        getContainer: () => container,
        setView: jest.fn(),
        invalidateSize: jest.fn()
      };
      const config = { x: 51, y: 3, zoom: 12 };
      const service = new InitialViewRenderService(map, config, {}, {});

      service.setup();
      expect(map.setView).not.toHaveBeenCalled();

      container.clientWidth = 100;
      container.clientHeight = 100;
      container.isConnected = true;
      observerCallback();

      expect(map.invalidateSize).toHaveBeenCalled();
      expect(map.setView).toHaveBeenCalledWith([51, 3], 12);
    });
  });
});