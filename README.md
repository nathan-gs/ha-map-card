# Home Assistant Map Card

Take a look at the blog post [introducing the custom:map-card for Home Assistant](https://nathan.gs/2024/01/06/ha-map-card-a-new-and-alternative-leaflet-based-map/). 

![An example of the custom:map-card](ha-map-card-pm25.png)

> #### WARNING
> 
> This is still very early alpha quality.

### Installation

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
'y': 3.652
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
| `tile_layer_url`         | https://tile.openstreetmap.org/{z}/{x}/{y}.png                                                                               | Override the default map source              |
| `tile_layer_attribution` | &amp;copy; &lt;a href&#x3D;&quot;http:&#x2F;&#x2F;www.openstreetmap.org&#x2F;copyright&quot;&gt;OpenStreetMap&lt;&#x2F;a&gt; | Set the correct map attribution              |

Either the `x` & `y` or the `focus_entity` needs to be set.

`WMS` options

| name      | note                                                                            |
|-----------|---------------------------------------------------------------------------------|
| `url`     | The url of the layer                                                            |
| `options` | The leaflet layer [options](https://leafletjs.com/reference.html#tilelayer-wms) |


