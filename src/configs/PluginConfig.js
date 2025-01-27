import Logger from "../util/Logger";


export default class PluginConfig {
  /** @type {{module: string, file: string} | undefined} */
  hacs;
  /** @type {string | undefined} */
  url;
  /** @type {string} */
  name;
  /** @type {object} */
  options;

  constructor(hacs, url, name, options) {
    this.hacs = hacs,
    this.url = url;
    this.name = name;
    this.options = { ...options };

    Logger.debug(
      `[PluginConfig]: created with hacs: ${this.hacs}, url: ${this.url}, name: ${this.name}, options: ${this.options}`
    );
  }
}
