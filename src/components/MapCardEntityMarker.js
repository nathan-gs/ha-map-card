import { LitElement, html, css } from "lit";

export default class MapCardEntityMarker extends LitElement {
  static get properties() {
    return {
      'entityId': {type: String, attribute: 'entity-id'},
      'title': {type: String, attribute: 'title'},
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
      return html`<div class="entity-picture" style="background-image: url(${this.picture})"></div>`
    }
    if(this.icon) {
      return html`<ha-icon icon="${this.icon}">icon</ha-icon>`
    }
    return this.title;
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
      }
      .marker.picture {
        overflow: hidden;
      }
      .entity-picture {
        background-size: cover;
        height: 100%;
        width: 100%;
      }
      .marker.dark {
        color: var(--card-background-color);
        background-color: var(--primary-text-color);
      }
    `;
  }
}