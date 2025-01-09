import {Map, Circle as LeafletCircle} from 'leaflet';
import CircleConfig from '../configs/CircleConfig';
import Entity from './Entity';
import Logger from '../util/Logger';

export default class Circle {

  /** @type {CircleConfig} */
  config;
  /** @type {LeafletCircle} */
  circle;
  /** @type {Entity} */
  entity;

  constructor(config, entity) {
    this.config = config;
    this.entity = entity;
  }

  get radius() {
    if(this.config.source == "config") {
      return this.config.radius ?? 0;
    }
    const attributes = this.entity.state.attributes;
    if(this.config.source == "attribute") {
      return attributes[this.config.attribute] ?? 0;
    }
    if(attributes.gps_accuracy) {
      return attributes.gps_accuracy;
    }
    if(attributes.radius) {
      return attributes.radius;
    }
    if(this.config.radius > 0) {
      return this.config.radius;
    }
    return 0;
  }

  radiusLog() {
    if(Logger.isDebugEnabled) {
      if(this.config.source == "config") {
        Logger.debug(`[Circle]: for ${this.entity.id}, using config, resulting in: ${this.config.radius}`)
      }
      const attributes = this.entity.state.attributes;
      if(this.config.source == "attribute") {
        Logger.debug(`[Circle]: for ${this.entity.id}, using attribute (${this.config.attribute}), resulting in: ${attributes[this.config.attribute]}`)
      }
      if(attributes.gps_accuracy) {
        Logger.debug(`[Circle]: for ${this.entity.id}, using auto, with gps_accuracy, resulting in: ${attributes.gps_accuracy}`)
      }
      if(attributes.radius) {
        Logger.debug(`[Circle]: for ${this.entity.id}, using auto, with radius, resulting in: ${attributes.radius}`)
      }
      if(this.config.radius > 0) {
        Logger.debug(`[Circle]: for ${this.entity.id}, using auto, with a radius defined in config, resulting in: ${this.config.radius}`)
      }
      Logger.debug(`[Circle]: No radius, falling back to 0`)
    }
  }

  setup() {
    if(this.config.enabled) {
      this.radiusLog();
      try {
        this.circle = new LeafletCircle(this.entity.latLng, {
          radius: this.radius,
          color: this.config.color,
          fillOpacity: this.config.fillOpacity
        });
        this.circle.addTo(this.entity.map);
      } catch (e) {
        Logger.error("[Circle]: " + this.entity.config.id + " skipped due to issue", e);
      }
    }
  }

  update() {
    if(this.circle) {
      this.circle.setLatLng(this.entity.latLng);
      this.circle.setRadius(this.radius);
    }
  }
}