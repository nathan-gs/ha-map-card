import Logger from "../util/Logger";

export default class PluginConfig {
  /** @type {string} */
  url;
  /** @type {string} */
  name;
  /** @type {object} */
  options;

  constructor(url, name, options) {
    this.url = url;
    this.name = name;
    this.options = { ...options };

    Logger.debug(
      `[PluginConfig]: created with url: ${this.url}, name: ${this.name}, options: ${this.options}`
    );
  }
}
