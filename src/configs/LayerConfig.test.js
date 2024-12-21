import LayerConfig from "./LayerConfig";
import { describe, expect, it } from "@jest/globals";

describe("LayerConfig", () => {
  describe("constructor", () => {
    it("without history", () => {
      const layerConfig = new LayerConfig(
        "url",
        { key: "value" },
        null,
        "attribution"
      );
      expect(layerConfig.url).toBe("url");
      expect(layerConfig.options.key).toBe("value");
      expect(layerConfig.options.attribution).toBe("attribution");
      expect(layerConfig.historyProperty).toBeUndefined();
      expect(layerConfig.historyForceMidnight).toBeUndefined();
      expect(layerConfig.historySourceSuffix).toBeUndefined();
    });

    it("with history", () => {
      const historyConfig = {
        property: "dateTime",
        source: "entity.myEntity",
        suffix: "suffix",
        force_midnight: true,
      };
      const layerConfig = new LayerConfig(
        "url",
        { key: "value" },
        historyConfig,
        "attribution"
      );
      expect(layerConfig.url).toBe("url");
      expect(layerConfig.options.key).toBe("value");
      expect(layerConfig.options.attribution).toBe("attribution");
      expect(layerConfig.historyProperty).toBe("dateTime");
      expect(layerConfig.historyForceMidnight).toBe(true);
      expect(layerConfig.historySourceSuffix).toBe("suffix");
    });
  });
});
