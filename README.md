# Home Assistant Map Card

Take a look at the blog post [introducing the custom:map-card for Home Assistant](https://nathan.gs/2024/01/06/ha-map-card-a-new-and-alternative-leaflet-based-map/). 

![An example of the custom:map-card](ha-map-card-pm25.png)

### Installation

#### HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=nathan-gs&repository=ha-map-card&category=plugin)

#### Manual
1. Copy `map-card.js` to your `/var/lib/hass/www` folder.
2. Click on `Edit Dashboard`,  `Manage resources` add `/local/map-card.js` as `JavaScript Module`.

### Usage

> #### TIP
>
> Home Assistant contains a [native map](https://www.home-assistant.io/dashboards/map/) feature, if you don't need advanced features like WMS layers it might be a better choice.

#### Minimal
```yaml
type: custom:map-card
x: 51.23
y: 3.652
```

#### More advanced

> ##### TIP
> 
> Take a look at:
> https://nathan.gs/2024/01/06/ha-map-card-a-new-and-alternative-leaflet-based-map/#a-more-advanced-example-measuring-pm25-air-quality-for-my-home 

### Options

| name                     | Default                                                                                                                      | note                                         |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| `x`                      |                                                                                                                              | Longitude                                    |
| `y`                      |                                                                                                                              | Latitude                                     |
| `history_start`          |                                       																						  | Date: `2022-03-01T12:00:00Z` <br/>Time code: `5 hours ago` <br/>Entity: `input_number.example_number`  <br/>See [History options](#history-options) for full details.  |
| `history_end`            | `now`                                 																						  | Date: `2022-03-01T12:00:00Z` <br/>Time code: `5 hours ago` <br/>Entity: `input_number.example_number`  <br/>See [History options](#history-options) for full details. |
| `focus_entity`           |                                                                                                                              | Entity to focus on. Map will default to show all markers if this and X/Y are not set.        |
| `title`                  |                                                                                                                              | If empty, don't show a title                 |
| `zoom`                   | 12                                                                                                                           | The zoom level. Ignored unless focus_entity or X & Y coords are set.                               |
| `card_size`              | 5                                                                                                                            | The Home Assistant card size                 |
| `entities`               | []                                                                                                                           | Array of entities, will be listed as markers |
| `wms`                    | []                                                                                                                           | WMS Layers, an array of `WMS` see below      |
| `tile_layers`            | []                                                                                                                           | Tile Layers, an array of `Tile Layers` see below      |
| `tile_layer_url`         | https://tile.openstreetmap.org/{z}/{x}/{y}.png or `https://tile.example.com/{{states('sensor.test') }}/{z}/{x}/{y}.png`      | Override the default map source, the url supports entity lookups. See [URL Entity lookup](#url-entity-lookup).            |
| `tile_layer_attribution` | &amp;copy; &lt;a href&#x3D;&quot;http:&#x2F;&#x2F;www.openstreetmap.org&#x2F;copyright&quot;&gt;OpenStreetMap&lt;&#x2F;a&gt; | Set the correct map attribution              |
| `tile_layer_options` | {}                                                                                                                               | The `options` for the default [TileLayer](https://leafletjs.com/reference.html#tilelayer) |
| `history_date_selection` | false                                                                                                                        | Will link with a `energy-date-selection` on the page to provide an interactive  date range picker. |
| `theme_mode`          | auto                                  | `auto`, `light` or`dark`                                                                      |
| `focus_follow`        | none                                  | `none`, `refocus`, `contains`, reset the map focused entity's, on each update. Some people call this the `Autofit` feature.                                                              |
| `map_options`          | {}                                                                                                                           | The `options` for the default [Leaflet Map](https://leafletjs.com/reference.html#map) |
| `debug` | false                                                                                                                        | Enable debug messages in console.
| `plugins`            | []                                                                                                                           | An array of plugin definitions, see: [Plugin Options](#plugin-options), [Available plugins](#available-plugins) and [Developing plugins](#developing-plugins)     |


If `x` & `y` or `focus_entity` is not set it will take the lat/long from the __first entity__.

### URL Entity lookup

You can add dynamic url's, for example to use a sensor value in the url. When the parameter changes, the map will redraw with the new tile layer.
```
tile_layer_url: https://tile.example.com/{{states('sensor.test') }}/{z}/{x}/{y}.png
```

> ##### TIP
>
> It only supports `states` without any filters, this is a crude javascript regex based implementation, not the Jinja2 templating engine from Home Assistant.


### Entity options

Either the name of the `entity` or:
| name                   | Default                               | note                                                                                          |
|------------------------|---------------------------------------|-----------------------------------------------------------------------------------------------|
| `entity`               |                                       | The entity id                                                                                 |
| `display`              | `marker`                              | `icon`, `state`, `attribute` or `marker`. <br/>`marker` will display the picture if available. <br/>`icon` will display the icon if available, otherwise a label composed of first letters of the entity's name |
| `picture`              |                                       | Set a custom picture to use on the marker.                                                    |
| `icon`                 |                                       | Set a custom icon to use if `display` is set to `icon`. e.g. `mdi:cake`                           |
| `attribute`            |                                       | Set an attribute to use if `display` is set to `attribute`. e.g. `speed`                |
| `prefix`            |                                       | Optional prefix for a value if `display` is set to `attribute`                |
| `suffix`            |                                       | Optional suffix for a value if `display` is set to `attribute`                |
| `size`                 | 48                                    | Size of the icon                                                                              |
| `color`                | Random Color                          | Can defined as `red`, `rgb(255,0,0)`, `rgba(255,0,0,0.1)`, `#ff0000`, `var(--red-color)`      |
| `css`                  | `text-align: center; font-size: 60%;` | CSS for the marker (only for `state` and `marker`)                                            |
| `history_start`        |                                       | Will inherit from map config if not set. <br/>Date: `2022-03-01T12:00:00Z` <br/>Time code: `5 hours ago` <br/>Entity: `input_number.example_number`  <br/>See [History options](#history-options) for full details. |
| `history_end`          | `now`                                 | Will inherit from map config if not set. <br/>Date: `2022-03-01T12:00:00Z` <br/>Time code: `5 hours ago` <br/>Entity: `input_number.example_number`  <br/>See [History options](#history-options) for full details. |
| `history_line_color`   | Random Color                          | Can defined as `red`, `rgb(255,0,0)`, `rgba(255,0,0,0.1)`, `#ff0000`, `var(--red-color)`      |
| `history_show_lines`   | true                                  | Show the path                                                                                 |
| `history_show_dots`    | true                                  | Show little dots on the path                                                                  |
| `fixed_x`              |                                       | Display a fixed marker, this will ignore the latitude/longitude attributes                    |
| `fixed_y`              |                                       | Display a fixed marker, this will ignore the latitude/longitude attributes                    |
| `fallback_x`           |                                       | If the latitude/longitude is missing, use these fixed attributes                              |
| `fallback_y`           |                                       | If the latitude/longitude is missing, use these fixed attributes                              |
| `tap_action`           | {"action": "more-info"}               | Allow custom action to be triggered when this entity is clicked. Actions include `more-info`, `call-service`, `navigate`, `url`, `assist`, `none`. Some actions require additional paramaters. `navigate` requires a `navigation_path`. `url` requires a `url_path`. `call-service` requires `service` and an optional `data`|
| `gradual_opacity`      |                                       | The total amount of opacity will be gradually distributed across the paths. `gradual_opacity` is divided by the number of paths to calculate the opacity step for each path. The base opacity is generated by (1 - `gradual_opacity`), and as each path progresses, its opacity gradually darkens by the step amount.|
| `focus_on_fit`         | true                                  | If this variable is set to false, This entity will be excluded when the map fits the included entities on the screen.|
| `z_index_offset`       | 1                                     | z-index value that determines what is displayed on top when markers overlap. (Setting a gap of at least 20 between the values assigned to each entity is recommended.) |
| `use_base_entity_only` | false                                 | When set to `true`, the tracking will use only the base entity without including any associated device trackers. This is useful for scenarios where you want to track the base entity directly and ignore any associated trackers. |
| `circle`               |                                       | Display a circle around the marker. <br/>More details [Circle options](#circle-options) |
| `geojson`              |                                       | Display GeoJSON data from an entity attribute. <br/>More details [GeoJSON options](#geojson-options) |

### History options

If `history_date_selection:true`, any entities that do not define their own `history_start` and `history_end` configuration will be automatically linked to this. Please ensure a card of `type: energy-date-selection`  exists on the page before enabling this.

This can be added via the "Add Card" dialog by selecting Manual and entering the text `type: energy-date-selection`.

Alternatively `history_start` and `history_end` can be set to 
* A specific date such as  `2022-03-01T12:00:00Z`
* A time code such as `10 days ago` `4 hours ago` `1 week ago` etc.
* An entity that will provide either a `date` or `number` (which will be used as the amount of hours ago to show). e.g. `input_number.example_number_value` 

If you want to specify your own unit, configure the `history_start`/`history_end` as the below.
```
history_start:
  entity: input_number.example_number_value
  suffix: days ago
```

Each entity can individually override the base config by setting its own `history_start`/`history_end`, using any of the options above.
Any entity without its own settings will inherit the map level config.

### Circle options

Display a circle around the marker. It can either be called with the string `auto` or following options.

`circle: auto`

| name         | Default | note                                                                                         |
|--------------|---------|----------------------------------------------------------------------------------------------|
| `source`     |         | Where to get the radius from, see below for options.       |
| `attribute`  |         | The attribute to use for the radius (in case of `source: attribute`).         |
| `radius`     |         | Radius in meters (in case of `source: config`)(optional)                                                                            |
| `color`      |         | Color of the circle (will use the entity color if not set)                                                                          |
| `fill_opacity`| 0.2     | Opacity of the fill color                                                                    |

Source
* `auto` - Will use the `gps_accuracy`, then the `radius` attribute from the entity if available, otherwise will use the `radius` set in the config.
* `gps_accuracy` - Will use the `gps_accuracy` attribute from the entity.
* `radius` - Will use the `radius` attribute from the entity.
* `config` - Will use the `radius` set in the config.
* `attribute` - Will use the `attribute` set in the config.

### GeoJSON options

Display GeoJSON data from an entity attribute. This is useful for displaying zones, areas, routes, or any geographic data stored as GeoJSON in your Home Assistant entities.

The `geojson` option can be configured in several ways:

**Simple usage (uses default attribute name `geo_location`):**
```yaml
geojson: true
```

**Specify a custom attribute name:**
```yaml
geojson: zone_geojson
```

**Full configuration:**
```yaml
geojson:
  attribute: zone_geojson
  color: '#FF5733'
  weight: 3
  opacity: 1.0
  fill_opacity: 0.2
  hide_marker: false
```

| name           | Default        | note                                                                                         |
|----------------|----------------|----------------------------------------------------------------------------------------------|
| `attribute`    | `geo_location` | The entity attribute containing the GeoJSON data                                             |
| `color`        | Entity color   | Color for the GeoJSON features (lines and fills)                                             |
| `weight`       | 3              | Line weight for GeoJSON features                                                             |
| `opacity`      | 1.0            | Opacity of lines                                                                             |
| `fill_opacity` | 0.2            | Opacity of filled areas                                                                      |
| `hide_marker`  | false          | When set to `true`, hides the default entity marker and only displays the GeoJSON           |

**Supported GeoJSON types:**
- Point, MultiPoint
- LineString, MultiLineString
- Polygon, MultiPolygon
- GeometryCollection
- Feature, FeatureCollection

**Example entity configuration:**
```yaml
entities:
  - entity: sensor.my_zone
    geojson:
      attribute: zone_data
      color: '#3388ff'
      fill_opacity: 0.3
      hide_marker: true
```

The GeoJSON data in the entity attribute can be either:
- A JSON string: `'{"type": "Polygon", "coordinates": [[[0,0], [1,0], [1,1], [0,1], [0,0]]]}'`
- A parsed JSON object (if your integration provides it that way)

**Interactive Features:**
- GeoJSON zones are **clickable** - clicking on any GeoJSON feature will show the entity's more-info dialog (or trigger the configured `tap_action`)
- If the GeoJSON Feature or FeatureCollection includes properties, they will be displayed in tooltips when hovering over the features

### WMS and tile_layers options

| name      | note                                                                                                                                                        |
|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `url`     | The url of the layer, see [URL Entity lookup](#url-entity-lookup).                                                                                          |
| `options` | The leaflet layer [WMS options](https://leafletjs.com/reference.html#tilelayer-wms) or [Tile Layer options](https://leafletjs.com/reference.html#tilelayer) |
| `history` | The name of the layer option which controls the dat, if it supports a date or time option. Set history to the name of this property. The `history_start` value, state or date range picker will then set this property on the layer and update it as necessary. |

#### Zooming & `tile_layer_options.maxZoom`

By default the map-card will not zoom beyond [default property of the `maxZoom`](https://leafletjs.com/reference.html#tilelayer-maxzoom) of the tilelayer, the default is `18`, but it can be overriden as follows:

```
type: custom:map-card
tile_layer_options:
  maxZoom: 20
```

Keep in mind that the tile layer source also has a maximum zoom level, which is `20` for most OSM maps.

#### Advanced WMS/Tile layer options

More complex use of the WMS/Tile history property can be configured within the history property of the layer.
* `property` is the option this should control (often named `time` or `date`)
* `source` defaults to auto (which means it will inherit from the main map settings). Set this to a date or number entity if this is different.
* `suffix` days ago/weeks ago as with other history entities
* `force_midnight` some WMS/Tile layers only work if the date is set as midnight.

```
  history:
    property: time
    source: input_number.test_number_value
    suffix: months ago
    force_midnight: true
```

### Plugin options
| name      | note                                                                                                                                                        |
|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `name`  | Mandatory, a helpful name for this instance of the plugin. Useful for debugging issues. |
| `url`     | The url of the plugin, if the plugin is in the file `/var/lib/hass/www/SomePlugin.js` , then this would be `./local/SomePlugin.js`. |
| `hacs.module` | The HACS module from which the plugin must be loaded if `url` is not set. |
| `hacs.file` | The file within the module from which the plugin must be loaded if `url is not set. |
| `options` | Options for configuring the plugin |

The `url` option is used when set.
If the `url` is not set and the `hacs` object is, the plugin will be loaded from the [HACS plugin](https://hacs.xyz/docs/publish/plugin/) with the given name and given filename.


#### Example config with plugin
```yaml
type: custom:map-card
x: -25.3744
y: 133.7751
plugins:
  - name: plugin
    url: /local/my-plugin.js
    options:
      some_option: true
  - name: another_instance
    url: /local/my-plugin.js
    options:
      some_option: false
```

#### Available Plugins
| name      | description                                                                                         |
|-----------|-----------------------------------------------------------------------------------------------------|
| [`bom-radar`](https://github.com/bezmi/ha-map-card-plugin-bom-radar) | Displays the Australian BoM rainfall radar for the past 90 minutes and the radar forecast for the next 90 minutes as an overlay on the map. | 
| [`buienradar`](https://github.com/Kevinjil/ha-map-card-buienradar) | Displays `buienradar.nl` as an overlay on the map | 

You can find more plugins using the [ha-map-card-plugin](https://github.com/topics/ha-map-card-plugin) topic.

## Extra Tile Layers

The [leaflet-extras](https://github.com/leaflet-extras/leaflet-providers) has a nice list of available [tile layer providers](https://leaflet-extras.github.io/leaflet-providers/preview/).

## Development

`git clone git@github.com:nathan-gs/ha-map-card.git`

This project uses [devenv.sh](https://devenv.sh/).

1. Install devenv
2. `devenv shell` and then `watch` or `devenv shell watch` to immediatly drop into a watched shell.

### NPM alternatives

* `npm install`
* `npm run build` (`npm run watch` to update on change)

### Developing Plugins
* All plugins should implement the `Plugin` class. See [`Plugin.js`](./src/models/Plugin.js) and [`Plugin.d.ts`](./src/models/Plugin.d.ts).
* For a concrete example, see [`CircleTestPlugin.js`](./plugins/CircleTestPlugin.js).
* Typescript example: see [bezmi/ha-map-card-plugin-bom-radar](https://github.com/bezmi/ha-map-card-plugin-bom-radar).
* For an example HACS plugin installation: see [`buienradar`](https://github.com/Kevinjil/ha-map-card-buienradar).

Tag your Github repo with [ha-map-card-plugin](https://github.com/topics/ha-map-card-plugin) for discoverability.


## Mentions & Discussions

* [home-assistant community: map-card: a slightly improved map-card](https://community.home-assistant.io/t/map-card-a-slightly-improved-map-card/693088), this topic should be used for general discussions. 
* [nathan.gs: Map Card, a new leaflet based map with WMS and other advanced features](https://nathan.gs/2024/01/06/ha-map-card-a-new-and-alternative-leaflet-based-map/)
* [nathan.gs: Map Card, displaying Weather and Other Tile Layers](https://nathan.gs/2024/02/25/ha-map-card-displaying-weather-and-other-tilelayers/)
* [userbag.co.uk: Home Assistant Exploring location history](https://userbag.co.uk/development/home-assistant-exploring-location-history/)
* [leaflet.js: third party plugins](https://leafletjs.com/plugins.html#3rd-party-integration)

### Showcase

We have a gallery of nice examples at [nathan.gs/ha-map-card](https://nathan.gs/ha-map-card/), contributions are welcome, check the [showcase/README.md](showcase/README.md).