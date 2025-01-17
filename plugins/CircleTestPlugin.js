/**
 *
 * @param L
 * @param pluginBase
 * @param Logger
 */
export default function(L, pluginBase, Logger) {
  return class CircleTestPlugin extends pluginBase {
    constructor(map, name, options = {}) {
      super(map, name, options);
      const { x, y, r, ...circle_options } = options
      this.x = x;
      this.y = y
      this.r = r;
      this.circle_options = circle_options;
      Logger.debug(`[CircleTestPlugin] Successfully invoked constructor of plugin: ${this.name} with options: ${this.options}`);
    }

    init() {
      Logger.debug(`[CircleTestPlugin] Called init() of plugin: ${this.name}`);
    }

    renderMap() {
      Logger.debug(`[CircleTestPlugin] Called render() of Plugin: ${this.name}`);
      this.circle = L.circle([this.x, this.y], { radius: this.r, ...this.circle_options }).addTo(this.map);

    }

    update() {
      Logger.debug(`[CircleTestPlugin] Called update() of Plugin: ${this.name}`);
    }

    destroy() {
      Logger.debug(`[CircleTestPlugin] Called destroy() of Plugin: ${this.name}`);
      this.circle.remove();
    }
  };
}
