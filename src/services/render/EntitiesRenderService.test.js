import FocusFollowConfig from "../../configs/FocusFollowConfig";
import EntitiesRenderService from "./EntitiesRenderService";
import { LatLng, latLng } from "leaflet";

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
        once: jest.fn(),
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

  describe("updateInitialView", () => {
    it("in case of no entities with focusOnFit", () => {
      const map = {
        setView: jest.fn(),
        fitBounds: jest.fn(),
        getBounds: jest.fn().mockReturnValue({contains: jest.fn().mockReturnValue(true)}),
      };
      const hass = {};
      const entitiesRenderService = new EntitiesRenderService(map, [], hass, {}, {}, {}, true);

      // Test data
      const testData = [
        [1.1, 2.1],
        [ 2.1, 3.1],
        [ 1.7, -4.9]
      ];

      entitiesRenderService.entities = testDataToMarker(testData, false);
      entitiesRenderService.updateInitialView();
      expect(map.fitBounds).not.toBeCalled();
      
  });

  it("in case of FocusFollow.isNone", () => {
    const map = {
      setView: jest.fn(),
      fitBounds: jest.fn(),
      getBounds: jest.fn().mockReturnValue({contains: jest.fn().mockReturnValue(true)}),
    };
    const focusFollow = new FocusFollowConfig("contains");
    const hass = {};
    const entitiesRenderService = new EntitiesRenderService(map, hass, focusFollow, {}, {}, {}, true);

    // Test data
    const testData = [
      [1.1, 2.1],
      [ 2.1, 3.1],
      [ 1.7, -4.9]
    ];

    entitiesRenderService.entities = testDataToMarker(testData);
    entitiesRenderService.updateInitialView();
    expect(map.fitBounds).not.toBeCalled();
  });

  it("in case of FocusFollow.isContains", () => {
    const map = {
      setView: jest.fn(),
      fitBounds: jest.fn(),
      getBounds: jest.fn().mockReturnValue({contains: jest.fn().mockReturnValue(true)}),
    };
    const focusFollow = new FocusFollowConfig("contains");
    const hass = {};
    const entitiesRenderService = new EntitiesRenderService(map, hass, focusFollow, {}, {}, {}, true);

    // Test data
    const testData = [
      [1.1, 2.1],
      [ 2.1, 3.1],
      [ 1.7, -4.9]
    ];

    entitiesRenderService.entities = testDataToMarker(testData);
    entitiesRenderService.updateInitialView();
    expect(map.fitBounds).not.toBeCalled();
  });

  it("in case of FocusFollow.isContains and bounds not contains", () => {
    const map = {
      setView: jest.fn(),
      fitBounds: jest.fn(),
      getBounds: jest.fn().mockReturnValue({contains: jest.fn().mockReturnValue(false)}),
      once: jest.fn(),
    };
    const focusFollow = new FocusFollowConfig("contains");
    const hass = {};
    const entitiesRenderService = new EntitiesRenderService(map, hass, focusFollow, {}, {}, {}, true);

    // Test data
    const testData = [
      [1.1, 2.1],
      [ 2.1, 3.1],
      [ 1.7, -4.9]
    ];

    entitiesRenderService.entities = testDataToMarker(testData);
    entitiesRenderService.updateInitialView();
    expect(map.fitBounds).toBeCalled();
  });

  it("in case of FocusFollow.isRefocus", () => {
    const map = {
      setView: jest.fn(),
      fitBounds: jest.fn(),
      getBounds: jest.fn().mockReturnValue({contains: jest.fn().mockReturnValue(true)}),
      once: jest.fn(),
    };
    const focusFollow = new FocusFollowConfig("refocus");
    const hass = {};
    const entitiesRenderService = new EntitiesRenderService(map, hass, focusFollow, {}, {}, {}, true);

    // Test data
    const testData = [
      [1.1, 2.1],
      [ 2.1, 3.1],
      [ 1.7, -4.9]
    ];

    entitiesRenderService.entities = testDataToMarker(testData);
    entitiesRenderService.updateInitialView();
    expect(map.fitBounds).toBeCalled();
  });

  describe("follow pause", () => {
    function createMapWithListeners() {
      const handlers = {};
      const onceHandlers = {};
      const map = {
        setView: jest.fn(),
        fitBounds: jest.fn(),
        getBounds: jest.fn().mockReturnValue({ contains: jest.fn().mockReturnValue(true) }),
        on: jest.fn((event, handler) => { handlers[event] = handler; }),
        once: jest.fn((event, handler) => { onceHandlers[event] = handler; }),
        off: jest.fn(),
      };
      return { map, handlers, onceHandlers };
    }

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("registers pause/resume listeners when focus_follow is set and pause is configured", () => {
      const { map } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);

      entitiesRenderService.setup();

      expect(map.on).toBeCalledWith('mousedown', expect.any(Function));
      expect(map.on).toBeCalledWith('dragstart', expect.any(Function));
      expect(map.on).toBeCalledWith('zoomstart', expect.any(Function));
      expect(map.on).toBeCalledWith('mouseup', expect.any(Function));
      expect(map.on).toBeCalledWith('dragend', expect.any(Function));
      expect(map.on).toBeCalledWith('zoomend', expect.any(Function));
    });

    it("does not register listeners when focus_follow is none", () => {
      const { map } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("none", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);

      entitiesRenderService.setup();

      expect(map.on).not.toBeCalled();
    });

    it("does not register listeners when no pause is configured", () => {
      const { map } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus");
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);

      entitiesRenderService.setup();

      expect(map.on).not.toBeCalled();
    });

    it("skips fitBounds while follow is paused", () => {
      const { map } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);

      const testData = [
        [1.1, 2.1],
        [2.1, 3.1],
      ];
      entitiesRenderService.entities = testDataToMarker(testData);
      entitiesRenderService.isFollowPaused = true;

      entitiesRenderService.updateInitialView();

      expect(map.fitBounds).not.toBeCalled();
    });

    it("re-fits the view immediately once the pause timeout elapses, without waiting for an entity update", () => {
      const { map, handlers } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);
      entitiesRenderService.setup();
      entitiesRenderService.entities = testDataToMarker([
        [1.1, 2.1],
        [2.1, 3.1],
      ]);

      handlers.dragstart();
      handlers.dragend();
      expect(map.fitBounds).not.toBeCalled();

      jest.advanceTimersByTime(5000);

      expect(entitiesRenderService.isFollowPaused).toBe(false);
      expect(map.fitBounds).toBeCalled();
    });

    it("pauses on drag start and resumes after the configured timeout on drag end", () => {
      const { map, handlers } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);
      entitiesRenderService.setup();

      handlers.dragstart();
      expect(entitiesRenderService.isFollowPaused).toBe(true);

      handlers.dragend();
      expect(entitiesRenderService.isFollowPaused).toBe(true);

      jest.advanceTimersByTime(5000);
      expect(entitiesRenderService.isFollowPaused).toBe(false);
    });

    it("extends the pause if interaction happens again before the timeout elapses", () => {
      const { map, handlers } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);
      entitiesRenderService.setup();

      handlers.dragstart();
      handlers.dragend();

      jest.advanceTimersByTime(4000);
      handlers.mousedown();
      handlers.mouseup();

      jest.advanceTimersByTime(4000);
      expect(entitiesRenderService.isFollowPaused).toBe(true);

      jest.advanceTimersByTime(1000);
      expect(entitiesRenderService.isFollowPaused).toBe(false);
    });

    it("ignores interaction events fired by its own auto-fit", () => {
      const { map, handlers } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);
      entitiesRenderService.setup();

      entitiesRenderService._isAutoFitting = true;
      handlers.zoomstart();

      expect(entitiesRenderService.isFollowPaused).toBe(false);
    });

    it("clears the pending resume timer on cleanup", () => {
      const { map, handlers } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);
      entitiesRenderService.setup();

      handlers.dragstart();
      handlers.dragend();
      entitiesRenderService.cleanup();

      jest.advanceTimersByTime(5000);
      expect(entitiesRenderService.isFollowPaused).toBe(true);
    });

    it("removes the pause/resume listeners on cleanup", () => {
      const { map } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);
      entitiesRenderService.setup();

      entitiesRenderService.cleanup();

      expect(map.off).toBeCalledWith('mousedown', expect.any(Function));
      expect(map.off).toBeCalledWith('dragstart', expect.any(Function));
      expect(map.off).toBeCalledWith('zoomstart', expect.any(Function));
      expect(map.off).toBeCalledWith('mouseup', expect.any(Function));
      expect(map.off).toBeCalledWith('dragend', expect.any(Function));
      expect(map.off).toBeCalledWith('zoomend', expect.any(Function));
    });

    it("does not treat its own animated auto-fit as a user interaction until the animation settles", () => {
      const { map, handlers, onceHandlers } = createMapWithListeners();
      const focusFollow = new FocusFollowConfig("refocus", 5);
      const entitiesRenderService = new EntitiesRenderService(map, {}, focusFollow, [], {}, {}, {}, true, false);
      entitiesRenderService.setup();
      entitiesRenderService.entities = testDataToMarker([
        [1.1, 2.1],
        [2.1, 3.1],
      ]);

      // Programmatic refocus: fitBounds animates, so zoomend fires asynchronously
      // well after this call returns, while _isAutoFitting is still true.
      entitiesRenderService.updateInitialView();
      expect(map.fitBounds).toBeCalledTimes(1);
      expect(entitiesRenderService._isAutoFitting).toBe(true);

      // zoomstart/zoomend caused by our own animation must be ignored.
      handlers.zoomstart();
      handlers.zoomend();
      expect(entitiesRenderService.isFollowPaused).toBe(false);
      expect(entitiesRenderService._followPauseTimer).toBeNull();

      // Only once the animation actually completes (moveend) do we stop guarding.
      onceHandlers.moveend();
      expect(entitiesRenderService._isAutoFitting).toBe(false);

      // A genuine user-triggered zoom afterwards is tracked normally and does
      // not cause a self-triggered refocus loop.
      handlers.zoomend();
      expect(entitiesRenderService._followPauseTimer).not.toBeNull();
    });
  });
});

function testDataToMarker(testData, focusOnFit = true) {
  return testData.map((data) => {
    return {     
      latLng: new LatLng(data[0], data[1]),
      config: {
        focusOnFit: focusOnFit,
      },
    };
  });
}});