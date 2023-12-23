import {
    LitElement,
    html,
    css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

import "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

class MapCard extends LitElement {
    static get properties() {
        return {
            hass: {},
            config: {}
        };
    }

    firstRenderWithMap = true;
    entities = [];

    firstUpdated() {
        const mapEl = this.shadowRoot.querySelector('#' + this.getCSSId());
        let map = L.map(mapEl).setView([this.getX(), this.getY()], this.getZoom());

        map.addLayer(
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            })
        );
        this.map = map;
    }

    render() {

        if (this.map) {
            // First render is without the map
            if (this.firstRenderWithMap) {
                console.log("First Render with Map object, resetting size.")
                this.map.invalidateSize();
                this.firstRenderWithMap = false;
                this.entities = this.config.entities.map((ent) => {
                    const stateObj = this.hass.states[ent];
                    var marker = L.marker([stateObj.attributes.latitude, stateObj.attributes.longitude])
                        .setIcon(new L.icon({
                            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                            shadowIconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
                        }))
                        .bindPopup(ent)
                        .addTo(this.map);
                    return [ent, marker];
                });
            }
            this.entities.forEach((ent) => {
                const entity = ent[0];
                const marker = ent[1];
                const stateObj = this.hass.states[entity];
                marker.setLatLng([stateObj.attributes.latitude, stateObj.attributes.longitude]);
            })

        }

        return html`
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
            <ha-card header="${this.getTitle()}">
                <div id="${this.getCSSId()}" style="height: ${(this.getCardSize() - 1) * 50}px;"></div>
            </ha-card>
        `;
    }

    setConfigWithDefault(input, name, d = null) {
        if (!input[name]) {
            if (d == null) {
                throw new Error("Missing key " + name);
            }
            this.config[name] = d;
        } else {
            this.config[name] = input[name];
        }
    }

    setMap(map) {
        this.config.map = map;
    }

    getMap() {
        return this.config.map;
    }

    setConfig(inputConfig) {
        this.config = {};
        this.setConfigWithDefault(inputConfig, "x");
        this.setConfigWithDefault(inputConfig, "y");
        this.setConfigWithDefault(inputConfig, "zoom", 12);
        this.setConfigWithDefault(inputConfig, "title", "");
        this.setConfigWithDefault(inputConfig, "entities", []);
        this.setConfigWithDefault(inputConfig, "css_id", "map-card-" + (new Date()).getTime());
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return 6;
    }

    getCSSId() {
        return this.config.css_id;
    }

    getX() {
        return this.config.x;
    }

    getY() {
        return this.config.y;
    }

    getZoom() {
        return this.config.zoom;
    }

    getTitle() {
        return this.config.title;
    }

    styles() {
        return [css`    
            :host {
                display:block;     
                height: 100%;           
            }        
        `];
    }
}
customElements.define("map-card", MapCard);