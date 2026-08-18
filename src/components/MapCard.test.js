import { jest, describe, beforeEach, it, expect } from '@jest/globals';

jest.mock('leaflet');
jest.mock('lit', () => ({
  LitElement: class LitElement {
    static get properties() { return {}; }
    static get styles() { return ''; }
    requestUpdate() {}
    connectedCallback() {}
  },
  html: (strings) => strings.join(''),
  css: (strings) => strings.join('')
}));
jest.mock('../util/Logger.js');

import MapCard from './MapCard.js';

describe('MapCard', () => {
  let card;

  beforeEach(() => {
    card = new MapCard();
    card.setup = jest.fn();
    card.requestUpdate = jest.fn();
    card.shadowRoot = {
      querySelector: jest.fn()
    };
  });

  describe('firstUpdated', () => {
    it('should call setup() when hass is available', () => {
      card.hass = { states: {}, themes: {} };

      card.firstUpdated();

      expect(card.setup).toHaveBeenCalled();
    });

    it('should not call setup() when hass is unavailable', () => {
      card.hass = undefined;

      card.firstUpdated();

      expect(card.setup).not.toHaveBeenCalled();
    });
  });

  describe('render', () => {
    beforeEach(() => {
      card._config = {
        title: 'Test',
        mapHeight: 300
      };
      card.hass = { states: {}, themes: { darkMode: false } };
      card.themeMode = 'light';
    });

    it('should call setup() when setupNeeded, hass is available, and #map exists', () => {
      card.setupNeeded = true;
      card.shadowRoot.querySelector.mockReturnValue(document.createElement('div'));

      card.render();

      expect(card.setup).toHaveBeenCalled();
      expect(card.shadowRoot.querySelector).toHaveBeenCalledWith('#map');
    });

    it('should not call setup() when setupNeeded is false', () => {
      card.setupNeeded = false;
      card.shadowRoot.querySelector.mockReturnValue(document.createElement('div'));

      card.render();

      expect(card.setup).not.toHaveBeenCalled();
    });

    it('should not call setup() when hass is unavailable', () => {
      card.setupNeeded = true;
      card.hass = undefined;
      card.shadowRoot.querySelector.mockReturnValue(document.createElement('div'));

      card.render();

      expect(card.setup).not.toHaveBeenCalled();
    });

    it('should not call setup() when #map element is missing', () => {
      card.setupNeeded = true;
      card.shadowRoot.querySelector.mockReturnValue(null);

      card.render();

      expect(card.setup).not.toHaveBeenCalled();
    });
  });

  describe('connectedCallback', () => {
    it('should request an update when setupNeeded is true', () => {
      card.setupNeeded = true;

      card.connectedCallback();

      expect(card.requestUpdate).toHaveBeenCalled();
    });

    it('should not request an update when setupNeeded is false', () => {
      card.setupNeeded = false;

      card.connectedCallback();

      expect(card.requestUpdate).not.toHaveBeenCalled();
    });
  });
});
