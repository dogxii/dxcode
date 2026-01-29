import { d as Aa, s as b } from "../chunks/CYpoGLy8.js";
import {
	at as _a,
	au as ba,
	az as Ca,
	b as ca,
	M as Da,
	P as d,
	ao as da,
	L as de,
	ax as Ea,
	ar as fa,
	av as g,
	ap as ga,
	F as h,
	k as ha,
	e as I,
	d as Ie,
	N as i,
	K as ka,
	h as M,
	ay as Ma,
	R as ma,
	ag as Ne,
	i as na,
	aq as pa,
	a7 as R,
	t as Re,
	O as r,
	aw as U,
	c as Ue,
	w as ua,
	W as va,
	as as wa,
	q as xa,
	u as ya,
} from "../chunks/ESP3iqtt.js";
import { a as _, d as q, c as ra, f as X } from "../chunks/ssb-fEff.js";
import { i as W } from "../chunks/w5QO-qOe.js";

function Sa(e, l) {
	let a = null,
		t = M;
	var s;
	if (M) {
		a = ha;
		for (
			var o = ua(document.head);
			o !== null && (o.nodeType !== va || o.data !== e);
		)
			o = Ne(o);
		if (o === null) Ie(!1);
		else {
			var n = Ne(o);
			o.remove(), Ue(n);
		}
	}
	M || (s = document.head.appendChild(na()));
	try {
		ca(() => l(s), da);
	} finally {
		t && (Ie(!0), Ue(a));
	}
}
const We = [
	...`
\r\f \v\uFEFF`,
];
function Ba(e, l, a) {
	var t = e == null ? "" : "" + e;
	if (a) {
		for (var s in a)
			if (a[s]) t = t ? t + " " + s : s;
			else if (t.length)
				for (var o = s.length, n = 0; (n = t.indexOf(s, n)) >= 0; ) {
					var c = n + o;
					(n === 0 || We.includes(t[n - 1])) &&
					(c === t.length || We.includes(t[c]))
						? (t = (n === 0 ? "" : t.substring(0, n)) + t.substring(c + 1))
						: (n = c);
				}
	}
	return t === "" ? null : t;
}
function ve(e, l, a, t, s, o) {
	var n = e.__className;
	if (M || n !== a || n === void 0) {
		var c = Ba(a, t, o);
		(!M || c !== e.getAttribute("class")) &&
			(c == null ? e.removeAttribute("class") : (e.className = c)),
			(e.__className = a);
	} else if (o && s !== o)
		for (var w in o) {
			var p = !!o[w];
			(s == null || p !== !!s[w]) && e.classList.toggle(w, p);
		}
	return o;
}
const Xa = Symbol("is custom element"),
	Ta = Symbol("is html");
function Ha(e, l, a, t) {
	var s = ja(e);
	M && (s[l] = e.getAttribute(l)),
		s[l] !== (s[l] = a) &&
			(a == null
				? e.removeAttribute(l)
				: typeof a != "string" && La(e).includes(l)
					? (e[l] = a)
					: e.setAttribute(l, a));
}
function ja(e) {
	return (
		e.__attributes ??
		(e.__attributes = {
			[Xa]: e.nodeName.includes("-"),
			[Ta]: e.namespaceURI === ga,
		})
	);
}
var Oe = new Map();
function La(e) {
	var l = e.getAttribute("is") || e.nodeName,
		a = Oe.get(l);
	if (a) return a;
	Oe.set(l, (a = []));
	for (var t, s = e, o = Element.prototype; o !== s; ) {
		t = fa(s);
		for (var n in t) t[n].set && a.push(n);
		s = pa(s);
	}
	return a;
}
function Va(e, l, a = l) {
	var t = new WeakSet();
	wa(e, "input", async (s) => {
		var o = s ? e.defaultValue : e.value;
		if (
			((o = he(e) ? ue(o) : o),
			a(o),
			I !== null && t.add(I),
			await _a(),
			o !== (o = l()))
		) {
			var n = e.selectionStart,
				c = e.selectionEnd,
				w = e.value.length;
			if (((e.value = o ?? ""), c !== null)) {
				var p = e.value.length;
				n === c && c === w && p > w
					? ((e.selectionStart = p), (e.selectionEnd = p))
					: ((e.selectionStart = n), (e.selectionEnd = Math.min(c, p)));
			}
		}
	}),
		((M && e.defaultValue !== e.value) || (xa(l) == null && e.value)) &&
			(a(he(e) ? ue(e.value) : e.value), I !== null && t.add(I)),
		ma(() => {
			var s = l();
			if (e === document.activeElement) {
				var o = ba ?? I;
				if (t.has(o)) return;
			}
			(he(e) && s === ue(e.value)) ||
				(e.type === "date" && !s && !e.value) ||
				(s !== e.value && (e.value = s ?? ""));
		});
}
function he(e) {
	var l = e.type;
	return l === "number" || l === "range";
}
function ue(e) {
	return e === "" ? null : +e;
} /**
 * DX Encoding - 由 Dogxi 创造的独特编码算法
 *
 * TypeScript 实现 - 用于 dxc.dogxi.me 网站
 *
 * @author Dogxi
 * @version 1.0.0
 * @license MIT
 */
