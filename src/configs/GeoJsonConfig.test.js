import GeoJsonConfig from './GeoJsonConfig';

describe('GeoJsonConfig', () => {
  describe('constructor', () => {
    it('should create disabled config when passed false', () => {
      const config = new GeoJsonConfig(false, '#ff0000');
      expect(config.enabled).toBe(false);
    });

    it('should create disabled config when passed null', () => {
      const config = new GeoJsonConfig(null, '#ff0000');
      expect(config.enabled).toBe(false);
    });

    it('should create disabled config when passed undefined', () => {
      const config = new GeoJsonConfig(undefined, '#ff0000');
      expect(config.enabled).toBe(false);
    });

    it('should create config with string attribute name', () => {
      const config = new GeoJsonConfig('zone_data', '#ff0000');
      expect(config.enabled).toBe(true);
      expect(config.attribute).toBe('zone_data');
      expect(config.color).toBe('#ff0000');
      expect(config.weight).toBe(3);
      expect(config.opacity).toBe(1.0);
      expect(config.fillOpacity).toBe(0.2);
      expect(config.hideMarker).toBe(false);
    });

    it('should create config with object configuration', () => {
      const config = new GeoJsonConfig(
        {
          attribute: 'custom_geo',
          color: '#00ff00',
          weight: 5,
          opacity: 0.8,
          fill_opacity: 0.5
        },
        '#ff0000'
      );
      expect(config.enabled).toBe(true);
      expect(config.attribute).toBe('custom_geo');
      expect(config.color).toBe('#00ff00');
      expect(config.weight).toBe(5);
      expect(config.opacity).toBe(0.8);
      expect(config.fillOpacity).toBe(0.5);
      expect(config.hideMarker).toBe(false);
    });

    it('should use default attribute name when not specified in object', () => {
      const config = new GeoJsonConfig({}, '#ff0000');
      expect(config.enabled).toBe(true);
      expect(config.attribute).toBe('geo_location');
    });

    it('should use default color when not specified in object', () => {
      const config = new GeoJsonConfig({ attribute: 'test' }, '#ff0000');
      expect(config.enabled).toBe(true);
      expect(config.color).toBe('#ff0000');
    });

    it('should use default values for optional properties', () => {
      const config = new GeoJsonConfig({ attribute: 'test' }, '#ff0000');
      expect(config.weight).toBe(3);
      expect(config.opacity).toBe(1.0);
      expect(config.fillOpacity).toBe(0.2);
    });

    it('should handle zero values for numeric properties', () => {
      const config = new GeoJsonConfig(
        {
          attribute: 'test',
          weight: 0,
          opacity: 0,
          fill_opacity: 0
        },
        '#ff0000'
      );
      expect(config.weight).toBe(0);
      expect(config.opacity).toBe(0);
      expect(config.fillOpacity).toBe(0);
    });

    it('should set hideMarker to true when specified', () => {
      const config = new GeoJsonConfig(
        {
          attribute: 'test',
          hide_marker: true
        },
        '#ff0000'
      );
      expect(config.hideMarker).toBe(true);
    });

    it('should set hideMarker to false when explicitly set to false', () => {
      const config = new GeoJsonConfig(
        {
          attribute: 'test',
          hide_marker: false
        },
        '#ff0000'
      );
      expect(config.hideMarker).toBe(false);
    });

    it('should default hideMarker to false when not specified', () => {
      const config = new GeoJsonConfig(
        {
          attribute: 'test'
        },
        '#ff0000'
      );
      expect(config.hideMarker).toBe(false);
    });
  });
});