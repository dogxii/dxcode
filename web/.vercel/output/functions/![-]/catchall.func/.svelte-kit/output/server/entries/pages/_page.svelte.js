import { e as escape_html } from "../../chunks/context.js";
import { y as attr, x as attr_class, w as head } from "../../chunks/index.js";

/**
 * DX Encoding - 由 Dogxi 创造的独特编码算法
 *
 * TypeScript 实现 - 用于 dxc.dogxi.me 网站
 *
 * @author Dogxi
 * @version 1.0.0
 * @license MIT
 */
const DX_CHARSET =
	"DXdx0123456789ABCEFGHIJKLMNOPQRSTUVWYZabcefghijklmnopqrstuvwyz-_";
const MAGIC = 68;
const PREFIX = "dx";
const PADDING = "=";
function getDxInfo() {
	return {
		name: "DX Encoding",
		version: "1.0.0",
		author: "Dogxi",
		charset: DX_CHARSET,
		prefix: PREFIX,
		magic: MAGIC,
		padding: PADDING,
	};
}
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer2) => {
		const mode = "encode";
		const input = "";
		const info = getDxInfo();
		head("1uha8ag", $$renderer2, ($$renderer3) => {
			$$renderer3.title(($$renderer4) => {
				$$renderer4.push(`<title>DX Encoding | dxc.dogxi.me</title>`);
			});
			$$renderer3.push(
				`<meta name="description" content="DX 编码 - 由 Dogxi 创造的独特编码算法"/>`,
			);
		});
		$$renderer2.push(
			`<div class="grid-bg"></div> <div class="page svelte-1uha8ag"><header class="header svelte-1uha8ag"><div class="container header-inner svelte-1uha8ag"><a href="/" class="logo svelte-1uha8ag"><span class="logo-text svelte-1uha8ag">dx</span> <span class="logo-dot svelte-1uha8ag">.</span> <span class="logo-domain svelte-1uha8ag">dogxi.me</span></a> <nav class="nav svelte-1uha8ag"><a href="https://github.com/dogxii/dxcode" target="_blank" rel="noopener" class="nav-link svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg> GitHub</a></nav></div></header> <section class="hero svelte-1uha8ag"><div class="container"><div class="badge badge-primary svelte-1uha8ag"><span class="badge-dot svelte-1uha8ag"></span> v${escape_html(info.version)}</div> <h1 class="hero-title svelte-1uha8ag"><span class="hero-dx svelte-1uha8ag">DX</span> Encoding</h1> <p class="hero-desc svelte-1uha8ag">由 <a href="https://github.com/dogxiii" target="_blank" rel="noopener" class="svelte-1uha8ag">Dogxi</a> 创造的独特编码算法</p> <div class="hero-features svelte-1uha8ag"><div class="feature-tag svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path></svg> URL 安全</div> <div class="feature-tag svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> 完全可逆</div> <div class="feature-tag svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg> 多语言支持</div></div></div></section> <section class="encoder-section svelte-1uha8ag"><div class="container"><div class="encoder-card card svelte-1uha8ag"><div class="encoder-header svelte-1uha8ag"><div class="mode-switch svelte-1uha8ag"><button${attr_class("mode-btn svelte-1uha8ag", void 0, { active: mode === "encode" })}>编码</button> <button${attr_class("mode-btn svelte-1uha8ag", void 0, { active: mode === "decode" })}>解码</button></div> <div class="encoder-actions svelte-1uha8ag"><button class="btn btn-ghost"${attr("disabled", true, true)} title="交换"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg></button> <button class="btn btn-ghost" title="清空"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button></div></div> <div class="encoder-body svelte-1uha8ag"><div class="encoder-panel svelte-1uha8ag"><div class="panel-label svelte-1uha8ag">${escape_html("输入文本")}</div> <textarea class="encoder-textarea svelte-1uha8ag"${attr("placeholder", "输入要编码的内容...")} spellcheck="false">`,
		);
		const $$body = escape_html(input);
		if ($$body) {
			$$renderer2.push(`${$$body}`);
		}
		$$renderer2.push(
			`</textarea></div> <div class="encoder-divider svelte-1uha8ag"><div class="divider-line svelte-1uha8ag"></div> <div class="divider-icon svelte-1uha8ag">`,
		);
		$$renderer2.push("<!--[-->");
		$$renderer2.push(
			`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`,
		);
		$$renderer2.push(
			`<!--]--></div> <div class="divider-line svelte-1uha8ag"></div></div> <div class="encoder-panel svelte-1uha8ag"><div class="panel-header-row svelte-1uha8ag"><div class="panel-label svelte-1uha8ag">${escape_html("DX 编码结果")}</div> `,
		);
		$$renderer2.push("<!--[!-->");
		$$renderer2.push(
			`<!--]--></div> <div${attr_class("encoder-output svelte-1uha8ag", void 0, { "has-error": false })}>`,
		);
		$$renderer2.push("<!--[!-->");
		$$renderer2.push("<!--[!-->");
		$$renderer2.push(
			`<span class="placeholder svelte-1uha8ag">结果将显示在这里...</span>`,
		);
		$$renderer2.push(`<!--]-->`);
		$$renderer2.push(`<!--]--></div></div></div></div></div></section> <section class="features-section svelte-1uha8ag"><div class="container"><h2 class="section-title svelte-1uha8ag">为什么选择 DX 编码?</h2> <div class="features-grid svelte-1uha8ag"><div class="feature-card card svelte-1uha8ag"><div class="feature-icon svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg></div> <h3 class="svelte-1uha8ag">独特算法</h3> <p class="svelte-1uha8ag">使用自定义 64 字符集和 XOR 变换，与标准 Base64 完全不同</p></div> <div class="feature-card card svelte-1uha8ag"><div class="feature-icon svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2"></path><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"></path><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"></path></svg></div> <h3 class="svelte-1uha8ag">易于识别</h3> <p class="svelte-1uha8ag">所有编码结果以 <code class="svelte-1uha8ag">dx</code> 为前缀，一眼即可识别</p></div> <div class="feature-card card svelte-1uha8ag"><div class="feature-icon svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg></div> <h3 class="svelte-1uha8ag">完全可逆</h3> <p class="svelte-1uha8ag">无损编码，支持任意文本和二进制数据</p></div> <div class="feature-card card svelte-1uha8ag"><div class="feature-icon svelte-1uha8ag"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg></div> <h3 class="svelte-1uha8ag">多语言支持</h3> <p class="svelte-1uha8ag">提供 JavaScript、Python、Go、Rust、C 等多种语言实现</p></div></div></div></section> <section class="spec-section svelte-1uha8ag"><div class="container"><h2 class="section-title svelte-1uha8ag">技术规格</h2> <div class="spec-card card svelte-1uha8ag"><div class="spec-grid svelte-1uha8ag"><div class="spec-item svelte-1uha8ag"><span class="spec-label svelte-1uha8ag">字符集</span> <code class="spec-value mono svelte-1uha8ag">${escape_html(info.charset)}</code></div> <div class="spec-row svelte-1uha8ag"><div class="spec-item svelte-1uha8ag"><span class="spec-label svelte-1uha8ag">前缀</span> <code class="spec-value svelte-1uha8ag">${escape_html(info.prefix)}</code></div> <div class="spec-item svelte-1uha8ag"><span class="spec-label svelte-1uha8ag">魔数</span> <code class="spec-value svelte-1uha8ag">0x${escape_html(info.magic.toString(16).toUpperCase())} ('${escape_html(String.fromCharCode(info.magic))}')</code></div> <div class="spec-item svelte-1uha8ag"><span class="spec-label svelte-1uha8ag">填充</span> <code class="spec-value svelte-1uha8ag">${escape_html(info.padding)}</code></div></div></div></div></div></section> <section class="cli-section svelte-1uha8ag"><div class="container"><h2 class="section-title svelte-1uha8ag">命令行工具</h2> <div class="cli-card card svelte-1uha8ag"><div class="cli-header svelte-1uha8ag"><div class="cli-title svelte-1uha8ag"><span class="cli-name svelte-1uha8ag">dxc</span> <span class="cli-badge svelte-1uha8ag">CLI</span></div></div> <div class="install-methods svelte-1uha8ag"><div class="install-method svelte-1uha8ag"><span class="install-label svelte-1uha8ag">npm</span> <code class="install-cmd svelte-1uha8ag">npm i -g dxcode-cli</code></div> <div class="install-method svelte-1uha8ag"><span class="install-label svelte-1uha8ag">curl</span> <code class="install-cmd svelte-1uha8ag">curl -fsSL https://dxc.dogxi.me/install.sh | sh</code></div> <div class="install-method svelte-1uha8ag"><span class="install-label svelte-1uha8ag">brew</span> <code class="install-cmd svelte-1uha8ag">brew install dogxi/tap/dxcode-cli</code></div></div> <div class="cli-examples svelte-1uha8ag"><div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 编码</span> <code class="svelte-1uha8ag">dxc encode "Hello World"</code></div> <div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 解码</span> <code class="svelte-1uha8ag">dxc decode "dxQBpXRwZX..."</code></div> <div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 自动检测（智能判断）</span> <code class="svelte-1uha8ag">dxc "Hello World"</code></div> <div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 文件操作</span> <code class="svelte-1uha8ag">dxc -f input.txt -o output.dx</code></div> <div class="cli-example svelte-1uha8ag"><span class="cli-comment svelte-1uha8ag"># 管道</span> <code class="svelte-1uha8ag">echo "Hello" | dxc</code></div></div> <div class="cli-footer svelte-1uha8ag"><span class="cli-hint svelte-1uha8ag">更多用法：<code class="svelte-1uha8ag">dxc -h</code></span></div></div></div></section> <section class="code-section svelte-1uha8ag"><div class="container"><h2 class="section-title svelte-1uha8ag">快速开始</h2> <div class="code-grid svelte-1uha8ag"><div class="code-card card svelte-1uha8ag"><div class="code-header svelte-1uha8ag"><span class="code-lang svelte-1uha8ag">JavaScript</span> <code class="code-install svelte-1uha8ag">npm i dxcode</code></div> <pre class="svelte-1uha8ag"><code>import { dxEncode, dxDecode } from 'dxcode'

const encoded = dxEncode('Hello, Dogxi!')
console.log(encoded)  // dx...

const decoded = dxDecode(encoded)
console.log(decoded)  // Hello, Dogxi!</code></pre></div> <div class="code-card card svelte-1uha8ag"><div class="code-header svelte-1uha8ag"><span class="code-lang svelte-1uha8ag">Python</span> <code class="code-install svelte-1uha8ag">pip install dxcode</code></div> <pre class="svelte-1uha8ag"><code>from dx_encoding import dx_encode, dx_decode

encoded = dx_encode('Hello, Dogxi!')
print(encoded)  # dx...

decoded = dx_decode(encoded)
print(decoded)  # Hello, Dogxi!</code></pre></div></div></div></section> <footer class="footer svelte-1uha8ag"><div class="container footer-inner svelte-1uha8ag"><div class="footer-left svelte-1uha8ag"><span class="footer-logo svelte-1uha8ag">dxcode</span> <span class="footer-sep svelte-1uha8ag">·</span> <span class="footer-author">by Dogxi</span></div> <div class="footer-right svelte-1uha8ag"><a href="https://github.com/dogxii/dxcode" target="_blank" rel="noopener" class="svelte-1uha8ag">GitHub</a> <span class="footer-sep svelte-1uha8ag">·</span> <span>MIT License</span></div></div></footer></div>`);
	});
}
export { _page as default };
