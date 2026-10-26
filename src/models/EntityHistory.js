import L from 'leaflet';
import TimelineEntry from './TimelineEntry';
import { Polyline, CircleMarker } from 'leaflet';

// Gradual opacity is drawn in this many steps, one polyline each, so a long
// trail stays a handful of SVG paths instead of one per segment.
const OPACITY_STEPS = 20;

export default class EntityHistory {

  /** @type {string} */
  entityId;
  /** @type {string} */
  entityTitle;
  /** @type {[TimelineEntry]} */
  entries = [];
  /** @type {string} */
  color;
  /** @type {number} */
  gradualOpacity;
  /** @type {[Polyline]} */
  lines = [];
  /** @type {[CircleMarker]} */
  dots = [];
  showDots = true;
  showLines = true;
  needRerender = false;

  constructor(entityId, entityTitle, color, gradualOpacity, showDots, showLines) {
    this.entityId = entityId;
    this.entityTitle = entityTitle;
    this.color = color;
    this.gradualOpacity = gradualOpacity;
    this.showDots = showDots;
    this.showLines = showLines;
  }

  /** @param {TimelineEntry} entry  */
  react(entry) {
    this.entries.push(entry);
    this.needRerender = true;
  };

  /**
   * Updates existing layers in place.
   * @returns {[(Polyline|CircleMarker)]} newly created layers, to be added to the map
   */
  update() {
    if(this.needRerender == false || this.entries.length == 0) {
      return [];
    }

    const segments = this.entries.length - 1;
    const steps = Math.min(this.gradualOpacity ? OPACITY_STEPS : 1, segments);
    const opacity = (step) => steps > 1
      ? 1 - this.gradualOpacity + this.gradualOpacity * step / (steps - 1)
      : 1;
    const latlngs = this.entries.map((entry) => [entry.latitude, entry.longitude]);
    const created = [];

    if (this.showDots) {
      for (let i = 0; i < segments; i++) {
        const o = opacity(Math.floor(i * steps / segments));
        if (!this.dots[i]) {
          this.dots[i] = L.circleMarker(latlngs[i],
            {
              radius: 3,
              color: this.color,
              opacity: o,
              fillOpacity: o,
              interactive: true,
            }
          ).bindTooltip(`${this.entityTitle} ${this.entries[i].timestamp.toLocaleString()}`, {direction: 'top'});
          created.push(this.dots[i]);
        } else if (this.dots[i].options.opacity !== o) {
          this.dots[i].setStyle({ opacity: o, fillOpacity: o });
        }
      }
    }

    if (this.showLines) {
      for (let step = 0; step < steps; step++) {
        const points = latlngs.slice(Math.floor(step * segments / steps), Math.floor((step + 1) * segments / steps) + 1);
        if (!this.lines[step]) {
          this.lines[step] = L.polyline(points, {
            color: this.color,
            opacity: opacity(step),
            interactive: false,
            // Round caps from adjacent segments stack on the shared vertex
            // and make joints darker than the segments (#164).
            lineCap: 'butt',
          });
          created.push(this.lines[step]);
        } else {
          this.lines[step].setLatLngs(points).setStyle({ opacity: opacity(step) });
        }
      }
    }

    this.needRerender = false;
    return created;
  }

}