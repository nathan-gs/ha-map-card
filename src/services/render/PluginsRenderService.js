import Logger from "../../util/Logger.js";
import PluginConfig from "../../configs/PluginConfig";
import Plugin from '../../models/Plugin.js'
import L from "leaflet";

export default class PluginsRenderService {
  /** @type {L.Map} */
  map;
  /** @type {[PluginConfig]} */
  pluginsConfig;
  /** @type {Map} */
  plugins;

  constructor(map, pluginsConfig) {
    this.map = map;
    this.pluginsConfig = pluginsConfig;
    this.plugins = new Map();
  }

  // Asynchronously load and set up all plugins
  async setup() {
    // Load all plugins asynchronously
    const loadPromises = this.pluginsConfig.map(async (config) => {

      await this.register(config);
    });

    // Wait for all plugins to finish loading
    await Promise.all(loadPromises);



    Logger.debug('All plugins have been loaded and initialized.');
  }

  async register(config) {
    try {
      // Check if the plugin is already registered
      if (this.plugins.has(config.name)) {
        Logger.warn(`Plugin ${config.name} is already registered.`);
        return;
      }

      // Dynamically import the plugin module from the URL
      const module = await import(config.url);

      const pluginFactory = module.default;

      // Create a new instance of the plugin with provided options
      const PluginClass = pluginFactory(L, Plugin);
      const pluginInstance = new PluginClass(this.map, config.name, config.options)

      // Initialize the plugin if it has an init method
      if (typeof pluginInstance.init === 'function') {
        await pluginInstance.init();
      }

      // Add the loaded plugin instance to the plugins map
      this.plugins.set(config.name, pluginInstance);

      Logger.debug(`Plugin ${config.name} has been registered and initialized.`);
      Logger.debug([...this.plugins.keys()]);

      await pluginInstance.render();

    } catch (error) {
      Logger.error(`Failed to load plugin ${config.name} from ${config.url}:`, error);
    }
  }

  async render() {}

  // List all registered plugins
  listPlugins() {
    return Array.from(this.plugins.keys());
  }

  // Get a plugin instance by name
  getPluginByName(name) {
    return this.plugins.get(name);
  }

}
