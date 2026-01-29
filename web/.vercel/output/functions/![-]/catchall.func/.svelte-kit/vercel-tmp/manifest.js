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
		client: {start:"_app/immutable/entry/start.Cv9aLkV6.js",app:"_app/immutable/entry/app.CZd694nv.js",imports:["_app/immutable/entry/start.Cv9aLkV6.js","_app/immutable/chunks/Bc6W3OmY.js","_app/immutable/chunks/CB89wR3Z.js","_app/immutable/chunks/uJhE-43j.js","_app/immutable/entry/app.CZd694nv.js","_app/immutable/chunks/CB89wR3Z.js","_app/immutable/chunks/gUqhtrSE.js","_app/immutable/chunks/D66y_u5B.js","_app/immutable/chunks/uJhE-43j.js","_app/immutable/chunks/oIqWK9ny.js","_app/immutable/chunks/h4wf1p1O.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
