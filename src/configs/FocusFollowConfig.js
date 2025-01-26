import Logger from "../util/Logger";

export default class FocusFollowConfig {

  /** 
   * @type {string} 
   * @private
   */
  selection = "none";

  constructor(config) {
    this.selection = ['refocus', 'contains', 'none' ].includes(config) ? config : "none";
    Logger.debug(`[FocusFollowConfig]: Setting up focus follow config with selection ${this.selection}`);
  }

  get isRefocus() {
    return this.selection == "refocus";
  }

  get isNone() {
    return this.selection == "none";
  }

  get isContains() {
    return this.selection == "contains";
  }

}