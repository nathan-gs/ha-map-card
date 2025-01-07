import L from "leaflet";
import { redraw } from './Redraw';


export default class TileLayer extends L.TileLayer {

  redraw() {
    redraw(this)
  }
}