const E = "DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_",
	k = 68,
	C = "dx",
	x = "=",
	B = {};
for (let e = 0; e < E.length; e++) B[E[e]] = e;
function Na(e) {
	return new TextEncoder().encode(e);
}
function Ia(e) {
	return new TextDecoder("utf-8").decode(e);
}
class z extends Error {
	constructor(l) {
		super(l), (this.name = "DxEncodingError");
	}
}
function Ua(e) {
	let l;
	if (typeof e == "string") l = Na(e);
	else if (e instanceof Uint8Array) l = e;
	else if (Array.isArray(e)) l = new Uint8Array(e);
	else throw new z("输入必须是字符串、Uint8Array 或数字数组");
	if (l.length === 0) return C;
	let a = "";
	const t = l.length;
	for (let s = 0; s < t; s += 3) {
		const o = l[s],
			n = s + 1 < t ? l[s + 1] : 0,
			c = s + 2 < t ? l[s + 2] : 0,
			w = (o >> 2) & 63,
			p = (((o & 3) << 4) | (n >> 4)) & 63,
			y = (((n & 15) << 2) | (c >> 6)) & 63,
			D = c & 63;
		(a += E[(w ^ k) & 63]),
			(a += E[(p ^ k) & 63]),
			s + 1 < t ? (a += E[(y ^ k) & 63]) : (a += x),
			s + 2 < t ? (a += E[(D ^ k) & 63]) : (a += x);
	}
	return C + a;
}
function Ra(e, l = { asString: !0 }) {
	if (!e || !e.startsWith(C)) throw new z("无效的 DX 编码：缺少 dx 前缀");
	const a = e.slice(C.length);
	if (a.length === 0) return l.asString ? "" : new Uint8Array(0);
	if (a.length % 4 !== 0) throw new z("无效的 DX 编码：长度不正确");
	let t = 0;
	a.endsWith(x + x) ? (t = 2) : a.endsWith(x) && (t = 1);
	const s = (a.length / 4) * 3 - t,
		o = new Uint8Array(s);
	let n = 0;
	for (let c = 0; c < a.length; c += 4) {
		const w = a[c],
			p = a[c + 1],
			y = a[c + 2],
			D = a[c + 3],
			T = B[w],
			H = B[p],
			A = y === x ? 0 : B[y],
			j = D === x ? 0 : B[D];
		if (
			T === void 0 ||
			H === void 0 ||
			(y !== x && A === void 0) ||
			(D !== x && j === void 0)
		)
			throw new z("无效的 DX 编码：包含非法字符");
		const O = (T ^ k) & 63,
			P = (H ^ k) & 63,
			S = (A ^ k) & 63,
			G = (j ^ k) & 63,
			F = (O << 2) | (P >> 4),
			L = ((P & 15) << 4) | (S >> 2),
			V = ((S & 3) << 6) | G;
		n < s && (o[n++] = F), n < s && (o[n++] = L), n < s && (o[n++] = V);
	}
	return l.asString ? Ia(o) : o;
}
function Wa(e) {
	if (!e || typeof e != "string" || !e.startsWith(C)) return !1;
	const l = e.slice(C.length);
	if (l.length === 0) return !0;
	if (l.length % 4 !== 0) return !1;
	for (let a = 0; a < l.length; a++) {
		const t = l[a];
		if (t === x) {
			if (a < l.length - 2) return !1;
		} else if (B[t] === void 0) return !1;
	}
	return !0;
}
function Oa() {
	return {
		name: "DX Encoding",
		version: "1.0.0",
		author: "Dogxi",
		charset: E,
		prefix: C,
		magic: k,
		padding: x,
	};
}
var Pa = X(
		'<meta name="description" content="DX 编码 - 由 Dogxi 创造的独特编码算法"/>',
	),
	Ga = q(
		'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>',
	),
	Fa = q(
		'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg>',
	),
	za = q(
		'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg> 已复制',
		1,
	),
	qa = q(
		'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg> 复制',
		1,
	),
	Ja = X('<button class="btn btn-ghost copy-btn svelte-1uha8ag"><!></button>'),
	Za = X('<span class="error-text svelte-1uha8ag"> </span>'),
	Ka = X('<code class="svelte-1uha8ag"> </code>'),
	Qa = X('<span class="placeholder svelte-1uha8ag">结果将显示在这里...</span>'),
	Ya = X(
		'<div class="grid-bg"></div> <div class="page svelte-1uha8ag"><header class="header svelte-1uha8ag"><div class="container header-inner svelte-1uha8ag"><a href="/" class="logo svelte-1uha8ag"><span class="logo-text svelte-1uha8ag">dx</span> <span class="logo-dot svelte-1uha8ag">.</span> <span class="logo-domain svelte-1uha8ag">dogxi.me</span></a> <nav class="nav svelte-1uha8ag"><a href="https://github.com/dogxii/dxcode" target="_blank" rel="noopener" class="nav-link svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg> GitHub</a></nav></div></header> <section class="hero svelte-1uha8ag"><div class="container"><div class="badge badge-primary svelte-1uha8ag"><span class="badge-dot svelte-1uha8ag"></span> </div> <h1 class="hero-title svelte-1uha8ag"><span class="hero-dx svelte-1uha8ag">DX</span> Encoding</h1> <p class="hero-desc svelte-1uha8ag">由 <a href="https://github.com/dogxiii" target="_blank" rel="noopener" class="svelte-1uha8ag">Dogxi</a> 创造的独特编码算法</p> <div class="hero-features svelte-1uha8ag"><div class="feature-tag svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path></svg> URL 安全</div> <div class="feature-tag svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> 完全可逆</div> <div class="feature-tag svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg> 多语言支持</div></div></div></section> <section class="encoder-section svelte-1uha8ag"><div class="container"><div class="encoder-card card svelte-1uha8ag"><div class="encoder-header svelte-1uha8ag"><div class="mode-switch svelte-1uha8ag"><button>编码</button> <button>解码</button></div> <div class="encoder-actions svelte-1uha8ag"><button class="btn btn-ghost" title="交换"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg></button> <button class="btn btn-ghost" title="清空"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button></div></div> <div class="encoder-body svelte-1uha8ag"><div class="encoder-panel svelte-1uha8ag"><div class="panel-label svelte-1uha8ag"> </div> <textarea class="encoder-textarea svelte-1uha8ag" spellcheck="false"></textarea></div> <div class="encoder-divider svelte-1uha8ag"><div class="divider-line svelte-1uha8ag"></div> <div class="divider-icon svelte-1uha8ag"><!></div> <div class="divider-line svelte-1uha8ag"></div></div> <div class="encoder-panel svelte-1uha8ag"><div class="panel-header-row svelte-1uha8ag"><div class="panel-label svelte-1uha8ag"> </div> <!></div> <div><!></div></div></div></div></div></section> <section class="features-section svelte-1uha8ag"><div class="container"><h2 class="section-title svelte-1uha8ag">为什么选择 DX 编码?</h2> <div class="features-grid svelte-1uha8ag"><div class="feature-card card svelte-1uha8ag"><div class="feature-icon svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg></div> <h3 class="svelte-1uha8ag">独特算法</h3> <p class="svelte-1uha8ag">使用自定义 64 字符集和 XOR 变换，与标准 Base64 完全不同</p></div> <div class="feature-card card svelte-1uha8ag"><div class="feature-icon svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2"></path><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"></path><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"></path></svg></div> <h3 class="svelte-1uha8ag">易于识别</h3> <p class="svelte-1uha8ag">所有编码结果以 <code class="svelte-1uha8ag">dx</code> 为前缀，一眼即可识别</p></div> <div class="feature-card card svelte-1uha8ag"><div class="feature-icon svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg></div> <h3 class="svelte-1uha8ag">完全可逆</h3> <p class="svelte-1uha8ag">无损编码，支持任意文本和二进制数据</p></div> <div class="feature-card card svelte-1uha8ag"><div class="feature-icon svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg></div> <h3 class="svelte-1uha8ag">多语言支持</h3> <p class="svelte-1uha8ag">提供 JavaScript、Python、Go、Rust、C 等多种语言实现</p></div></div></div></section> <section class="spec-section svelte-1uha8ag"><div class="container"><h2 class="section-title svelte-1uha8ag">技术规格</h2> <div class="spec-card card svelte-1uha8ag"><div class="spec-grid svelte-1uha8ag"><div class="spec-item svelte-1uha8ag"><span class="spec-label svelte-1uha8ag">字符集</span> <code class="spec-value mono svelte-1uha8ag"> </code></div> <div class="spec-row svelte-1uha8ag"><div class="spec-item svelte-1uha8ag"><span class="spec-label svelte-1uha8ag">前缀</span> <code class="spec-value svelte-1uha8ag"> </code></div> <div class="spec-item svelte-1uha8ag"><span class="spec-label svelte-1uha8ag">魔数</span> <code class="spec-value svelte-1uha8ag"> </code></div> <div class="spec-item svelte-1uha8ag"><span class="spec-label svelte-1uha8ag">填充</span> <code class="spec-value svelte-1uha8ag"> </code></div></div></div></div></div></section> <section class="cli-section svelte-1uha8ag"><div class="container"><h2 class="section-title svelte-1uha8ag">命令行工具</h2> <div class="cli-card card svelte-1uha8ag"><div class="cli-header svelte-1uha8ag"><div class="cli-title svelte-1uha8ag"><span class="cli-name svelte-1uha8ag">dxc</span> <span class="cli-badge svelte-1uha8ag">CLI</span></div></div> <div class="install-methods svelte-1uha8ag"><div class="install-method svelte-1uha8ag"><span class="install-label svelte-1uha8ag">npm</span> <code class="install-cmd svelte-1uha8ag">npm i -g dxcode-cli</code></div> <div class="install-method svelte-1uha8ag"><span class="install-label svelte-1uha8ag">curl</span> <code class="install-cmd svelte-1uha8ag">curl -fsSL https://dxc.dogxi.me/install.sh | sh</code></div> <div class="install-method svelte-1uha8ag"><span class="install-label svelte-1uha8ag">brew</span> <code class="install-cmd svelte-1uha8ag">brew install dogxi/tap/dxcode-cli</code></div></div> <div class="cli-examples svelte-1uha8ag"><div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 编码</span> <code class="svelte-1uha8ag">dxc encode "Hello World"</code></div> <div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 解码</span> <code class="svelte-1uha8ag">dxc decode "dxQBpXRwZX..."</code></div> <div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 自动检测（智能判断）</span> <code class="svelte-1uha8ag">dxc "Hello World"</code></div> <div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 文件操作</span> <code class="svelte-1uha8ag">dxc -f input.txt -o output.dx</code></div> <div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 管道</span> <code class="svelte-1uha8ag">echo "Hello" | dxc</code></div></div> <div class="cli-footer svelte-1uha8ag"><span class="cli-hint svelte-1uha8ag">更多用法：<code class="svelte-1uha8ag">dxc -h</code></span></div></div></div></section> <section class="code-section svelte-1uha8ag"><div class="container"><h2 class="section-title svelte-1uha8ag">快速开始</h2> <div class="code-grid svelte-1uha8ag"><div class="code-card card svelte-1uha8ag"><div class="code-header svelte-1uha8ag"><span class="code-lang svelte-1uha8ag">JavaScript</span> <code class="code-install svelte-1uha8ag">npm i dxcode</code></div> <pre class="svelte-1uha8ag"><code></code></pre></div> <div class="code-card card svelte-1uha8ag"><div class="code-header svelte-1uha8ag"><span class="code-lang svelte-1uha8ag">Python</span> <code class="code-install svelte-1uha8ag">pip install dxcode</code></div> <pre class="svelte-1uha8ag"><code></code></pre></div></div></div></section> <footer class="footer svelte-1uha8ag"><div class="container footer-inner svelte-1uha8ag"><div class="footer-left svelte-1uha8ag"><span class="footer-logo svelte-1uha8ag">dxcode</span> <span class="footer-sep svelte-1uha8ag">·</span> <span class="footer-author">by Dogxi</span></div> <div class="footer-right svelte-1uha8ag"><a href="https://github.com/dogxii/dxcode" target="_blank" rel="noopener" class="svelte-1uha8ag">GitHub</a> <span class="footer-sep svelte-1uha8ag">·</span> <span>MIT License</span></div></div></footer></div>',
		1,
	);
