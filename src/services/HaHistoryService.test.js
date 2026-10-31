import HaHistoryService from "./HaHistoryService.js";
import {describe, expect, it, jest} from "@jest/globals";

describe("HaHistoryService", () => {

  describe("subscribe", () => {
    const makeHass = () => ({
      states: {
        "person.a": { attributes: { device_trackers: ["device_tracker.a"] } },
      },
      connection: {
        subscribeMessage: jest.fn(() => Promise.resolve(() => {})),
      },
    });

    it("should request the device trackers and the entity itself", () => {
      const hass = makeHass();
      new HaHistoryService(hass).subscribe("person.a", new Date(), undefined, () => {}, false);

      expect(hass.connection.subscribeMessage.mock.calls[0][1].entity_ids).toEqual(["device_tracker.a", "person.a"]);
    });

    it("should not mutate the device_trackers attribute of the hass state", () => {
      const hass = makeHass();
      const service = new HaHistoryService(hass);
      service.subscribe("person.a", new Date(), undefined, () => {}, false);
      service.subscribe("person.a", new Date(), undefined, () => {}, false);

      expect(hass.states["person.a"].attributes.device_trackers).toEqual(["device_tracker.a"]);
      expect(hass.connection.subscribeMessage.mock.calls[1][1].entity_ids).toEqual(["device_tracker.a", "person.a"]);
    });
  });
});
