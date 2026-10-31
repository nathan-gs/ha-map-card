import L from 'leaflet';
import TimelineEntry from './TimelineEntry';
import { Polyline, CircleMarker } from 'leaflet';

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
  /** @type {[Polyline|CircleMarker]} */
  mapPaths = [];
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
    // History arrives grouped per source entity (the person and each of its
    // device_trackers), so arrival order is not chronological. Insert in
    // timestamp order, otherwise a segment joins the end of one source's
    // track to the start of the next (#158).
    let low = 0;
    let high = this.entries.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.entries[mid].timestamp <= entry.timestamp) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    this.entries.splice(low, 0, entry);
    this.needRerender = true;
  };

  /**
   * @returns {[(Polyline|CircleMarker)]} 
   */
  update() {
    if(this.needRerender == false || this.entries.length == 0) {
      return [];
    }
    this.mapPaths.forEach((marker) => marker.remove());
    this.mapPaths = [];

    let opacityStep;
    let baseOpacity;

    if (this.gradualOpacity) {
      if(this.entries.length <= 2) {
        baseOpacity = 1;
        opacityStep = 0;
      } else {
        opacityStep = this.gradualOpacity / (this.entries.length - 2);
        baseOpacity = 1 - this.gradualOpacity;
      }
    }

    for (let i = 0; i < this.entries.length - 1; i++) {
      const entry = this.entries[i];
      const opacity = this.gradualOpacity
          ? baseOpacity + i * opacityStep : undefined;

      if(this.showDots) {
        this.mapPaths.push(
          L.circleMarker([entry.latitude, entry.longitude], 
            {
              radius: 3,
              color: this.color,
              opacity,
              fillOpacity: opacity,
              interactive: true,
            }
          ).bindTooltip(`${this.entityTitle} ${entry.timestamp.toLocaleString()}`, {direction: 'top'})
        );
      }

      const nextEntry = this.entries[i + 1];
      const latlngs = [[entry.latitude, entry.longitude], [nextEntry.latitude, nextEntry.longitude]];

      if(this.showLines) {
        this.mapPaths.push(
          L.polyline(latlngs, {
            color: this.color,
            opacity,
            interactive: false,
            // Round caps from adjacent segments stack on the shared vertex
            // and make joints darker than the segments (#164).
            lineCap: 'butt',
          })
        );
      }
    }

    this.needRerender = false;
    return this.mapPaths;
  }

}