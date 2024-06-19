import L from 'leaflet';
import HaMapUtilities from "./HaMapUtilities.js";

/** 
 * Get latLng based on configuration
 * - Return specific x/y if set
 * - Return x/y of focused entity if provided
 * - Return null (default behavior)
 * @param {object} config
 * @param {object} hass
 * @returns {[number, number]|null} 
 */
function getConfiguredLatLong(config, hass) {

	if (Number.isFinite(config.x) && Number.isFinite(config.y)) {
	  return [config.x, config.y];
	}

	if (config.focusEntity) {
		return getFocusedEntityLatLng(config.focusEntity, hass)
	}

	// Default
	return null;
}

/** 
 * 
 * @param {string} entityId
 * @param {object} hass 
 * @returns {[number, number]}
 */
function getFocusedEntityLatLng(entityId, hass) {
	const entity = hass.states[entityId];

	if (!entity) {
	  throw new Error(`Entity ${entityId} not found`);
	}

	// Get lat/lng (inc sub trackers)
	let latLng = HaMapUtilities.getEntityLatLng(entityId, hass.states);
	if (latLng) return latLng;

	// Unable to find
	throw new Error(`Entity ${entityId} has no longitude & latitude.`);
}


/**
 * setInitialView exported for use by Map component.
 * @param {L.map} map
 * @param {object} entities
 * @param {object} config
 * @param {object} hass
 * @returns {void} void
 */
export default function setInitialView(map, entities, config, hass)
{
	const latLng = getConfiguredLatLong(config, hass);
	
	if (latLng) {
		return map.setView(latLng, config.zoom);
	}

  	// If not, get bounds of all markers rendered
  	const markerGroup = new L.FeatureGroup(entities.map((e) => e.marker)).addTo(map);
  	map.fitBounds(markerGroup.getBounds());
}