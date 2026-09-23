# Manhattan at night

Original glTF 2.0 architecture and street assets for ELXR. The scene uses actual
`.glb` meshes and PBR materials, with a shared local facade atlas. Buildings are
instanced by architectural family; each placement varies in height, footprint,
window proportions, and tint. Architectural surfaces include modeled mullions,
setbacks, parapets, mechanical equipment, water tanks, fire escapes, and shopfronts.

```sh
npm run models:city
```

The generator is `scripts/build-city.mjs`. No external models, decoder services,
or paid asset dependencies are needed at runtime. The checked-in facade texture
is required to rebuild and display these models. Model names and structural
groups remain available in the glTF scene graph for interactions.

Landmarks are architectural interpretations at an artistic scale, not surveyed
replicas. Empire State includes its stepped limestone massing and antenna;
One World Trade Center has eight triangular faces and a spire; One Vanderbilt
has receding volumes and observation floors; 30 Hudson Yards has a sloping crown
and a projecting triangular Edge deck. Times Square has its narrow tower,
rooftop ball, stacked advertising, and a separate pedestrian plaza.

Reference descriptions: [One World Trade Center, SOM](https://www.som.com/projects/one-world-trade-center/),
[Edge, KPF](https://www.kpf.com/project/edge),
[One Vanderbilt, KPF](https://www.kpf.com/news/kpf-designed-one-vanderbilt-tops-out-in-midtown-manhattan).

## Texture provenance

`public/textures/manhattan-facades.png` was generated with the built-in imagegen
tool and saved in the workspace. It is a texture on geometry, not a skyline
backdrop. The existing HDR reflection source is credited in
`public/textures/ATTRIBUTION.md`.

Final generation prompt:

> Create a production-ready square 2048x2048 photorealistic texture atlas for an actual interactive 3D model of Manhattan at night. EXACT layout: four equal 1024x1024 square facade tiles arranged in a precise 2 by 2 grid, no gutters, no borders, no text. Each tile is a perfectly flat straight-on orthographic architectural ELEVATION with no perspective, no converging verticals, NO roof, NO ground, NO sky, NO building silhouette, only a continuously repeating wall facade covering its entire quadrant. Top left: dark blue and teal reflective New York office curtain wall, exactly 8 columns of narrow rectangular glass windows and 8 floors. Top right: prewar warm grey limestone Art Deco facade with deep inset slender windows, exactly 8 columns and 8 floors. Bottom left: dark charcoal metal contemporary office facade, wider windows with subtle turquoise night reflections, exactly 8 columns and 8 floors. Bottom right: weathered brown brick Midtown residential facade with recessed windows and air conditioners, exactly 8 columns and 8 floors. Windows across all tiles are realistic uneven occupancy: about 25 percent have dim warm tungsten or cool white office light, 75 percent dark reflective blue grey glazing, all rooms subtly different with some desks, curtains, partial blinds, partitions. Tiny mullions, transoms, real scratches, patina, water marks, reflected neighboring towers. Colors dark and restrained, no saturated neon glowing outlines, no pure white overexposed windows. High-end photographic PBR game environment texture, V-Ray realism. Seamlessly tileable in each quadrant horizontally and vertically. No labels, people, signs, logos, or watermark. This is strictly a flat texture sheet, not a rendered city or a building.

The returned texture is 1254 × 1254; the atlas coordinates use normalized UVs.

## Inspection

`/city?p=1` provides the interactive scene with orbit, zoom, reset, and landmark
buttons. `/city?p=0` previews the overhead map. The main page retains the scroll
journey, reduced-motion preference, and WebGL fallback. The city controls also
support keyboard arrows and +/− when the canvas is focused.
