I just wanted to share my config after creating a rainviewer overlay, and correcting the dark mode display with card mod.

I'll lay out the code first, then mention some hurdles I had, and how I worked around them.

Firstly, in your configuration.yaml, you'll need rest sensors to get the current frame, and previous frames from rainviewer:

```
rest:
  - resource: https://api.rainviewer.com/public/weather-maps.json
    scan_interval: 300  # Every 5 minutes
    sensor:
     - name: rainviewer_frame
       value_template: "{{ value_json.radar.nowcast[0].path }}"
     - name: rainviewer_frames
       value_template: "{{ value_json.radar.past[-10:] | map(attribute='path') | join(',') }}"
```

Adjust the value_json.radar.past[-10:] to suit your needs. I left it at -10 even though I only animate 5 frames (for resource purposes.)


Next, you'll need two helpers:

First, one that is the frame number index that will be changed via an automation:

input_number.rainviewer_frame_index
Minimum value: 0
Maximum value :10 <---- adjust for your needs, but it needs to be at least 1 more than configured in the automation
Step size: 1
Display Mode: Slider


Second, you'll need a template sensor

sensor.rainviewer_current_frame
```
{% set frames = states('sensor.rainviewer_frames').split(',') %}
          {% set idx = states('input_number.rainviewer_frame_index')|int(0) %}
          {{ frames[idx] if frames|length > idx else frames[-1] }}
```

Now, We need to create an automation to cycle the frames on the map:

```
alias: Cycle RainViewer Frames
triggers:
  - seconds: /1 # every 1 second. Adjust to your needs.
    trigger: time_pattern
conditions:  # This entire condition is optional. I do it to give the system a break and not keep cycling when no one will see it.
  - condition: time
    after: "06:00:00"
    before: "00:00:00"
actions:
  - target:
      entity_id: input_number.rainviewer_frame_index
    action: input_number.increment
    data: {}
  - if:
      - condition: numeric_state
        entity_id: input_number.rainviewer_frame_index
        above: 3 # When it hits 4 (which is the 5th frame), it will pause for the below delay, and restart. Adjust to change the # of frames animated, but keep it at least 1 less than input_number.rainviewer_frame_index.
    then:
      - delay: "00:00:05" # delay for the last frame.
      - target:
          entity_id: input_number.rainviewer_frame_index
        data:
          value: 0
        action: input_number.set_value
      - action: recorder.purge_entities # This entire action is optional, but I do it to not bloat the database. 
        data:
          keep_days: 0.05 # this keeps the last 1.2 hours (72 minutes) of history. I do this for debugging, but will probably reduce it.
          entity_id:
            - sensor.rainviewer_current_frame
            - input_number.rainviewer_frame_index
```


Lastly, the card itself. This is a stripped down anonymized version:

```
type: custom:map-card
focus_follow: none
theme_mode: light # Dark mode applies css filters to all layers and makes the rainmap layer look wrong.
tile_layer_options:
  maxZoom: 21
entities:
  - entity: person.user
    use_base_entity_only: true
    history_start: 6 hours ago
    color: blue
  - entity: device_tracker.user_phone
    size: 20
    color: darkblue
  - entity: zone.home
    circle: auto
    display: icon
    icon: mdi:home
    size: 25
    color: lightblue
tile_layers:
  - url: >-
      https://tilecache.rainviewer.com{{
      states('sensor.rainviewer_current_frame') }}/512/{z}/{x}/{y}/7/1_0.png # the /7/ in the url adjusts the coloring of the map
    options:
      opacity: 0.4
card_mod: # This inverts ONLY the openstreetmap layer. 
  style: |
    ha-card img.leaflet-tile[src*="tile.openstreetmap.org"] {
      filter: invert(1) hue-rotate(180deg);
    }


```


Many of the things I found I had mentioned in the notes. 

I will say, not purging the old data made homeassistant angry anytime I tried to view any of the sensors I created. The high update rate puts some stress on the system.

Some of my lower end clients aren't super happy with the map with the animation as I am using it in a dashboard in panel view. This is why I had to keep the animation slowish and limit the frames. Your experience will vary based on hardware. The old google nest hub display I have constantly casting dashboard is an example of a device that struggles pretty hard. It will often reboot if I leave the map card dashboard open.

I'm running homeassistant OS as a VM on a healthily configured Dell R730XD running proxmox and I was still experiencing some lag on the map until I added the purge to the automation.

If you don't want or need animation, All you would need to overlay the latest radar images is the first rest sensor:

```
rest:
  - resource: https://api.rainviewer.com/public/weather-maps.json
    scan_interval: 300  # Every 5 minutes
    sensor:
     - name: rainviewer_frame
       value_template: "{{ value_json.radar.nowcast[0].path }}"
```

then adjust the card yaml and add this:

```
tile_layers:
  - url: >-
      https://tilecache.rainviewer.com{{
      states('sensor.rainviewer_frame') }}/512/{z}/{x}/{y}/7/1_0.png
    options:
      opacity: 0.4
```


Here is how it looks:

![Image](https://github.com/user-attachments/assets/4c93f9da-7f15-478e-bb37-75c0b933d001)


I tried getting a traffic overlay on the map as well, but I gave up at the point where I realized I'd probably have to pay for an API to do so. If anyone has any suggestions, I'd love to hear them!
