# ELXR bottle models

Three original binary glTF 2.0 models built for this project; no generated images or external models are used for the collection.

- `arc-chamber.glb`: cylindrical glass energy chamber, machined collars and protective armature.
- `prism-flask.glb`: faceted flask with bronze braces, four fasteners and luminous frame.
- `aether-decanter.glb`: curved glass vessel, metal handles and a layered base.

Rebuild from the repository root with `node scripts/build-bottles.mjs`.

Each GLB has a named `Stopper` group for independent animation and a `LabelSurface` mesh for branding. Embedded PBR materials include Optical glass, Liquid, Energy, Brushed titanium, Machined edges and Aged bronze. Glass uses the glTF transmission/volume material extensions. The files are self-contained and can be imported into Blender or a glTF viewer.

The website adds six finish colors, original ELXR label textures, surface shaders, studio reflections, glow and pointer/keyboard animations in `components/bottles/BottleStage.tsx`. These live rendering effects are separate from the base geometry exported in the GLBs.
