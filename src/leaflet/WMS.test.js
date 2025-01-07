import WMS from "./WMS";
import L from 'leaflet';
import { describe, expect, it } from '@jest/globals';

describe('WMS', () => {
  it('should have a constructor', () => {
    expect(WMS).toBeDefined();
  });

  it('should inherit from L.TileLayer.WMS', () => {
    const wms = new WMS('url', { key: 'value' });
    expect(wms instanceof L.TileLayer.WMS).toBe(true);
  });

  it('should inherit from L.TileLayer', () => {
    const wms = new WMS('url', { key: 'value' });
    expect(wms instanceof L.TileLayer).toBe(true);
  });
});