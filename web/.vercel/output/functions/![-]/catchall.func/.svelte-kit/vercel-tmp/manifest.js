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
		client: {start:"_app/immutable/entry/start.C7nNUB5t.js",app:"_app/immutable/entry/app.BeyI_d1p.js",imports:["_app/immutable/entry/start.C7nNUB5t.js","_app/immutable/chunks/y_RvwbGj.js","_app/immutable/chunks/DCYk9I7Y.js","_app/immutable/chunks/B57Yf1yB.js","_app/immutable/entry/app.BeyI_d1p.js","_app/immutable/chunks/DCYk9I7Y.js","_app/immutable/chunks/Ccxja10T.js","_app/immutable/chunks/DGFekU3Z.js","_app/immutable/chunks/B57Yf1yB.js","_app/immutable/chunks/B_q5yoId.js","_app/immutable/chunks/BJJlB8Nq.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
