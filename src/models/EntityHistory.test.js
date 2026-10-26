import EntityHistory from './EntityHistory';
import L from 'leaflet';
import TimelineEntry from './TimelineEntry';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

describe('EntityHistory', () => {
  let entityHistory;

  beforeEach(() => {
    entityHistory = new EntityHistory(
      'entity-1',
      'Test Entity',
      'red',
      0.5,
      true,  // showDots
      true   // showLines
    );
  });

  describe('constructor', () => {
    it('should initialize with provided parameters', () => {
      expect(entityHistory.entityId).toBe('entity-1');
      expect(entityHistory.entityTitle).toBe('Test Entity');
      expect(entityHistory.color).toBe('red');
      expect(entityHistory.gradualOpacity).toBe(0.5);
      expect(entityHistory.showDots).toBe(true);
      expect(entityHistory.showLines).toBe(true);
    });
  });

  describe('react', () => {
    it('should add new TimelineEntry to entries array and set needRerender to true', () => {
      const mockEntry = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.5, longitude: -0.1} });
      entityHistory.react(mockEntry);
      expect(entityHistory.entries).toHaveLength(1);
      expect(entityHistory.entries[0]).toBe(mockEntry);
      expect(entityHistory.needRerender).toBe(true);
    });
  });

  describe('update', () => {
    it('should return an empty array if no entries or no rerender needed', () => {
      expect(entityHistory.update()).toEqual([]);
    });

    it('should create CircleMarkers for each entry when showDots is true', () => {
      const mockEntry1 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.5, longitude: -0.1} });
      const mockEntry2 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.6, longitude: -0.2} });
      const mockEntry3 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.7, longitude: -0.3} });
      
      entityHistory.react(mockEntry1);
      entityHistory.react(mockEntry2);
      entityHistory.react(mockEntry3);

      const spyCircleMarker = jest.spyOn(L, 'circleMarker').mockImplementation(() => ({
        bindTooltip: jest.fn(),
        remove: jest.fn()
      }));

      const result = entityHistory.update();

      expect(result).toHaveLength(4);
      expect(spyCircleMarker).toHaveBeenCalledTimes(2);
      expect(spyCircleMarker).toHaveBeenCalledWith([51.5, -0.1], expect.objectContaining({
        radius: 3,
        color: 'red',
        opacity: 0.5,
        fillOpacity: 0.5,
        interactive: true
      }));

      spyCircleMarker.mockRestore();
    });

    it('should create CircleMarkers for each entry when showDots is true, if only 2 entries, show no gradual opacity', () => {
      const mockEntry1 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.5, longitude: -0.1} });
      const mockEntry2 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.6, longitude: -0.2} });
      
      entityHistory.react(mockEntry1);
      entityHistory.react(mockEntry2);

      const spyCircleMarker = jest.spyOn(L, 'circleMarker').mockImplementation(() => ({
        bindTooltip: jest.fn(),
        remove: jest.fn()
      }));

      const result = entityHistory.update();

      expect(result).toHaveLength(2);
      expect(spyCircleMarker).toHaveBeenCalledTimes(1);
      expect(spyCircleMarker).toHaveBeenCalledWith([51.5, -0.1], expect.objectContaining({
        radius: 3,
        color: 'red',
        opacity: 1,
        fillOpacity: 1,
        interactive: true
      }));

      spyCircleMarker.mockRestore();
    });

    it('should create Polylines between entries when showLines is true', () => {
      const mockEntry1 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.5, longitude: -0.1} });
      const mockEntry2 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.6, longitude: -0.2} });
      const mockEntry3 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.6, longitude: -0.2} });
      
      entityHistory.react(mockEntry1);
      entityHistory.react(mockEntry2);
      entityHistory.react(mockEntry3);

      const spyPolyline = jest.spyOn(L, 'polyline').mockImplementation(() => ({
        remove: jest.fn()
      }));

      const result = entityHistory.update();

      expect(result).toHaveLength(4); // Assuming both dots and lines are shown
      expect(spyPolyline).toHaveBeenCalledTimes(2);
      expect(spyPolyline).toHaveBeenCalledWith([ [51.5, -0.1], [51.6, -0.2] ], expect.objectContaining({
        color: 'red',
        opacity: 0.5,
        interactive: false,
        lineCap: 'butt',
      }));

      spyPolyline.mockRestore();
    });

    it('should create Polylines between entries when showLines is true, if only 2 entries, show no gradual opacity', () => {
      const mockEntry1 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.5, longitude: -0.1} });
      const mockEntry2 = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.6, longitude: -0.2} });

      entityHistory.react(mockEntry1);
      entityHistory.react(mockEntry2);

      const spyPolyline = jest.spyOn(L, 'polyline').mockImplementation(() => ({
        remove: jest.fn()
      }));

      const result = entityHistory.update();

      expect(result).toHaveLength(2); // Assuming both dots and lines are shown
      expect(spyPolyline).toHaveBeenCalledTimes(1);
      expect(spyPolyline).toHaveBeenCalledWith([ [51.5, -0.1], [51.6, -0.2] ], expect.objectContaining({
        color: 'red',
        opacity: 1,
        interactive: false,
        lineCap: 'butt',
      }));

      spyPolyline.mockRestore();
    });

    it('should set needRerender to false after update', () => {
      const mockEntry = new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51.5, longitude: -0.1} });
      entityHistory.react(mockEntry);
      entityHistory.update();
      expect(entityHistory.needRerender).toBe(false);
    });

    const entryAt = (i) => new TimelineEntry(new Date(), "original-entity", "entity", { a: {latitude: 51 + i / 1000, longitude: i / 1000} });

    it('should update existing layers in place on new entries', () => {
      const history = new EntityHistory('entity-1', 'Test Entity', 'red', 0, true, true);
      history.react(entryAt(0));
      history.react(entryAt(1));
      expect(history.update()).toHaveLength(2);

      history.react(entryAt(2));
      const created = history.update();

      expect(created).toHaveLength(1);
      expect(created[0]).toBe(history.dots[1]);
      expect(history.lines).toHaveLength(1);
      expect(history.lines[0].getLatLngs()).toHaveLength(3);
    });

    it('should draw a long trail as a bounded number of lines with gradual opacity', () => {
      const history = new EntityHistory('entity-1', 'Test Entity', 'red', 0.5, false, true);
      for (let i = 0; i < 1000; i++) {
        history.react(entryAt(i));
      }

      const lines = history.update();

      expect(lines).toHaveLength(20);
      expect(lines[0].options.opacity).toBe(0.5);
      expect(lines[19].options.opacity).toBe(1);
      expect(lines.reduce((n, line) => n + line.getLatLngs().length - 1, 0)).toBe(999);
      lines.slice(1).forEach((line, i) => {
        expect(line.getLatLngs()[0]).toEqual(lines[i].getLatLngs().at(-1));
      });
    });
  });
});