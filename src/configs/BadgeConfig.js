import Logger from "../util/Logger.js";

const BADGE_DISPLAY_MODES = [
  "label",
  "state",
  "attribute",
  "icon",
  "picture",
];

export default class BadgeConfig {
  /** @type {string} */
  entity;
  /** @type {string} */
  display;
  /** @type {string} */
  label;
  /** @type {string} */
  attribute;
  /** @type {string} */
  suffix;
  /** @type {string} */
  icon;
  /** @type {string} */
  picture;
  /** @type {string} */
  color;
  /** @type {string} */
  background_color;
  /** @type {boolean} */
  state_color;
  /** @type {boolean} */
  hide_unit;

  constructor(config) {
    this.entity = config.entity ? config.entity : null;
    this.display = BADGE_DISPLAY_MODES.includes(config.display) ? config.display : null;
    this.label = config.display === "label" ? (config.label ? config.label : null) : null;
    this.attribute = config.display === "attribute" ? (config.attribute ? config.attribute : null) : null;
    this.suffix = config.display === "attribute" ? (config.suffix ? config.suffix : null) : null;
    this.icon = config.icon ? config.icon : undefined;
    this.picture = config.picture ? config.picture : undefined;
    this.color = config.color ?? undefined;
    this.background_color = config.background_color ?? undefined;
    this.state_color = config.state_color ?? false;
    this.hide_unit = config.hide_unit ?? true;

    Logger.debug(
      `[BadgeConfig]: created with entity: ${this.entity}, display: ${this.display}, label: ${this.label}, attribute: ${this.attribute}, suffix: ${this.suffix}, icon: ${this.icon}, picture: ${this.picture}, color: ${this.color}, background_color: ${this.background_color}, state_color: ${this.state_color}, hide_unit: ${this.hide_unit}`
    );
  }
}