function ts(e, l) {
	ka(l, !0);
	const a = U("encode"),
		t = U(""),
		s = U(""),
		o = U(""),
		n = U(!1);
	const c = Oa();
	function w() {
		if ((g(o, ""), g(s, ""), !!h(t).trim()))
			try {
				if (h(a) === "encode") g(s, Ua(h(t)), !0);
				else {
					if (!Wa(h(t).trim())) throw new Error("输入不是有效的 DX 编码格式");
					g(s, Ra(h(t).trim(), { asString: !0 }), !0);
				}
			} catch (v) {
				g(o, v instanceof Error ? v.message : "处理时发生错误", !0);
			}
	}
	async function p() {
		if (h(s))
			try {
				await navigator.clipboard.writeText(h(s)),
					g(n, !0),
					setTimeout(() => {
						g(n, !1);
					}, 2e3);
			} catch {
				g(o, "复制失败");
			}
	}
	function y() {
		g(t, ""), g(s, ""), g(o, "");
	}
	function D() {
		h(s) &&
			(g(t, h(s), !0),
			g(s, ""),
			g(a, h(a) === "encode" ? "decode" : "encode", !0));
	}
	ya(() => {
		h(t) ? w() : (g(s, ""), g(o, ""));
	});
	var T = Ya();
	Sa("1uha8ag", (v) => {
		var u = Pa();
		Ea(() => {
			Ca.title = "DX Encoding | dxc.dogxi.me";
		}),
			_(v, u);
	});
	var H = d(Re(T), 2),
		A = d(i(H), 2),
		j = i(A),
		O = i(j),
		P = d(i(O));
	r(O), R(6), r(j), r(A);
	var S = d(A, 2),
		G = i(S),
		F = i(G),
		L = i(F),
		V = i(L),
		J = i(V);
	let ge;
	J.__click = () => g(a, "encode");
	var pe = d(J, 2);
	let fe;
	(pe.__click = () => g(a, "decode")), r(V);
	var we = d(V, 2),
		Z = i(we);
	Z.__click = D;
	var Pe = d(Z, 2);
	(Pe.__click = y), r(we), r(L);
	var _e = d(L, 2),
		K = i(_e),
		Q = i(K),
		Ge = i(Q, !0);
	r(Q);
	var Y = d(Q, 2);
	Ma(Y), r(K);
	var $ = d(K, 2),
		xe = d(i($), 2),
		Fe = i(xe);
	var ze = (v) => {
			var u = Ga();
			_(v, u);
		},
		qe = (v) => {
			var u = Fa();
			_(v, u);
		};
	W(Fe, (v) => {
		h(a) === "encode" ? v(ze) : v(qe, !1);
	});
	r(xe), R(2), r($);
	var me = d($, 2),
		ee = i(me),
		ae = i(ee),
		Je = i(ae, !0);
	r(ae);
	var Ze = d(ae, 2);
	var Ke = (v) => {
		var u = Ja();
		u.__click = p;
		var N = i(u);
		var ne = (f) => {
				var m = za();
				R(), _(f, m);
			},
			ce = (f) => {
				var m = qa();
				R(), _(f, m);
			};
		W(N, (f) => {
			h(n) ? f(ne) : f(ce, !1);
		});
		r(u), _(v, u);
	};
	W(Ze, (v) => {
		h(s) && v(Ke);
	});
	r(ee);
	var se = d(ee, 2);
	let be;
	var Qe = i(se);
	var Ye = (v) => {
			var u = Za(),
				N = i(u, !0);
			r(u), de(() => b(N, h(o))), _(v, u);
		},
		$e = (v) => {
			var u = ra(),
				N = Re(u);
			var ne = (f) => {
					var m = Ka(),
						ia = i(m, !0);
					r(m), de(() => b(ia, h(s))), _(f, m);
				},
				ce = (f) => {
					var m = Qa();
					_(f, m);
				};
			W(
				N,
				(f) => {
					h(s) ? f(ne) : f(ce, !1);
				},
				!0,
			);
			_(v, u);
		};
	W(Qe, (v) => {
		h(o) ? v(Ye) : v($e, !1);
	});
	r(se), r(me), r(_e), r(F), r(G), r(S);
	var te = d(S, 4),
		ke = i(te),
		ye = d(i(ke), 2),
		De = i(ye),
		le = i(De),
		Ee = d(i(le), 2),
		ea = i(Ee, !0);
	r(Ee), r(le);
	var Me = d(le, 2),
		oe = i(Me),
		Ce = d(i(oe), 2),
		aa = i(Ce, !0);
	r(Ce), r(oe);
	var ie = d(oe, 2),
		Ae = d(i(ie), 2),
		sa = i(Ae);
	r(Ae), r(ie);
	var Se = d(ie, 2),
		Be = d(i(Se), 2),
		ta = i(Be, !0);
	r(Be), r(Se), r(Me), r(De), r(ye), r(ke), r(te);
	var Xe = d(te, 4),
		Te = i(Xe),
		He = d(i(Te), 2),
		re = i(He),
		je = d(i(re), 2),
		la = i(je);
	(la.textContent = `import { dxEncode, dxDecode } from 'dxcode'

const encoded = dxEncode('Hello, Dogxi!')
console.log(encoded)  // dx...

const decoded = dxDecode(encoded)
console.log(decoded)  // Hello, Dogxi!`),
		r(je),
		r(re);
	var Le = d(re, 2),
		Ve = d(i(Le), 2),
		oa = i(Ve);
	(oa.textContent = `from dx_encoding import dx_encode, dx_decode

encoded = dx_encode('Hello, Dogxi!')
print(encoded)  # dx...

decoded = dx_decode(encoded)
print(decoded)  # Hello, Dogxi!`),
		r(Ve),
		r(Le),
		r(He),
		r(Te),
		r(Xe),
		R(2),
		r(H),
		de(
			(v, u) => {
				b(P, ` v${c.version}`),
					(ge = ve(J, 1, "mode-btn svelte-1uha8ag", null, ge, {
						active: h(a) === "encode",
					})),
					(fe = ve(pe, 1, "mode-btn svelte-1uha8ag", null, fe, {
						active: h(a) === "decode",
					})),
					(Z.disabled = !h(s)),
					b(Ge, h(a) === "encode" ? "输入文本" : "输入 DX 编码"),
					Ha(
						Y,
						"placeholder",
						h(a) === "encode"
							? "输入要编码的内容..."
							: "输入以 dx 开头的编码...",
					),
					b(Je, h(a) === "encode" ? "DX 编码结果" : "解码结果"),
					(be = ve(se, 1, "encoder-output svelte-1uha8ag", null, be, {
						"has-error": !!h(o),
					})),
					b(ea, c.charset),
					b(aa, c.prefix),
					b(sa, `0x${v ?? ""} ('${u ?? ""}')`),
					b(ta, c.padding);
			},
			[
				() => c.magic.toString(16).toUpperCase(),
				() => String.fromCharCode(c.magic),
			],
		),
		Va(
			Y,
			() => h(t),
			(v) => g(t, v),
		),
		_(e, T),
		Da();
}
Aa(["click"]);
export { ts as component };
