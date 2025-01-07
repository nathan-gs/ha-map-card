import L from 'leaflet';
import Logger from "../util/Logger";

// adapted from @barryhunter's implementation:
// https://github.com/Leaflet/Leaflet/issues/6659#issuecomment-491545545

export default class WMS extends L.TileLayer.WMS {

  _refreshTileUrl(tile, url) {
    //use a image in background, so that only replace the actual tile, once image is loaded in cache!
    const img = new Image();
    img.onload = function () {
      L.Util.requestAnimFrame(function () {
        tile.el.src = url;
      });
    };
    img.src = url;
  }

  redraw() {
    Logger.debug(`[TileLayer]: Refreshing tiles`);
    if(!this._map) {
      Logger.debug(`[TileLayer]: Map not (yet) loaded, skipping refresh`)
      return;
    }
    //prevent _tileOnLoad/_tileReady re-triggering a opacity animation
    const wasAnimated = this._map._fadeAnimated;
    this._map._fadeAnimated = false;

    for (var key in this._tiles) {
      var tile = this._tiles[key];
      if (tile.current && tile.active) {
        const oldsrc = tile.el.src;
        const newsrc = this.getTileUrl(tile.coords);
        if (oldsrc != newsrc) {
          this._refreshTileUrl(tile, newsrc);
        }
      }
    }

    if (wasAnimated) {
      setTimeout(() => {
        if(this._map) {
          this._map._fadeAnimated = wasAnimated;
        }
      }, 5000);
    }
  }
}
