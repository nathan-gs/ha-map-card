# Home Assistant Map Card

> #### WARNING
> 
> This is still very early alpha quality.

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

#### Options

| name                   | note |
| -----------            | ----------- |
| `x`      | Longitude |
| `y`   | Latitude        |
| `zoom` | The zoom level |
| `card_size` | The Home Assistant card size |
| `entities`  | Array of entities, will be listed as markers |
| `wms`         | WMS Layers, an array of `WMS` see below |

`WMS` options

| name                  | note |
|-----------------------|------|
| `url`                 | The url of the layer |
| `options`             | The leaflet layer [options](https://leafletjs.com/reference.html#tilelayer-wms) |

