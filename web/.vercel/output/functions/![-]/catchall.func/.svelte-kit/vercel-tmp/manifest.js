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
		client: {start:"_app/immutable/entry/start.D00ep0T8.js",app:"_app/immutable/entry/app.BQlAR1Um.js",imports:["_app/immutable/entry/start.D00ep0T8.js","_app/immutable/chunks/Dl2hJ7pb.js","_app/immutable/chunks/BfU-SR_P.js","_app/immutable/chunks/BzzkJGNb.js","_app/immutable/entry/app.BQlAR1Um.js","_app/immutable/chunks/BfU-SR_P.js","_app/immutable/chunks/cijIjJqi.js","_app/immutable/chunks/DJZ9pY1Y.js","_app/immutable/chunks/BzzkJGNb.js","_app/immutable/chunks/ByKlfcM1.js","_app/immutable/chunks/vy3UjScA.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js'))
		],
		remotes: {
			
		},
		routes: [
			
		],
		prerendered_routes: new Set(["/"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
