import * as THREE from "three";

/** How much of the photographic facade texture shows through the stylized massing.
 *  0 = flat indigo silhouettes, 1 = the full textured city. */
export const CITY_TEXTURE_MIX = 0.15;

/** Shared clock for the glow animation; CityEffects advances it (and holds it for reduced motion). */
export const styleClock = { value: 0 };

/** Height of the blueprint scan line during the reveal. Stylized geometry above it is not drawn
 *  yet, and a hot band just below it glows where the wireframe has just turned solid.
 *  Parked far overhead whenever the city is fully built. */
export const scanLine = { value: 1e4 };

/** Blends a textured building material toward the stylized city: indigo massing shaded by
 *  height and face, a magenta rim on silhouettes, and a neon strip under a third of roofs.
 *  The facade texture and lit windows still read through at CITY_TEXTURE_MIX. Composes
 *  with any onBeforeCompile the material already has. */
export function stylize(material: THREE.Material, height: number) {
  const previous = material.onBeforeCompile.bind(material);
  const previousKey = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    shader.uniforms.uStyleHeight = { value: height };
    shader.uniforms.uTextureMix = { value: CITY_TEXTURE_MIX };
    shader.uniforms.uStyleTime = styleClock;
    shader.uniforms.uScan = scanLine;
    shader.vertexShader =
      "uniform float uStyleHeight;\nvarying vec3 vStyleWorld;\nvarying vec3 vStyleNormal;\nvarying float vStyleTop;\nvarying vec2 vStyleOrigin;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 styleWorld = vec4(transformed, 1.);
        vec3 styleNormal = objectNormal;
        float styleScale = 1.;
        vStyleOrigin = modelMatrix[3].xz;
        #ifdef USE_INSTANCING
          styleWorld = instanceMatrix * styleWorld;
          styleNormal = mat3(instanceMatrix) * styleNormal;
          styleScale = length(instanceMatrix[1].xyz);
          vStyleOrigin += instanceMatrix[3].xz;
        #endif
        styleWorld = modelMatrix * styleWorld;
        vStyleWorld = styleWorld.xyz;
        vStyleNormal = normalize(mat3(modelMatrix) * styleNormal);
        vStyleTop = uStyleHeight * styleScale * length(modelMatrix[1].xyz);`,
      );
    shader.fragmentShader =
      "uniform float uTextureMix;\nuniform float uStyleTime;\nuniform float uScan;\nvarying vec3 vStyleWorld;\nvarying vec3 vStyleNormal;\nvarying float vStyleTop;\nvarying vec2 vStyleOrigin;\n" +
      shader.fragmentShader.replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\n        if (vStyleWorld.y > uScan) discard;",
      ).replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        {
          vec3 n = normalize(vStyleNormal);
          vec3 v = normalize(cameraPosition - vStyleWorld);
          float seed = fract(sin(dot(vStyleOrigin, vec2(127.1, 311.7))) * 43758.5453);
          float rel = clamp(vStyleWorld.y / max(vStyleTop, .001), 0., 1.);
          vec3 base = mix(vec3(.002, .002, .010), vec3(.020, .016, .072), pow(rel, 1.3)) * (.8 + .4 * seed);
          float up = max(n.y, 0.);
          vec3 styled = base * (mix(abs(n.x) * .6 + abs(n.z), 1.5, up) + .1);
          // Halo: the silhouette rim breathes, and a soft band of light climbs each tower.
          float breathe = .75 + .35 * sin(uStyleTime * .9 + seed * 20.);
          float climb = smoothstep(.0, .5, 1. - abs(fract(vStyleWorld.y * .045 - uStyleTime * .06 - seed) - .5) * 2.);
          float rim = pow(1. - max(dot(n, v), 0.), 3.);
          styled += vec3(.16, .006, .11) * rim * (.2 + rel * .8) * breathe;
          styled += vec3(.05, .004, .05) * climb * climb * (1. - up) * rel;
          // Neon strip under a third of the rooflines, pulsing slowly out of step with its neighbours.
          float strip = step(.66, seed) * (1. - up) * smoothstep(.12, .06, abs(vStyleTop - .22 - vStyleWorld.y));
          float pulse = .7 + .5 * sin(uStyleTime * 1.6 + seed * 40.);
          styled += mix(vec3(.15, 1.1, 1.5), vec3(1.8, .08, 1.), step(.83, seed)) * strip * 2.2 * pulse;
          gl_FragColor.rgb = mix(styled, gl_FragColor.rgb, uTextureMix);
          // The freshly printed slice under the blueprint scan line runs hot amber.
          gl_FragColor.rgb += vec3(1.1, .36, .04) * exp(-(uScan - vStyleWorld.y) * 5.);
        }`,
      );
  };
  material.customProgramCacheKey = () => `${previousKey()}|stylized`;
  material.needsUpdate = true;
  return material;
}
