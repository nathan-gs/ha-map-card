import HaMapUtilities from './HaMapUtilities';
import { describe, expect, it } from '@jest/globals';

describe('HaMapUtilities.isZooming', () => {
  it('is true during an animated zoom or a pinch', () => {
    expect(HaMapUtilities.isZooming({ _animatingZoom: true, touchZoom: {} })).toBe(true);
    expect(HaMapUtilities.isZooming({ _animatingZoom: false, touchZoom: { _zooming: true } })).toBe(true);
  });

  it('is false otherwise, also without touch zoom', () => {
    expect(HaMapUtilities.isZooming({ _animatingZoom: false, touchZoom: { _zooming: false } })).toBe(false);
    expect(HaMapUtilities.isZooming({})).toBe(false);
  });
});
