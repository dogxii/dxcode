

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.CHA2_LFG.js","_app/immutable/chunks/D66y_u5B.js","_app/immutable/chunks/CB89wR3Z.js","_app/immutable/chunks/h4wf1p1O.js"];
export const stylesheets = ["_app/immutable/assets/0.BHsTiCFn.css"];
export const fonts = [];
