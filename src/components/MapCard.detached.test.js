import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import MapCard from './MapCard.js';

jest.mock('leaflet');
jest.mock('lit', () => ({
  LitElement: class LitElement {
    static get properties() { return {}; }
    static get styles() { return ''; }
    requestUpdate() {}
    connectedCallback() {}
    disconnectedCallback() {}
  },
  html: (strings) => strings.join(''),
  css: (strings) => strings.join('')
}));
jest.mock('../util/Logger.js');

// A card that is not in the page must not build a map. Home Assistant can
// still call setConfig on a card it has just replaced (a websocket reconnect
// does this). Building then produced a map that never got its initial view
// (the one-shot resize callback skips a disconnected container), was reused -
// blank - if the card came back, and otherwise stayed referenced by a window
// listener.
describe('MapCard never builds while detached', () => {
  let card;

  beforeEach(() => {
    card = new MapCard();
    card.setup = jest.fn();
    card.requestUpdate = jest.fn();
    card._config = { title: 'Test', mapHeight: 300 };
    card.hass = { states: {}, themes: { darkMode: false } };
    card.themeMode = 'light';
    card.shadowRoot = { querySelector: jest.fn(() => document.createElement('div')) };
    card.setupNeeded = true;
  });

  it('render() skips setup on a detached card', () => {
    card.isConnected = false;
    card.render();
    expect(card.setup).not.toHaveBeenCalled();
    expect(card.setupNeeded).toBe(true);
  });

  it('render() still sets up an attached card', () => {
    card.isConnected = true;
    card.render();
    expect(card.setup).toHaveBeenCalled();
  });

  it('firstUpdated() skips setup on a detached card', () => {
    card.isConnected = false;
    card.firstUpdated();
    expect(card.setup).not.toHaveBeenCalled();
  });

  it('the pending setup runs when the card is attached again', () => {
    card.isConnected = false;
    card.render();
    card.connectedCallback();
    expect(card.requestUpdate).toHaveBeenCalled();
    card.isConnected = true;
    card.render();
    expect(card.setup).toHaveBeenCalledTimes(1);
  });

  it('a detached setConfig leaves a setup pending instead of building', () => {
    const cfg = { type: 'custom:map-card', x: 1, y: 2, entities: [] };
    card.setupNeeded = false;
    card.map = undefined;           // torn down on disconnect
    card.isConnected = false;
    card.setConfig(cfg);
    card.render();
    expect(card.setupNeeded).toBe(true);
    expect(card.setup).not.toHaveBeenCalled();
  });
});
