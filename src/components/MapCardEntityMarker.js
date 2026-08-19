import { LitElement, html, css } from "lit";

export default class MapCardEntityMarker extends LitElement {
  static get properties() {
    return {
      'entityId': {type: String, attribute: 'entity-id'},
      'title': {type: String, attribute: 'title'},
      'prefix': {type: String, attribute: 'prefix'},
      'suffix': {type: String, attribute: 'suffix'},
      'tooltip': {type: String, attribute: 'tooltip'},
      'picture': {type: String, attribute: 'picture'},
      'icon': {type: String, attribute: 'icon'},
      'placeIcon': {type: String, attribute: 'place-icon'},
      'callout': {type: String, attribute: 'callout'},
      'color': {type: String, attribute: 'color'},
      'size': {type: Number},
      'tapAction': {type: Object, attribute: 'tap-action'},
      'extraCssClasses': {type: String, attribute: 'extra-css-classes'},
    };
  }

  render() {
    // When the entity is inside a named place, render a horizontal "pill":
    // a stadium outline holding two circles - the zone icon (left) and the
    // entity's initials (right). Otherwise fall back to the normal marker.
    if (this.placeIcon) {
      // Pill: zone icon (left) + initials (right). Geometry must match
      // Entity.createMapMarker. When `callout` is on (zoomed in) the pill sits
      // up-left of the point with a thin leader line down-right to a dot on the
      // exact location; otherwise it just centers on the point (no leader).
      const s = this.size;
      const pillW = 2 * s + 14;
      const pillH = s + 8;
      const pill = html`
        <div class="place-pill" style="border-color: ${this.color}; width: ${pillW}px; height: ${pillH}px;">
          <div class="pill-badge" style="border-color: ${this.color}; width: ${s}px; height: ${s}px;">
            <ha-icon icon="${this.placeIcon}" style="--icon-primary-color: ${this.color}; --mdc-icon-size: ${s - 14}px;"></ha-icon>
          </div>
          <div class="pill-badge pill-initials" style="border-color: ${this.color}; color: ${this.color}; width: ${s}px; height: ${s}px; font-size: ${Math.round(s * 0.5)}px;">
            ${this.title}
          </div>
        </div>`;
      if (this.callout !== "true") {
        return html`
          <div class="place-pill-wrap ${this.extraCssClasses ? this.extraCssClasses : ""}"
               style="width: ${pillW}px; height: ${pillH}px;"
               @click=${this._badgeTap}>
            ${pill}
          </div>`;
      }
      const off = Math.round(s * 0.7);
      const boxW = pillW + off;
      const boxH = pillH + off;
      const dotX = boxW - 2, dotY = boxH - 2;
      return html`
        <div class="place-pill-wrap ${this.extraCssClasses ? this.extraCssClasses : ""}"
             style="width: ${boxW}px; height: ${boxH}px;"
             @click=${this._badgeTap}>
          <svg class="pill-leader" width="${boxW}" height="${boxH}">
            <line x1="${pillW - 2}" y1="${pillH - 2}" x2="${dotX}" y2="${dotY}"
                  stroke="${this.color}" stroke-width="1.5"></line>
            <circle cx="${dotX}" cy="${dotY}" r="2.5" fill="${this.color}"></circle>
          </svg>
          ${pill}
        </div>
      `;
    }
    return html`
        <div
          class="marker ${this.picture ? "picture" : ""}  ${this.extraCssClasses ? this.extraCssClasses : ""}"
          style="border-color: ${this.color}; height: ${this.size}px; width: ${this.size}px;"
          @click=${this._badgeTap}
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
      .place-pill-wrap {
        position: relative;
      }
      .pill-leader {
        position: absolute;
        left: 0;
        top: 0;
        overflow: visible;
        pointer-events: none;
      }
      .place-pill {
        position: absolute;
        left: 0;
        top: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        box-sizing: border-box;
        padding: 3px 5px;
        border-radius: 999px;
        border: 1px solid var(--ha-marker-color, var(--primary-color));
        background-color: var(--card-background-color);
        font-size: var(--ha-marker-font-size, 1.5em);
        white-space: nowrap;
      }
      .place-pill .pill-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        border-radius: 50%;
        border: 1px solid var(--ha-marker-color, var(--primary-color));
        background-color: var(--card-background-color);
        color: var(--primary-text-color);
        flex: 0 0 auto;
      }
      .place-pill .pill-initials {
        font-weight: 700;
        text-align: center;
        line-height: 1;
      }
      .place-pill.dark,
      .place-pill.dark .pill-badge {
        color: #ffffff;
        background: #1c1c1c;
      }
    `;
  }
}
