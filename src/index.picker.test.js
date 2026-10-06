/**
 * @jest-environment jsdom
 */
/* global require */
import { describe, expect, it, jest, beforeEach } from "@jest/globals";

// index.js pushed to window.customCards without creating it, so when no card
// loaded before it had created the list, the push threw after the elements were
// defined and the card was missing from the card picker.

jest.mock("./components/MapCard.js", () => ({ __esModule: true, default: class extends globalThis.HTMLElement {} }));
jest.mock("./components/MapCardEntityMarker.js", () => ({ __esModule: true, default: class extends globalThis.HTMLElement {} }));

const load = () => jest.isolateModules(() => { require("./index.js"); });

beforeEach(() => { delete window.customCards; jest.spyOn(console, "info").mockImplementation(() => {}); });

describe("card picker registration", () => {
  it("creates the list when nothing has, and registers the card in it", () => {
    expect(window.customCards).toBeUndefined();
    expect(load).not.toThrow();
    expect(Array.isArray(window.customCards)).toBe(true);
    expect(window.customCards.map((c) => c.type)).toEqual(["map-card"]);
  });

  it("keeps the cards another card registered first", () => {
    window.customCards = [{ type: "someone-elses-card" }];
    load();
    expect(window.customCards.map((c) => c.type)).toEqual(["someone-elses-card", "map-card"]);
  });
});
