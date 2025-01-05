import LayerConfig from "../configs/LayerConfig";
import LayerWithHistory from "./LayerWithHistory";  
import {describe, expect, it, jest} from "@jest/globals";

describe("LayerWithHistory", () => {

  it("should have a constructor", () => {
    expect(LayerWithHistory).toBeDefined();
  });

  it("should have a render method", () => {
    expect(new LayerWithHistory().render).toBeDefined();
  });

  it("should update the layer if there is a new date from the DateRangeManager", () => {
      
    const dateRangeManager = {
      listeners: [],
      onDateRangeChange: (callback) => {
        dateRangeManager.listeners.push(callback);
      },
      triggerDateRangeChange: (newDate) => {
        dateRangeManager.listeners.forEach((callback) => callback(newDate));
      }
    };
    const config = new LayerConfig();
    config.historySource = "auto";
    const layer = new LayerWithHistory("tile", config, {}, {}, {}, dateRangeManager);
    layer.updateLayer = jest.fn();
    layer.dateRangeManager = dateRangeManager;
    layer.render();
    dateRangeManager.triggerDateRangeChange("2023-01-01");
    expect(layer.updateLayer).toHaveBeenCalled();

  });

});