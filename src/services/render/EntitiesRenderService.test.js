import FocusFollowConfig from "../../configs/FocusFollowConfig";
import EntitiesRenderService from "./EntitiesRenderService";
import { LatLng, latLng } from "leaflet";
import Entity from "../../models/Entity";
import EntityConfig from "../../configs/EntityConfig";
import HaMapUtilities from "../../util/HaMapUtilities";
import Logger from "../../util/Logger";
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe("EntitiesRenderService", () => {
  describe("reconfigure", () => {
    let service, hass, clusterGroup;

    const config = (id, color = 'red') => new EntityConfig({ entity: id, color }, {});
    const existingEntity = (id) => ({ id, hass: {}, cleanup: jest.fn() });

    beforeEach(() => {
      hass = { states: {} };
      clusterGroup = {};
      service = new EntitiesRenderService({}, {}, new FocusFollowConfig('none'), [], {}, {}, {}, false);
      service.markerClusterGroup = clusterGroup;
      jest.spyOn(Entity.prototype, 'setup').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('keeps unchanged entities and gives them the current hass snapshot', () => {
      const kept = existingEntity('geo_location.kept');
      service.entities = [kept];
      const nextConfigs = [config(kept.id)];

      service.reconfigure(nextConfigs, hass);

      expect(service.entities).toEqual([kept]);
      expect(service.entities[0]).toBe(kept);
      expect(kept.hass).toBe(hass);
      expect(kept.cleanup).not.toHaveBeenCalled();
      expect(Entity.prototype.setup).not.toHaveBeenCalled();
      expect(service.hass).toBe(hass);
      expect(service.entityConfigs).toBe(nextConfigs);
    });

    it('cleans up and recreates an entity whose style changed', () => {
      const changed = existingEntity('geo_location.restyled');
      service.entities = [changed];
      const nextConfig = config(changed.id, 'yellow');

      service.reconfigure([nextConfig], hass, new Set([changed.id]));

      expect(changed.cleanup).toHaveBeenCalledTimes(1);
      expect(changed.cleanup).toHaveBeenCalledWith(clusterGroup);
      expect(service.entities).toHaveLength(1);
      expect(service.entities[0]).toBeInstanceOf(Entity);
      expect(service.entities[0]).not.toBe(changed);
      expect(service.entities[0].config).toBe(nextConfig);
      expect(service.entities[0].hass).toBe(hass);
      expect(Entity.prototype.setup).toHaveBeenCalledWith(clusterGroup);
      expect(changed.cleanup.mock.invocationCallOrder[0]).toBeLessThan(
        Entity.prototype.setup.mock.invocationCallOrder[0]
      );
    });

    it('cleans up removed entities while leaving kept entities alive', () => {
      const kept = existingEntity('geo_location.kept');
      const removed = existingEntity('geo_location.removed');
      service.entities = [kept, removed];

      service.reconfigure([config(kept.id)], hass, new Set([removed.id]));

      expect(removed.cleanup).toHaveBeenCalledTimes(1);
      expect(removed.cleanup).toHaveBeenCalledWith(clusterGroup);
      expect(kept.cleanup).not.toHaveBeenCalled();
      expect(service.entities).toEqual([kept]);
    });

    it('creates added entities with current hass and preserves the new entity order', () => {
      const kept = existingEntity('geo_location.kept');
      service.entities = [kept];
      const addedConfig = config('geo_location.added');

      service.reconfigure([addedConfig, config(kept.id)], hass, new Set([addedConfig.id]));

      expect(service.entities.map(entity => entity.id)).toEqual([addedConfig.id, kept.id]);
      expect(service.entities[0]).toBeInstanceOf(Entity);
      expect(service.entities[0].config).toBe(addedConfig);
      expect(service.entities[0].hass).toBe(hass);
      expect(service.entities[1]).toBe(kept);
      expect(Entity.prototype.setup).toHaveBeenCalledTimes(1);
      expect(Entity.prototype.setup).toHaveBeenCalledWith(clusterGroup);
    });

    it('cleans up all entities when the new list is empty', () => {
      const first = existingEntity('geo_location.first');
      const second = existingEntity('geo_location.second');
      service.entities = [first, second];

      service.reconfigure([], hass);

      expect(first.cleanup).toHaveBeenCalledWith(clusterGroup);
      expect(second.cleanup).toHaveBeenCalledWith(clusterGroup);
      expect(service.entities).toEqual([]);
      expect(service.entityConfigs).toEqual([]);
    });

    it('skips a failed replacement without discarding healthy entities', () => {
      const changed = existingEntity('geo_location.restyled');
      const kept = existingEntity('geo_location.kept');
      service.entities = [changed, kept];
      Entity.prototype.setup.mockImplementationOnce(() => { throw new Error('Missing entity'); });
      jest.spyOn(Logger, 'error').mockImplementation(() => {});
      const warning = jest.spyOn(HaMapUtilities, 'renderWarningOnMap').mockImplementation(() => {});

      service.reconfigure([config(changed.id), config(kept.id)], hass, new Set([changed.id]));

      expect(changed.cleanup).toHaveBeenCalledWith(clusterGroup);
      expect(service.entities).toEqual([kept]);
      expect(kept.hass).toBe(hass);
      expect(warning).toHaveBeenCalledWith(service.map, expect.stringContaining(changed.id));
    });
  });

  describe("render", () => {
    it("should have a method", () => {
      expect(new EntitiesRenderService().render).toBeDefined();
    });

    it('refreshes hass on every entity before updating it', async () => {
      const oldHass = { states: {} };
      const newHass = { states: { 'geo_location.strike': { state: 'new' } } };
      const service = new EntitiesRenderService({}, oldHass, new FocusFollowConfig('none'));
      service.markerClusterGroup = {};
      const entities = [0, 1].map(() => ({
        hass: oldHass,
        update: jest.fn(function () { expect(this.hass).toBe(newHass); }),
      }));
      service.entities = entities;

      await service.render(newHass);

      expect(service.hass).toBe(newHass);
      entities.forEach(entity => {
        expect(entity.hass).toBe(newHass);
        expect(entity.update).toHaveBeenCalledWith(service.markerClusterGroup);
      });
    });

    it('uses stored hass when render is called without an argument', async () => {
      const hass = { states: {} };
      const service = new EntitiesRenderService({}, hass, new FocusFollowConfig('none'));
      const entity = { hass: {}, update: jest.fn() };
      service.entities = [entity];

      await service.render();

      expect(entity.hass).toBe(hass);
      expect(service.hass).toBe(hass);
      expect(entity.update).toHaveBeenCalled();
    });

    it('moves a live marker with no history messages or configuration changes', async () => {
      const id = 'geo_location.strike';
      const oldHass = {
        states: { [id]: { attributes: { latitude: 1, longitude: 2 } } },
      };
      const newHass = {
        states: { [id]: { attributes: { latitude: 3, longitude: 4 } } },
      };
      const map = { distance: jest.fn().mockReturnValue(1000) };
      const service = new EntitiesRenderService(map, oldHass, new FocusFollowConfig('none'));
      const entity = new Entity(new EntityConfig({ entity: id }, {}), oldHass, map, {}, {}, {}, false);
      entity.marker = { setLatLng: jest.fn() };
      entity._lastSetLatLng = new LatLng(1, 2);
      service.entities = [entity];
      expect(entity.config.hasHistory).toBe(false);
      expect(entity.currentTimelineEntry).toBeUndefined();

      await service.render(newHass);

      expect(entity.marker.setLatLng).toHaveBeenCalledWith(new LatLng(3, 4));
      expect(entity._lastSetLatLng).toEqual(new LatLng(3, 4));
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
