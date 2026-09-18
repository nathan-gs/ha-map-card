import PluginsRenderService from './PluginsRenderService';
import { describe, expect, it, beforeEach, jest } from "@jest/globals";

jest.mock('leaflet');
jest.mock('../../util/Logger');

// A plugin module as a plugin author would write it; hassAtInit records what init() saw.
jest.mock('test-plugin', () => ({
  __esModule: true,
  default: (L, pluginBase) => class TestPlugin extends pluginBase {
    init() { this.hassAtInit = this.hass; }
    renderMap() {}
    update() { this.hassAtUpdate = this.hass; }
    destroy() {}
  },
}), { virtual: true });

describe('PluginsRenderService', () => {
  const map = {};
  let service;

  beforeEach(() => {
    service = new PluginsRenderService(map, { states: { a: 1 } }, [{ name: 'test', url: 'test-plugin', options: {} }]);
  });

  it('gives plugins hass before init()', async () => {
    await service.setup();

    const plugin = service.getPluginByName('test');
    expect(plugin.hassAtInit).toEqual({ states: { a: 1 } });
  });

  it('refreshes hass before every update()', async () => {
    await service.setup();
    const newHass = { states: { a: 2 } };

    await service.render(newHass);

    const plugin = service.getPluginByName('test');
    expect(plugin.hass).toBe(newHass);
    expect(plugin.hassAtUpdate).toBe(newHass);
  });

  it('gives a plugin registered after a render the latest hass', async () => {
    const newHass = { states: { a: 3 } };
    await service.render(newHass);

    await service.setup();

    expect(service.getPluginByName('test').hassAtInit).toBe(newHass);
  });
});
