export default class CircleConfig {

  /** @type {boolean} */
  enabled = false;
  /** @type {number} */
  radius = 0;
  /** @type {source} */
  source;
  /** @type {string} */
  color;
  /** @type {number} */
  fillOpacity = 0.1;
  /** @type {string} */
  attribute;

  constructor(config, defaultColor) {
    if((typeof config === 'string' || config instanceof String) && config === "auto") {
      this.enabled = true;
      this.source = "auto";
      this.color = defaultColor;
    } else if (config instanceof Object) {    
      this.enabled = true;
      this.radius = config.radius ?? 0;
      this._setSource(config.source, config.attribute);
      this.color = config.color ?? defaultColor;
      this.fillOpacity = config.fill_opacity ?? 0.1;
    }

  }

  /** 
   * @private
   * @param {string} source
   * @param {string} attribute 
   */
  _setSource(source, attribute) {
    if(attribute != undefined) {
      this.source = "attribute";
      this.attribute = attribute;
    } else if (this.radius != 0) {
      this.source = "config";      
    } else if (source == "gps_accuracy") {
      this.source = "attribute";
      this.attribute = "gps_accuracy";
    } else if (source == "radius") {
      this.source = "attribute";
      this.attribute = "radius";    
    } else {
      this.source = "auto";
    }
  }
  
}