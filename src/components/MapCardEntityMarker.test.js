import { describe, expect, it, jest } from "@jest/globals";

jest.mock("lit", () => ({
  LitElement: class {},
  html: () => ({}),
  css: () => "",
}));

import { shouldOverlayPictureLabel } from "./MapCardEntityMarker.js";

describe("shouldOverlayPictureLabel", () => {
  it("does not overlay auto-generated initials on a picture", () => {
    expect(shouldOverlayPictureLabel("", "", "")).toBe(false);
    expect(shouldOverlayPictureLabel(undefined, undefined, undefined)).toBe(false);
  });

  it("overlays an explicit label on a picture", () => {
    expect(shouldOverlayPictureLabel("", "", "Dad")).toBe(true);
  });

  it("overlays prefix or suffix on a picture", () => {
    expect(shouldOverlayPictureLabel("~", "", "")).toBe(true);
    expect(shouldOverlayPictureLabel("", "km", "")).toBe(true);
  });

  it("ignores a whitespace-only label", () => {
    expect(shouldOverlayPictureLabel("", "", "   ")).toBe(false);
  });
});
