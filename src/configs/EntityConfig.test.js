import EntityConfig from "./EntityConfig";
import { describe, expect, it } from "@jest/globals";

describe("EntityConfig", () => {

  const defaults = {
    historyStart: null,
    historyEnd: null
  };

  describe("_generateRandomColor", () => {
    it("should generate a random color", () => {
      const entityConfig = new EntityConfig("sensor.random_entity", defaults);
      
      const color = entityConfig._generateRandomColor();

      expect(color).toMatch(/^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/);
      expect(color).toBe('hsl(297, 95%, 35%)');
      expect(entityConfig.color).toBe(color);
      
    });

    it("should return a color if defined", () => {
      const entityConfig = new EntityConfig({
        id: "sensor.random_entity",
        color: "red"
       }, defaults);

      expect(entityConfig.color).toBe("red");

    });
  });
});