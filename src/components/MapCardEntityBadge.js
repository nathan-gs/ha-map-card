import { LitElement, html, css, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";

export default class MapCardEntityBadge extends LitElement {
  static get properties() {
    return {
      'hass': {attribute: false},
      'badge': {attribute: false},
      'borderColor': {attribute: false},
      'badgeSize': {attribute: false},
    };
  }

  render() {
    const display = this.badge.display;
    const stateObj = this.badge.entity
      ? this.hass.states[this.badge.entity]
      : undefined;

    let icon = this.badge.icon;
    if (
      !icon &&
      stateObj &&
      stateObj.attributes.entity_picture &&
      display === "icon"
    ) {
      icon = stateObj?.attributes.icon;
      if (!icon) {
        icon = "mdi:eye"; // fallback to some default icon
      }
    }

    let label;
    if (display === "label") {
      label = this.badge.label;
    } else if (stateObj && display === "state") {
      if (this.badge.hide_unit) {
        const stateParts = this.hass.formatEntityStateToParts(stateObj);
        label = stateParts
          .filter((part) => part.type === "value")
          .map((part) => part.value)
          .join("");
      } else {
        label = this.hass.formatEntityState(stateObj);
      }
    } else if (stateObj && display === "attribute" && this.badge.attribute) {
      if (this.badge.hide_unit) {
        const attrParts = this.hass.formatEntityAttributeValueToParts(
          stateObj,
          this.badge.attribute
        );
        label = attrParts
          .filter((part) => part.type === "value")
          .map((part) => part.value)
          .join("");
      } else {
        label = this.hass.formatEntityAttributeValue(
          stateObj,
          this.badge.attribute
        );
        if (this.badge.suffix) {
          const composed = `${label} ${this.badge.suffix}`;
          label = composed;
        }
      }
    }

    const error = Boolean((!display && !stateObj) ||
      (display === "label" && !this.badge.label) ||
      (display === "state" && !stateObj) ||
      (display === "attribute" && !stateObj) ||
      (display === "attribute" && !this.badge.attribute));

    const clsImageOnly = Boolean(display === "picture" && this.badge.picture && !stateObj);
    const clsLabel = Boolean((stateObj && (display === "state" ||
        (display === "attribute" && this.badge.attribute))) ||
      (display === "label" && this.badge.label));
    const clsColored = Boolean(this.badge.color &&
      !error &&
      (((!display || display === "icon") &&
        !this.badge.state_color) ||
        clsLabel));

    const iconRatio = 1.5; // ratio of badge size to icon size
    const iconSize = Math.floor(this.badgeSize / iconRatio);

    const stateBadgeNoStateColor = Boolean(stateObj && !display && !this.badge.state_color);
    const stateBadgeStateColor = Boolean(stateObj && !display && this.badge.state_color);
    const stateBadgeIcon = Boolean(display === "icon");
    const stateBadgePicture = Boolean(stateObj && display === "picture");

    return html`
      <div
        class=${classMap({
          badge: true,
          "image-only": clsImageOnly,
          label: clsLabel,
          colored: clsColored,
        })}
        style=${styleMap({
          "border-color": this.borderColor,
          "--color": !this.badge.state_color ? this.badge.color : undefined,
          "--background-color": this.badge.background_color,
          "background-image": clsImageOnly
            ? `url(${this.hass.hassUrl(this.badge.picture)})`
            : undefined,
          "--font-size": this.badge.hide_unit
            ? `var(--ha-font-size-m, 14px)`
            : `var(--ha-font-size-xs, 10px)`,
          "--mdc-icon-size": `${iconSize}px`,
        })}
        @click=${this._badgeTap}
      >
        ${stateBadgeNoStateColor
          ? html`<state-badge
              .hass=${this.hass}
              .stateObj=${stateObj}
              .overrideIcon=${icon}
              .overrideImage=${this.badge.picture}
              .stateColor=${this.badge.state_color}
            ></state-badge>`
          : nothing}
        ${stateBadgeStateColor
          ? html`<state-badge
              .hass=${this.hass}
              .stateObj=${stateObj}
              .overrideIcon=${icon}
              .stateColor=${this.badge.state_color}
            ></state-badge>`
          : nothing}
        ${stateBadgeIcon
          ? html`<state-badge
              .hass=${this.hass}
              .stateObj=${stateObj}
              .overrideIcon=${icon}
              .stateColor=${this.badge.state_color}
            ></state-badge>`
          : nothing}
        ${stateBadgePicture
          ? html`<state-badge
              .hass=${this.hass}
              .stateObj=${stateObj}
              .overrideImage=${this.badge.picture}
            ></state-badge>`
          : nothing}
        ${clsLabel ? label : nothing}
        ${error
          ? html`<div class="error">
              <ha-icon .icon=${"mdi:alert"}></ha-icon>
            </div>`
          : nothing}
      </div>
    `;
  }

  _badgeTap(ev) {
    ev.stopPropagation();
    if (this.badge.entity) {
      const event = new Event('hass-more-info', { composed: true });
      event.detail = { entityId: this.badge.entity };
      this.dispatchEvent(event);
    }
  }

  static get styles() {
    return css`
      :host {
        position: absolute;
        /* --marker-size & --badge-size are defined on a higher level */
        top: calc(var(--badge-size) * 0.25 * -1);
        left: calc(var(--marker-size) - var(--badge-size) * 0.75);
        inset-inline-start: calc(var(--marker-size) - var(--badge-size) * 0.75);
        inset-inline-end: initial;
      }

      .badge {
        this.display: flex;
        /* justify-content: center; */
        /* align-items: center; */
        /* align-content: center; */ /* mfi:alert - ok */
        line-height: 0;
        width: var(--badge-size);
        height: var(--badge-size);
        box-sizing: border-box;

        /* --ha-marker-color, --primary-color - HA Frontend CSS variables */
        border: 1px solid var(--ha-marker-color, var(--primary-color));

        /* --ha-marker-badge-border-radius - custom CSS variable for ha-map-card */
        border-radius: var(--ha-marker-badge-border-radius, 50%);

        /* --card-background-color - HA Frontend CSS variable */
        background-color: var(--background-color, var(--card-background-color));
        transition: background-color 280ms ease-in-out;
      }

      .image-only {
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
      }

      .label {
        /* --ha-marker-badge-font-size - custom CSS variable for ha-map-card */
        /* 0.7 - coefficient to get smaller fonts than ha-font-size-xs */
        font-size: var(
          --ha-marker-badge-font-size,
          calc(var(--font-size) * 0.7 * var(--marker-size) / 48px)
        );

        /* --ha-font-weight-light - HA Frontend CSS variable (default "300") */
        font-weight: var(--ha-font-weight-light, 300);

        text-align: center;
        align-content: center;

        /* --ha-line-height-condensed - HA Frontend CSS variable (default "1.2") */
        line-height: var(--ha-line-height-condensed, 1.2);
      }

      state-badge {
        width: 100%;
        height: 100%;
      }

      .colored.label,
      .colored state-badge {
        color: var(--color);
      }

      .error {
        /* in HA Frontend same color used in state-badge for "missing" class */
        color: #fce588;
      }
    `;
  }
}
