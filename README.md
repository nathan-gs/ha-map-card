# Home Assistant Map Card

Take a look at the blog post [introducing the custom:map-card for Home Assistant](https://nathan.gs/2024/01/06/ha-map-card-a-new-and-alternative-leaflet-based-map/). 

![An example of the custom:map-card](ha-map-card-pm25.png)

### Installation

#### Manual
1. Copy `map-card.js` to your `/var/lib/hass/www` folder.
2. Click on `Edit Dashboard`,  `Manage resources` add `/local/map-card.js` as `JavaScript Module`.

#### HACS

> ##### TIP
> The PR to add this to the default HACS repo is still open: https://github.com/hacs/default/pull/2377 

Follow the instructions to add a [HACS Custom Repository](https://hacs.xyz/docs/faq/custom_repositories/).

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

#### Options

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
| `tile_layer_url`         | https://tile.openstreetmap.org/{z}/{x}/{y}.png                                                                               | Override the default map source              |
| `tile_layer_attribution` | &amp;copy; &lt;a href&#x3D;&quot;http:&#x2F;&#x2F;www.openstreetmap.org&#x2F;copyright&quot;&gt;OpenStreetMap&lt;&#x2F;a&gt; | Set the correct map attribution              |
| `tile_layer_options` | {}                                                                                                                               | The `options` for the default [TileLayer](https://leafletjs.com/reference.html#tilelayer) |
| `history_date_selection` | false                                                                                                                        | Will link with a `energy-date-selection` on the page to provide an interactive  date range picker. |
| `theme_mode`          | auto                                  | `auto`, `light` or`dark`                                                                      |
| `debug` | false                                                                                                                        | Enable debug messages in console.


If `x` & `y` or `focus_entity` is not set it will take the lat/long from the __first entity__.



#### Entity options

Either the name of the `entity` or:
| name                  | Default                               | note                                                                                          |
|-----------------------|---------------------------------------|-----------------------------------------------------------------------------------------------|
| `entity`              |                                       | The entity id                                                                                 |
| `display`             | `marker`                              | `icon`, `state` or `marker`. `marker` will display the picture if available                   |
| `picture`             |                                     	| Set a custom picture to use on the marker.                                           			|
| `size`                | 48                                    | Size of the icon                                               								|
| `color`               | Random Color                          | Can defined as `red`, `rgb(255,0,0)`, `rgba(255,0,0,0.1)`, `#ff0000`, `var(--red-color)`      |
| `css`                 | `text-align: center; font-size: 60%;` | CSS for the marker (only for `state` and `marker`)                                            |
| `history_start`       |                                       | Will inherit from map config if not set. <br/>Date: `2022-03-01T12:00:00Z` <br/>Time code: `5 hours ago` <br/>Entity: `input_number.example_number`  <br/>See [History options](#history-options) for full details.  |
| `history_end`         | `now`                                 | Will inherit from map config if not set. <br/>Date: `2022-03-01T12:00:00Z` <br/>Time code: `5 hours ago` <br/>Entity: `input_number.example_number`  <br/>See [History options](#history-options) for full details.  |
| `history_line_color`  | Random Color                          | Can defined as `red`, `rgb(255,0,0)`, `rgba(255,0,0,0.1)`, `#ff0000`, `var(--red-color)`      |
| `history_show_lines`  | true                                  | Show the path                                                                                 |
| `history_show_dots`   | true                                  | Show little dots on the path                                                                  |
| `fixed_x`             |                                       | Display a fixed marker, this will ignore the latitude/longitude attributes                    |
| `fixed_y`             |                                       | Display a fixed marker, this will ignore the latitude/longitude attributes                    |
| `fallback_x`          |                                       | If the latitude/longitude is missing, use these fixed attributes                              |
| `fallback_y`          |                                       | If the latitude/longitude is missing, use these fixed attributes                              |


#### History options.

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

#### WMS and tile_layers options

| name      | note                                                                                                                                                        |
|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `url`     | The url of the layer                                                                                                                                        |
| `options` | The leaflet layer [WMS options](https://leafletjs.com/reference.html#tilelayer-wms) or [Tile Layer options](https://leafletjs.com/reference.html#tilelayer) |
| `history` | The name of the layer option which controls the dat, if it supports a date or time option. Set history to the name of this property. The `history_start` value, state or date range picker will then set this property on the layer and update it as necessary. |

###### Advanced WMS/Tile layer options.

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


#### Extra Tile Layers

The [leaflet-extras](https://github.com/leaflet-extras/leaflet-providers) has a nice list of available [tile layer providers](https://leaflet-extras.github.io/leaflet-providers/preview/).

### Development

`git clone git@github.com:nathan-gs/ha-map-card.git`

This project uses [devenv.sh](https://devenv.sh/).

1. Install devenv
2. `devenv shell` and then `watch` or `devenv shell watch` to immediatly drop into a watched shell.

#### NPM alternatives

* `npm install`
* `npm run build` (`npm run watch` to update on change)



### Mentions & Discussions

* [home-assistant community: map-card: a slightly improved map-card](https://community.home-assistant.io/t/map-card-a-slightly-improved-map-card/693088), this topic should be used for general discussions. 
* [nathan.gs: Map Card, a new leaflet based map with WMS and other advanced features](https://nathan.gs/2024/01/06/ha-map-card-a-new-and-alternative-leaflet-based-map/)
* [nathan.gs: Map Card, displaying Weather and Other Tile Layers](https://nathan.gs/2024/02/25/ha-map-card-displaying-weather-and-other-tilelayers/)

