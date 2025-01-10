/**
 *
 * @param L
 * @param pluginBase
 */
export default function(L, pluginBase) {
  return class CircleTestPlugin extends pluginBase {
    constructor(map, name, options = {}) {
      super(map, name, options);
      const { x, y, r, ...circle_options } = options
      this.x = x;
      this.y = y
      this.r = r;
      this.circle_options = circle_options;
      console.debug("[HaMapCard] [CircleTestPlugin] Successfully invoked constructor of plugin:", this.name, "with options:", this.options);
    }

    init() {
      console.debug("[HaMapCard] [CircleTestPlugin] Called init() of plugin:", this.name);
    }

    renderMap() {
      console.debug("[HaMapCard] [CircleTestPlugin] Called render() of Plugin:", this.name);
      L.circle([this.x, this.y], { radius: this.r, ...this.circle_options }).addTo(this.map);

    }

    update() {
      console.debug("[HaMapCard] [CircleTestPlugin] Called update() of Plugin:", this.name);
    }
  };
}
