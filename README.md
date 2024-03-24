# Home Assistant Map Card

Take a look at the blog post [introducing the custom:map-card for Home Assistant](https://nathan.gs/2024/01/06/ha-map-card-a-new-and-alternative-leaflet-based-map/). 

![An example of the custom:map-card](ha-map-card-pm25.png)

> #### WARNING
> 
> This is still very early alpha quality.

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
| `focus_entity`           |                                                                                                                              | Entity to focus on (instead of X & Y)        |
| `title`                  |                                                                                                                              | If empty, don't show a title                 |
| `zoom`                   | 12                                                                                                                           | The zoom level                               |
| `card_size`              | 5                                                                                                                            | The Home Assistant card size                 |
| `entities`               | []                                                                                                                           | Array of entities, will be listed as markers |
| `wms`                    | []                                                                                                                           | WMS Layers, an array of `WMS` see below      |
| `tile_layers`            | []                                                                                                                           | Tile Layers, an array of `Tile Layers` see below      |
| `tile_layer_url`         | https://tile.openstreetmap.org/{z}/{x}/{y}.png                                                                               | Override the default map source              |
| `tile_layer_attribution` | &amp;copy; &lt;a href&#x3D;&quot;http:&#x2F;&#x2F;www.openstreetmap.org&#x2F;copyright&quot;&gt;OpenStreetMap&lt;&#x2F;a&gt; | Set the correct map attribution              |
| `tile_layer_options` | {}                                                                                                                               | The `options` for the default [TileLayer](https://leafletjs.com/reference.html#tilelayer) |


If `x` & `y` or `focus_entity` is not set it will take the lat/long from the __first entity__.

###### `entities` options

Either the name of the `entity` or:
| name      | Default           | note                                                                          |
|-----------|-------------------|-------------------------------------------------------------------------------|
| `entity`  |                   | The entity id                                                                 |
| `display` | `marker`          | Either `icon` or `marker`. `marker` will display the picture if available     |
| `size`    | 24                | Size of the icon (not supported for `marker`)                                 |

###### `WMS` and `tile_layers` options

| name      | note                                                                                                                                                        |
|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `url`     | The url of the layer                                                                                                                                        |
| `options` | The leaflet layer [WMS options](https://leafletjs.com/reference.html#tilelayer-wms) or [Tile Layer options](https://leafletjs.com/reference.html#tilelayer) |


##### Extra Tile Layers

The [leaflet-extras](https://github.com/leaflet-extras/leaflet-providers) has a nice list of available [tile layer providers](https://leaflet-extras.github.io/leaflet-providers/preview/).

### Mentions & Discussions

* [home-assistant community: map-card: a slightly improved map-card](https://community.home-assistant.io/t/map-card-a-slightly-improved-map-card/693088), this topic should be used for general discussions. 
* [nathan.gs: Map Card, a new leaflet based map with WMS and other advanced features](https://nathan.gs/2024/01/06/ha-map-card-a-new-and-alternative-leaflet-based-map/)
* [nathan.gs: Map Card, displaying Weather and Other Tile Layers](https://nathan.gs/2024/02/25/ha-map-card-displaying-weather-and-other-tilelayers/)

