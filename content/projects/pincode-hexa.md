---
title: "Pincode Hexa"
date: 2025-06-01
href: "https://github.com/hfactor/pincode-map"
cover: "/img/projects/pincode-hexa.png"
tagline: "Every Indian pincode is also a color. Here's the whole country."
icon: "/img/projects/pincode-hexa.svg"
category: "Craft"
collaborators: null
---

While filling out an address form, I accidentally typed a hash before the pincode. On screen it rendered as a hex color. That small mistake triggered a thought: every Indian pincode is six digits, which means every one of them is also a valid hex color. What would a map of India look like if each region was painted using its own pincode?

Perplexity pointed me to pincode boundary data on data.gov.in. Three prompts in Claude and I had a basic visual running with Leaflet JS. The zoomed out version wasn't readable with 19,000+ paths rendering at once, so I switched to QGIS for a cleaner render. The result was 19,311 post offices, 19,311 unique pincodes, 19,311 colors. Warm tones across the south, cooler shades in the north. Nobody chose the palette. The postal system did.
