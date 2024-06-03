import {
  LitElement,
  html,
  css,
} from "lit";

import MapCard from "./components/MapCard.js"
import MapCardEntityMarker from "./components/MapCardEntityMarker.js"

if (!customElements.get("map-card")) {
  customElements.define("map-card", MapCard);
  customElements.define("map-card-entity-marker", MapCardEntityMarker);
  console.info(
    `%cnathan-gs/ha-map-card: VERSION`,
    'color: orange; font-weight: bold; background: black'
  )
}