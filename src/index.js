import MapCard from "./components/MapCard.js"
import MapCardEntityMarker from "./components/MapCardEntityMarker.js"

if (!customElements.get("map-card")) {
  customElements.define("map-card", MapCard);
  customElements.define("map-card-entity-marker", MapCardEntityMarker);
  console.info(
    `%cnathan-gs/ha-map-card: HA_MAP_CARD_VERSION`,
    'color: orange; font-weight: bold; background: black'
  )
}

// Register card so that it appears in the "Card Picker"
window.customCards.push({
    name: 'Map Card',
    description: 'A more powerful Map Card for Home Assistant',
    type: 'map-card',
    preview: true,
    documentationURL: `https://github.com/nathan-gs/ha-map-card`,
});
