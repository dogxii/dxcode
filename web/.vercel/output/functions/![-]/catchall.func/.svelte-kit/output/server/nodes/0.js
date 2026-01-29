

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BihpRyWa.js","_app/immutable/chunks/DJZ9pY1Y.js","_app/immutable/chunks/BfU-SR_P.js","_app/immutable/chunks/vy3UjScA.js"];
export const stylesheets = ["_app/immutable/assets/0.BHsTiCFn.css"];
export const fonts = [];
