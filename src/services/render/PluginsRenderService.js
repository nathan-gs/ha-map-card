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
    Logger.debug(`[PluginsRenderService] Initialized plugins: ${[...this.plugins.keys()]}`);

    Logger.debug('[PluginsRenderService] All plugins have been loaded and initialized.');
  }

  // called by MapCard.disconnectedCallback to deregister plugins
  cleanup() {
    this.plugins.forEach((pluginInstance, pluginName) => {
      Logger.debug(`[PluginsRenderService] Destroying plugin ${pluginName}`);

      try {
        pluginInstance.destroy();
      } catch (error) {
        Logger.error(`[PluginsRenderService] Call to destroy() for plugin ${pluginName} failed:`, error);
      }

    });

    this.plugins.clear();
  }

  async register(config) {
    try {
      // Check if the plugin is already registered
      if (this.plugins.has(config.name)) {
        Logger.warn(`[PluginsRenderService] Plugin ${config.name} is already registered. Check your configuration for duplicates.`);
        return;
      }

      // Dynamically import the plugin module from the URL
      const module = await import(config.url);

      const pluginFactory = module.default;

      // Create a new instance of the plugin with provided options
      const PluginClass = pluginFactory(L, Plugin, Logger);
      const pluginInstance = new PluginClass(this.map, config.name, config.options)

      if (pluginInstance.destroy === Plugin.prototype.destroy) {
        throw new Error(`Plugin ${config.name} does not implement a destroy() method!`, { cause: 'NotImplemented' });
      }

      await pluginInstance.init();

      // Add the loaded plugin instance to the plugins map
      this.plugins.set(config.name, pluginInstance);

      Logger.debug(`[PluginsRenderService] Plugin ${config.name} has been registered and initialized.`);

      await pluginInstance.renderMap();

    } catch (error) {
      Logger.error(`[PluginsRenderService] Failed to load plugin ${config.name} from ${config.url}:`, error);
    }
  }

  async render() {
    try {
      const renderPromises = [];
      this.plugins.forEach((pluginInstance, pluginName) => {
        const wrappedPromise = (async () => {
          try {
            await pluginInstance.update();
          } catch (error) {
            Logger.error(`[PluginsRenderService] call to update() for plugin ${pluginName} failed:`, error);
          }
        });

        renderPromises.push(wrappedPromise());
      });

      await Promise.all(renderPromises);

    } catch (error) {
      Logger.error(`[PluginsRenderService] call to render() failed:`, error);
    }
  }

  // List all registered plugins
  listPlugins() {
    return Array.from(this.plugins.keys());
  }

  // Get a plugin instance by name
  getPluginByName(name) {
    return this.plugins.get(name);
  }

}
