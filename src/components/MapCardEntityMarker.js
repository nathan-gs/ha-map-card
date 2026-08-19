import { LitElement, html, css } from "lit";

/**
 * Picture markers only get a text overlay when the user asked for one.
 * Auto-generated initials (title) must not cover entity pictures (#197).
 * @param {string} prefix
 * @param {string} suffix
 * @param {string} label
 * @returns {boolean}
 */
export function shouldOverlayPictureLabel(prefix, suffix, label) {
  return Boolean(prefix || suffix || (label && String(label).trim()));
}

export default class MapCardEntityMarker extends LitElement {
  static get properties() {
    return {
      'entityId': {type: String, attribute: 'entity-id'},
      'title': {type: String, attribute: 'title'},
      'label': {type: String, attribute: 'label'},
      'prefix': {type: String, attribute: 'prefix'},
      'suffix': {type: String, attribute: 'suffix'},
      'tooltip': {type: String, attribute: 'tooltip'},
      'picture': {type: String, attribute: 'picture'},
      'icon': {type: String, attribute: 'icon'},
      'color': {type: String, attribute: 'color'},
      'size': {type: Number},
      'tapAction': {type: Object, attribute: 'tap-action'},
      'extraCssClasses': {type: String, attribute: 'extra-css-classes'},
    };
  }

  render() {
    return html`
        <div
          class="marker ${this.picture ? "picture" : ""}  ${this.extraCssClasses ? this.extraCssClasses : ""}"
          style="border-color: ${this.color}; height: ${this.size}px; width: ${this.size}px;"
          @click=${this._badgeTap}
          title="${this.tooltip}"
          >
          ${this._inner()}
        </div>
      `;
  };

  _badgeTap(ev) {
    ev.stopPropagation();
    if (this.entityId) {
      // https://developers.home-assistant.io/blog/2023/07/07/action-event-custom-cards/
      const actions = {
        entity: this.entityId,
        // Passed from entity
        tap_action: this.tapAction
      };

      const event = new Event('hass-action', {bubbles: true, composed: true});
      event.detail = { config: actions, action: 'tap'};
      this.dispatchEvent(event);
    }
  }

  _inner() {
    if(this.picture) {
      const hasLabel = shouldOverlayPictureLabel(this.prefix, this.suffix, this.label);
      return html`
        <div class="entity-picture" style="background-image: url(${this.picture})"></div>
        ${hasLabel ? html`
          <div class="picture-label">
            <span class="prefix" style="display: ${this.prefix ? 'initial' : 'none'}">${this.prefix}</span>
            ${this.title}
            <span class="suffix" style="display: ${this.suffix ? 'initial' : 'none'}">${this.suffix}</span>
          </div>
        ` : ''}
      `;
    }
    if(this.icon) {
      return html`<ha-icon icon="${this.icon}" style="color: ${this.color}; --icon-primary-color: ${this.color}; --mdc-icon-size: ${this.size - 10}px;">icon</ha-icon>`
    }
    if (!this.prefix && !this.suffix) {
      return this.title;
    } else {
      return html`
        <span class="prefix" style="display: ${this.prefix ? 'initial' : 'none'}">${this.prefix}</span>
        ${this.title}
        <span class="suffix" style="display: ${this.suffix ? 'initial' : 'none'}">${this.suffix}</span>
      `;
    }
  }

  static get styles() {
    return css`
      .marker {
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        width: 48px;
        height: 48px;
        font-size: var(--ha-marker-font-size, 1.5em);
        border-radius: var(--ha-marker-border-radius, 50%);
        border: 1px solid var(--ha-marker-color, var(--primary-color));
        color: var(--primary-text-color);
        background-color: var(--card-background-color);
        position: relative;
      }
      .marker.picture {
        overflow: hidden;
      }
      .entity-picture {
        background-size: cover;
        height: 100%;
        width: 100%;
      }
      .picture-label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 2px 4px;
        font-size: 0.7em;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .marker.dark {
        color: #ffffff;
        background: #1c1c1c;
      }
      .prefix {
        margin-right: var(--ha-marker-prefix-margin, 2px);
      }
      .suffix {
        margin-left: var(--ha-marker-suffix-margin, 2px);
      }
    `;
  }
}
