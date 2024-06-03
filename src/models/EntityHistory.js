
export default class EntityHistory {

  /** @type {String} */
  entityId;
  /** @type {String} */
  entityTitle;
  /** @type {[TimelineEntry]} */
  entries = [];
  /** @type {String} */
  color;
  /** @type {[Polyline|CircleMarker]} */
  mapPaths = [];
  showDots = true;
  showLines = true;
  needRerender = false;

  constructor(entityId, entityTitle, color, showDots, showLines) {
    this.entityId = entityId;
    this.entityTitle = entityTitle;
    this.color = color;
    this.showDots = showDots;
    this.showLines = showLines;
  }

  retrieve = (entry) => {
    this.entries.push(entry);
    this.needRerender = true;
  };

  /**
   * @returns {[(Polyline|CircleMarker)]}
   */
  render() {
    if(this.needRerender == false || this.entries.length == 0) {
      return [];
    }
    this.mapPaths.forEach((marker) => marker.remove());
    this.mapPaths = [];

    for (let i = 0; i < this.entries.length - 1; i++) {
      const entry = this.entries[i];

      if(this.showDots) {
        this.mapPaths.push(
          L.circleMarker([entry.latitude, entry.longitude], 
            {
              color: this.color,
              radius: 3,
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
            interactive: false,
          })
        );
      }
    }

    this.needRerender = false;
    return this.mapPaths;
  }

}