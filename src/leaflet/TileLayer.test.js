import TileLayer from "./TileLayer";
import L from 'leaflet';
import { describe, expect, it } from '@jest/globals';

describe('TileLayer', () => {
  it('should have a constructor', () => {
    expect(TileLayer).toBeDefined();
  });

  it('should inherit from L.TileLayer', () => {
    const t1 = new TileLayer('url', { key: 'value' });
    expect(t1 instanceof L.TileLayer).toBe(true);

  });

  it('should have a redraw method', () => {
    expect(new TileLayer('url', { key: 'value' }).redraw).toBeDefined();
  });


  it('should have a addTo method', () => {
    expect(new TileLayer('url', { key: 'value' }).addTo).toBeDefined();
  });


});
