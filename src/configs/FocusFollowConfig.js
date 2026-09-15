import Logger from "../util/Logger";

export default class FocusFollowConfig {

  /**
   * @type {string}
   * @private
   */
  selection = "none";

  /**
   * @type {number}
   * @private
   */
  pauseSeconds = 0;

  constructor(config, pauseSeconds) {
    this.selection = ['refocus', 'contains', 'none' ].includes(config) ? config : "none";
    const parsedPauseSeconds = Number(pauseSeconds);
    this.pauseSeconds = (!isNaN(parsedPauseSeconds) && parsedPauseSeconds > 0) ? parsedPauseSeconds : 0;
    Logger.debug(`[FocusFollowConfig]: Setting up focus follow config with selection ${this.selection}, pauseSeconds ${this.pauseSeconds}`);
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

  get hasPause() {
    return this.pauseSeconds > 0;
  }

  get pauseMilliseconds() {
    return this.pauseSeconds * 1000;
  }

}