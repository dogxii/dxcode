export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.y0bcKD_k.js",app:"_app/immutable/entry/app.D0sxakDK.js",imports:["_app/immutable/entry/start.y0bcKD_k.js","_app/immutable/chunks/JNqvVHYd.js","_app/immutable/chunks/ESP3iqtt.js","_app/immutable/chunks/DHDO6MWi.js","_app/immutable/entry/app.D0sxakDK.js","_app/immutable/chunks/ESP3iqtt.js","_app/immutable/chunks/CYpoGLy8.js","_app/immutable/chunks/ssb-fEff.js","_app/immutable/chunks/DHDO6MWi.js","_app/immutable/chunks/w5QO-qOe.js","_app/immutable/chunks/CcRiD6w9.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
