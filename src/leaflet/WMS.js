// adapted from @barryhunter's implementation:
// https://github.com/Leaflet/Leaflet/issues/6659#issuecomment-491545545

import L from 'leaflet';

class WMS extends L.TileLayer.WMS {
  
  _refreshTileUrl(tile, url) {
    //use a image in background, so that only replace the actual tile, once image is loaded in cache!
    var img = new Image();
    img.onload = function() {
      L.Util.requestAnimFrame(function() {
        tile.el.src = url;
      });
    }
    img.src = url;
  }

  refresh() {
    //prevent _tileOnLoad/_tileReady re-triggering a opacity animation
    var wasAnimated = this._map._fadeAnimated;
    this._map._fadeAnimated = false;

    for (var key in this._tiles) {
      tile = this._tiles[key];
      if (tile.current && tile.active) {
        var oldsrc = tile.el.src;
        var newsrc = this.getTileUrl(tile.coords);
        if (oldsrc != newsrc) {
          this._refreshTileUrl(tile,newsrc);
        }
      }
    }

    if (wasAnimated)
      setTimeout(function() { map._fadeAnimated = wasAnimated; }, 5000);
  }
}


export { WMS };
