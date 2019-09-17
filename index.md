---
---

# Taopa: turmites and other pixel art

{% for f in site.static_files %}
`{{f.name}}`:

  * `Path`: [.{{f.path}}]
  * `Mod.`: {{f.modified_time}}

{% endfor %}
