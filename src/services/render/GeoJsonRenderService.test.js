import GeoJsonRenderService from './GeoJsonRenderService';
import GeoJsonLayerConfig from '../../configs/GeoJsonLayerConfig';
import L from 'leaflet';
import { describe, expect, it, jest } from '@jest/globals';

jest.mock('../../util/Logger');

describe('GeoJsonRenderService', () => {
  it('should only reload a layer when its entity state changes', () => {
    const layer = { addTo: jest.fn(), clearLayers: jest.fn(), addData: jest.fn() };
    jest.spyOn(L, 'geoJSON').mockReturnValue(layer);
    const zone = { attributes: { geojson: { type: 'Point', coordinates: [0, 0] } } };
    const service = new GeoJsonRenderService({}, { states: { 'sensor.zone': zone } }, [new GeoJsonLayerConfig({ entity: 'sensor.zone' })]);
    service.setup();

    service.render({ states: { 'sensor.zone': zone } });
    service.render({ states: { 'sensor.zone': zone, 'sensor.other': {} } });
    expect(layer.addData).toHaveBeenCalledTimes(1);

    service.render({ states: { 'sensor.zone': { ...zone } } });
    expect(layer.addData).toHaveBeenCalledTimes(2);
  });
});
