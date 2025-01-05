import Layer from "./Layer";

describe("Layer", () => {
  it("should have a constructor", () => {
    expect(Layer).toBeDefined();
  });

  it("should have a render method", () => {
    expect(new Layer().render).toBeDefined();
  });

});