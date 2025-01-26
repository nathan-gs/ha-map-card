import FocusFollowConfig from "./FocusFollowConfig";

import { describe, expect, it } from "@jest/globals";

describe('FocusFollowConfig', () => {

  describe('constructor', () => {
    it('should initialize with a wrong config', () => {
      const config = "auto";
      const focusFollowConfig = new FocusFollowConfig(config);

      expect(focusFollowConfig.isNone).toBe(true);
      expect(focusFollowConfig.isContains).toBe(false);
      expect(focusFollowConfig.isRefocus).toBe(false);
    });

    it('should initialize with none config', () => {
      const config = "none";
      const focusFollowConfig = new FocusFollowConfig(config);

      expect(focusFollowConfig.isNone).toBe(true);
      expect(focusFollowConfig.isContains).toBe(false);
      expect(focusFollowConfig.isRefocus).toBe(false);
    });

    it('should initialize with an empty config', () => {
      const config = null;
      const focusFollowConfig = new FocusFollowConfig(config);

      expect(focusFollowConfig.isNone).toBe(true);
      expect(focusFollowConfig.isContains).toBe(false);
      expect(focusFollowConfig.isRefocus).toBe(false);
    });

    it('should initialize with contains config', () => {
      const config = "contains";
      const focusFollowConfig = new FocusFollowConfig(config);

      expect(focusFollowConfig.isNone).toBe(false);
      expect(focusFollowConfig.isContains).toBe(true);
      expect(focusFollowConfig.isRefocus).toBe(false);
    });

    it('should initialize with refocus config', () => {
      const config = "refocus";
      const focusFollowConfig = new FocusFollowConfig(config);

      expect(focusFollowConfig.isNone).toBe(false);
      expect(focusFollowConfig.isContains).toBe(false);
      expect(focusFollowConfig.isRefocus).toBe(true);
    });


  });
});