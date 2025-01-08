import Logger from '../util/Logger';
import { redraw } from './Redraw';
import {describe, expect, it, jest} from "@jest/globals";

jest.mock('../util/Logger.js');

describe('Tile Layer Refresh Functions', () => {


  describe('redraw', () => {
    it('should handle when map is not loaded', () => {
      const mockLayer = {
        _map: null,
        getTileUrl: jest.fn(),
      };

      redraw(mockLayer);

      expect(Logger.debug).toHaveBeenCalledWith('[TileLayer.Redraw]: Map not (yet) loaded, skipping refresh');
    });

    it('should refresh tiles when map is loaded', () => {
      const mockLayer = {
        _map: {
          _fadeAnimated: true,
        },
        _tiles: {
          '0': {
            current: true,
            active: true,
            el: { src: 'old-url.jpg' },
            coords: { x: 0, y: 0, z: 0 },
          },
        },
        getTileUrl: jest.fn(() => 'new-url.jpg'),
      };

      redraw(mockLayer);

      expect(Logger.debug).toHaveBeenCalledWith('[TileLayer.Redraw]: Refreshing tiles');
      expect(mockLayer._map._fadeAnimated).toBe(false);
      expect(mockLayer.getTileUrl).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 });      

    });

    it('should not refresh if tile URL hasn\'t changed', () => {
      const mockLayer = {
        _map: {
          _fadeAnimated: true,
        },
        _tiles: {
          '0': {
            current: true,
            active: true,
            el: { src: 'same-url.jpg' },
            coords: { x: 0, y: 0, z: 0 },
          },
        },
        getTileUrl: jest.fn(() => 'same-url.jpg'),
      };

      redraw(mockLayer);
      expect(mockLayer._tiles['0'].el.src).toBe('same-url.jpg');

    });
  });
});