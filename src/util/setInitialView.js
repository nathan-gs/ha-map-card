import HaMapUtilities from "./HaMapUtilities.js";

/** 
 * Get latLng based on configuration
 * - Return specific x/y if set
 * - Return x/y of focused entity if provided
 * - Return null (default behavior)
 * 
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
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
 * @param  string entityId
 * @param  {} hass 
 * @returns [number, number] latitude & longitude
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
 * 
 * @param L.Map map
 * @param array entities
 * @param MapConfig config
 * @param {} hass
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