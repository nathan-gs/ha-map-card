import L from 'leaflet';
import Logger from '../util/Logger';

// adapted from @barryhunter's implementation:
// https://github.com/Leaflet/Leaflet/issues/6659#issuecomment-491545545
// https://gist.github.com/barryhunter/e42f0c4756e34d5d07db4a170c7ec680
/**
 * 
 * @param {object} tile 
 * @param {string} url 
 */
function refreshTileUrl(tile, url) {
  const img = new Image();
  img.onload = function () {
    L.Util.requestAnimFrame(function () {
      tile.el.src = url;
    });
  };
  img.src = url;
}

/**
 * @param {object} layerInstance 
 */
export function redraw(layerInstance) {
  Logger.debug(`[TileLayer.Redraw]: Refreshing tiles`);
  if (!layerInstance._map) {
    Logger.debug(`[TileLayer.Redraw]: Map not (yet) loaded, skipping refresh`);
    return;
  }
  const wasAnimated = layerInstance._map._fadeAnimated;
  layerInstance._map._fadeAnimated = false;

  for (var key in layerInstance._tiles) {
    var tile = layerInstance._tiles[key];
    if (tile.current && tile.active) {
      const oldsrc = tile.el.src;
      const newsrc = layerInstance.getTileUrl(tile.coords);
      if (oldsrc != newsrc) {
        refreshTileUrl(tile, newsrc);
      }
    }
  }

  if (wasAnimated) {
    setTimeout(() => {
      if (layerInstance._map) {
        layerInstance._map._fadeAnimated = wasAnimated;
      }
    }, 5000);
  }
}