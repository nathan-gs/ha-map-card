# ha-map-card showcase

The item's are showcased at: [nathan.gs/ha-map-card](https://nathan.gs/ha-map-card/).

## Contributing

Create a PR with a new case. 

#### Create the contents
Put it under `showcase/NAME/README.md`. 

Add `front matter`a and content:

````markdown
---
title: Your title
authors:
  - your-github-username
---
A brief description of your showcase. 

![your first image](image.png)

Detailed description of your HA Map Card implementation, including:
- What the map shows (e.g., weather data, air quality, traffic).
- How you configured `ha-map-card` (e.g., WMS layers, custom entities).
- Any challenges or tips for others.

Optionally, add more images:
![Second Image](second-image.jpg)

Be sure to escape code blocks:
{% raw %}
```jinja
{% set test = true %}
```
{% endraw %}
````

The images go in the folder as well.

##### Authors

Following Frontmatter will work:

```yaml
authors:
- nathan-gs
- name: Nathan
  website: https://nathan.gs
- name: Nathan
  github: nathan-gs
- github: nathan-gs
- website: https://nathan.gs
```

In this case, we will have 5 authors.

#### Publishing

Once the PR is merged, nathan-gs will trigger an update on the website.