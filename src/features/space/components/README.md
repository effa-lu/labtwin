# Component library

- `registry.ts` — every preset: 8 parametric primitives + custom GLB models. Defaults, ranges, params, colour token, icon.
- `meshes/basic.tsx` — how each parametric primitive is drawn from dims + params.
- `CustomModel.tsx` — loads a .glb and fits it into dims. Modelling spec: `docs/models.md`.
