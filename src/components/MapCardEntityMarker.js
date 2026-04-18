import { LitElement, html, css, nothing } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import "./MapCardEntityBadge";

export default class MapCardEntityMarker extends LitElement {
  static get properties() {
    return {
      'hass': {attribute: false},
      'entityId': {type: String, attribute: 'entity-id'},
      'title': {type: String, attribute: 'title'},
      'prefix': {type: String, attribute: 'prefix'},
      'suffix': {type: String, attribute: 'suffix'},
      'tooltip': {type: String, attribute: 'tooltip'},
      'picture': {type: String, attribute: 'picture'},
      'icon': {type: String, attribute: 'icon'},
      'color': {type: String, attribute: 'color'},
      'size': {type: Number},
      'tapAction': {attribute: false},
      'extraCssClasses': {type: String, attribute: 'extra-css-classes'},
      'badge': {attribute: false},
    };
  }

  render() {
    const badgeRatio = 2.5; // ratio of marker size to badge size
    const markerSize = this.size ? Number(this.size) : 48;
    const badgeSize = Math.floor(markerSize / badgeRatio);

    return html`
        <div
          class="marker ${this.picture ? "picture" : ""}  ${this.extraCssClasses ? this.extraCssClasses : ""}"
          style=${styleMap({
            "border-color": this.color,
            "height": `${this.size}px`,
            "width": `${this.size}px`,
          })}
          @click=${this._badgeTap}
          title="${this.tooltip}"
          >
          ${this._inner()}
        </div>
      ${this.badge
        ? html`<map-card-entity-badge
            .hass=${this.hass}
            .badge=${this.badge}
            .borderColor=${this.color}
            .badgeSize=${badgeSize}
            style=${styleMap({
              "--marker-size": `${markerSize}px`,
              "--badge-size": `${badgeSize}px`,
            })}
          ></map-card-entity-badge>`
        : nothing}
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
      // Show picture with optional label overlay
      const hasLabel = this.title && (this.prefix || this.suffix || this.title.trim());
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
      return html`<ha-icon icon="${this.icon}" style="--icon-primary-color: ${this.color}; --mdc-icon-size: ${this.size - 10}px;">icon</ha-icon>`
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
