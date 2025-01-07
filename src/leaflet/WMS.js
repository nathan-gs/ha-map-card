import L from 'leaflet';
import { redraw } from './Redraw';

export default class WMS extends L.TileLayer.WMS {

  redraw() {
    redraw(this)
  }
}
