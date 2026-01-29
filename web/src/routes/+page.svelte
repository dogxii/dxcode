<script lang="ts">
  import {
    dxEncode,
    dxDecode,
    isDxEncoded,
    getDxInfo,
    type DxInfo,
  } from '$lib/dxcode'

  // 状态
  let mode: 'encode' | 'decode' = $state('encode')
  let input = $state('')
  let output = $state('')
  let error = $state('')
  let copied = $state(false)

  // 编码信息
  const info: DxInfo = getDxInfo()

  // 处理编码/解码
  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      return
    }

    try {
      if (mode === 'encode') {
        output = dxEncode(input)
      } else {
        if (!isDxEncoded(input.trim())) {
          throw new Error('输入不是有效的 DX 编码格式')
        }
        output = dxDecode(input.trim(), { asString: true }) as string
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '处理时发生错误'
    }
  }

  // 复制到剪贴板
  async function copyToClipboard() {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      copied = true
      setTimeout(() => {
        copied = false
      }, 2000)
    } catch {
      error = '复制失败'
    }
  }

  // 清空
  function clear() {
    input = ''
    output = ''
    error = ''
  }

  // 交换
  function swap() {
    if (output) {
      input = output
      output = ''
      mode = mode === 'encode' ? 'decode' : 'encode'
    }
  }

  // 输入变化时自动处理
  $effect(() => {
    if (input) {
      process()
    } else {
      output = ''
      error = ''
    }
  })
</script>

<svelte:head>
  <title>DX Encoding | dxc.dogxi.me</title>
  <meta name="description" content="DX 编码 - 带有 `dx` 前缀的自定义编码算法" />
</svelte:head>

<!-- 网格背景 -->
<div class="grid-bg"></div>

<div class="page">
  <!-- Header -->
  <header class="header">
    <div class="container header-inner">
      <a href="/" class="logo">
        <span class="logo-text">dxc</span>
        <span class="logo-dot">.</span>
        <span class="logo-domain">dogxi.me</span>
      </a>

      <nav class="nav">
        <a
          href="https://github.com/dogxii/dxcode"
          target="_blank"
          rel="noopener"
          class="nav-link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          GitHub
        </a>
      </nav>
    </div>
  </header>

  <!-- Hero -->
  <section class="hero">
    <div class="container">
      <div class="badge badge-primary">
        <span class="badge-dot"></span>
        v{info.version}
      </div>

      <h1 class="hero-title">
        <span class="hero-dx">DX</span> Encoding
      </h1>

      <p class="hero-desc">一个带有 `dx` 前缀的独特的二进制编码器</p>

      <div class="hero-features">
        <div class="feature-tag">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path
              d="m9 12 2 2 4-4"
            /></svg
          >
          URL 安全
        </div>
        <div class="feature-tag">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><polyline points="16 18 22 12 16 6" /><polyline
              points="8 6 2 12 8 18"
            /></svg
          >
          完全可逆
        </div>
        <div class="feature-tag">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><path
              d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            /></svg
          >
          多语言支持
        </div>
      </div>
    </div>
  </section>

  <!-- Encoder -->
  <section class="encoder-section">
    <div class="container">
      <div class="encoder-card card">
        <!-- Mode Switch -->
        <div class="encoder-header">
          <div class="mode-switch">
            <button
              class="mode-btn"
              class:active={mode === 'encode'}
              onclick={() => (mode = 'encode')}
            >
              编码
            </button>
            <button
              class="mode-btn"
              class:active={mode === 'decode'}
              onclick={() => (mode = 'decode')}
            >
              解码
            </button>
          </div>

          <div class="encoder-actions">
            <button
              class="btn btn-ghost"
              onclick={swap}
              disabled={!output}
              title="交换"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />
              </svg>
            </button>
            <button class="btn btn-ghost" onclick={clear} title="清空">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 6h18" /><path
                  d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        <div class="encoder-body">
          <!-- Input -->
          <div class="encoder-panel">
            <div class="panel-label">
              {mode === 'encode' ? '输入文本' : '输入 DX 编码'}
            </div>
            <textarea
              class="encoder-textarea"
              bind:value={input}
              placeholder={mode === 'encode'
                ? '输入要编码的内容...'
                : '输入以 dx 开头的编码...'}
              spellcheck="false"
            ></textarea>
          </div>

          <div class="encoder-divider">
            <div class="divider-line"></div>
            <div class="divider-icon">
              {#if mode === 'encode'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                </svg>
              {/if}
            </div>
            <div class="divider-line"></div>
          </div>

          <!-- Output -->
          <div class="encoder-panel">
            <div class="panel-header-row">
              <div class="panel-label">
                {mode === 'encode' ? 'DX 编码结果' : '解码结果'}
              </div>
              {#if output}
                <button
                  class="btn btn-ghost copy-btn"
                  onclick={copyToClipboard}
                >
                  {#if copied}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    已复制
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect
                        width="14"
                        height="14"
                        x="8"
                        y="8"
                        rx="2"
                        ry="2"
                      /><path
                        d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                      />
                    </svg>
                    复制
                  {/if}
                </button>
              {/if}
            </div>
            <div class="encoder-output" class:has-error={!!error}>
              {#if error}
                <span class="error-text">{error}</span>
              {:else if output}
                <code>{output}</code>
              {:else}
                <span class="placeholder">结果将显示在这里...</span>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="features-section">
    <div class="container">
      <h2 class="section-title">为什么选择 DX 编码?</h2>

      <div class="features-grid">
        <div class="feature-card card">
          <div class="feature-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
          </div>
          <h3>独特算法</h3>
          <p>使用自定义 64 字符集和 XOR 变换，与标准 Base64 完全不同</p>
        </div>

        <div class="feature-card card">
          <div class="feature-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 7h-3a2 2 0 0 1-2-2V2" /><path
                d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"
              /><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />
            </svg>
          </div>
          <h3>易于识别</h3>
          <p>所有编码结果以 <code>dx</code> 为前缀，一眼即可识别</p>
        </div>

        <div class="feature-card card">
          <div class="feature-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
              /><path d="M3 3v5h5" /><path
                d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
              /><path d="M16 16h5v5" />
            </svg>
          </div>
          <h3>完全可逆</h3>
          <p>无损编码，支持任意文本和二进制数据</p>
        </div>

        <div class="feature-card card">
          <div class="feature-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" /><path
                d="M3 5V19A9 3 0 0 0 21 19V5"
              /><path d="M3 12A9 3 0 0 0 21 12" />
            </svg>
          </div>
          <h3>多语言支持</h3>
          <p>提供 JavaScript、Python、Go、Rust、C 等多种语言实现</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Spec -->
  <section class="spec-section">
    <div class="container">
      <h2 class="section-title">技术规格</h2>

      <div class="spec-card card">
        <div class="spec-grid">
          <div class="spec-item">
            <span class="spec-label">字符集</span>
            <code class="spec-value mono">{info.charset}</code>
          </div>
          <div class="spec-row">
            <div class="spec-item">
              <span class="spec-label">前缀</span>
              <code class="spec-value">{info.prefix}</code>
            </div>
            <div class="spec-item">
              <span class="spec-label">魔数</span>
              <code class="spec-value"
                >0x{info.magic.toString(16).toUpperCase()} ('{String.fromCharCode(
                  info.magic,
                )}')</code
              >
            </div>
            <div class="spec-item">
              <span class="spec-label">填充</span>
              <code class="spec-value">{info.padding}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CLI Section -->
  <section class="cli-section">
    <div class="container">
      <h2 class="section-title">命令行工具</h2>

      <div class="cli-card card">
        <div class="cli-header">
          <div class="cli-title">
            <span class="cli-name">dxc</span>
            <span class="cli-badge">CLI</span>
          </div>
        </div>

        <!-- Install Methods -->
        <div class="install-methods">
          <div class="install-method">
            <span class="install-label">npm</span>
            <code class="install-cmd">npm i -g dxcode-cli</code>
          </div>
          <div class="install-method">
            <span class="install-label">curl</span>
            <code class="install-cmd"
              >curl -fsSL https://cdn.dogxi.me/dxcode_install.sh | sh</code
            >
          </div>
          <div class="install-method">
            <span class="install-label">brew</span>
            <code class="install-cmd">brew install dogxi/tap/dxcode-cli</code>
          </div>
        </div>

        <div class="cli-examples">
          <div class="cli-example">
            <span class="cli-comment"># 编码</span>
            <code>dxc encode "Hello World"</code>
          </div>
          <div class="cli-example">
            <span class="cli-comment"># 解码</span>
            <code>dxc decode "dxQBpXRwZX..."</code>
          </div>
          <div class="cli-example">
            <span class="cli-comment"># 自动检测（智能判断）</span>
            <code>dxc "Hello World"</code>
          </div>
          <div class="cli-example">
            <span class="cli-comment"># 文件操作</span>
            <code>dxc -f input.txt -o output.dx</code>
          </div>
          <div class="cli-example">
            <span class="cli-comment"># 管道</span>
            <code>echo "Hello" | dxc</code>
          </div>
        </div>

        <div class="cli-footer">
          <span class="cli-hint">更多用法：<code>dxc -h</code></span>
        </div>
      </div>
    </div>
  </section>

  <!-- Code Examples -->
  <section class="code-section">
    <div class="container">
      <h2 class="section-title">快速开始</h2>

      <div class="code-grid">
        <div class="code-card card">
          <div class="code-header">
            <span class="code-lang">JavaScript</span>
            <code class="code-install">npm i dxcode-lib</code>
          </div>
          <pre><code
              >{`import { dxEncode, dxDecode } from 'dxcode-lib'

const encoded = dxEncode('Hello, Dogxi!')
console.log(encoded)  // dx...

const decoded = dxDecode(encoded)
console.log(decoded)  // Hello, Dogxi!`}</code
            ></pre>
        </div>

        <div class="code-card card">
          <div class="code-header">
            <span class="code-lang">Python</span>
            <code class="code-install">pip install dxcode</code>
          </div>
          <pre><code
              >{`from dxcode import dx_encode, dx_decode

encoded = dx_encode('Hello, Dogxi!')
print(encoded)  # dx...

decoded = dx_decode(encoded)
print(decoded)  # Hello, Dogxi!`}</code
            ></pre>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-left">
        <span class="footer-logo">dxcode</span>
        <span class="footer-sep">·</span>
        <span class="footer-author">by Dogxi</span>
      </div>
      <div class="footer-right">
        <a
          href="https://github.com/dogxii/dxcode"
          target="_blank"
          rel="noopener">GitHub</a
        >
        <span class="footer-sep">·</span>
        <span>MIT License</span>
      </div>
    </div>
  </footer>
</div>

<style>
  /* Page Layout */
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: color-mix(in srgb, var(--color-bg), transparent 20%);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
  }

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
  }

  .logo {
    display: flex;
    align-items: baseline;
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 600;
  }

  .logo-text {
    color: var(--color-primary);
  }

  .logo-dot {
    color: var(--color-text-tertiary);
  }

  .logo-domain {
    color: var(--color-text);
  }

  .nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .nav-link:hover {
    color: var(--color-text);
    background: var(--color-bg-tertiary);
  }

  /* Hero */
  .hero {
    padding: var(--spacing-3xl) 0 var(--spacing-2xl);
    text-align: center;
  }

  .hero .badge {
    margin-bottom: var(--spacing-lg);
  }

  .badge-dot {
    width: 6px;
    height: 6px;
    background: var(--color-primary);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  .hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin-bottom: var(--spacing-md);
  }

  .hero-dx {
    color: var(--color-primary);
  }

  .hero-desc {
    font-size: 1.125rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xl);
  }

  .hero-desc a {
    color: var(--color-text);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .hero-desc a:hover {
    color: var(--color-primary);
  }

  .hero-features {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .feature-tag {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 9999px;
  }

  /* Encoder Section */
  .encoder-section {
    padding: var(--spacing-xl) 0 var(--spacing-3xl);
  }

  .encoder-card {
    max-width: 800px;
    margin: 0 auto;
  }

  .encoder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .mode-switch {
    display: flex;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 2px;
  }

  .mode-btn {
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-radius: calc(var(--radius-md) - 2px);
    transition: all var(--transition-fast);
  }

  .mode-btn:hover {
    color: var(--color-text);
  }

  .mode-btn.active {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }

  .encoder-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .encoder-body {
    padding: var(--spacing-lg);
  }

  .encoder-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .panel-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
  }

  .encoder-textarea {
    width: 100%;
    min-height: 120px;
    padding: var(--spacing-md);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    line-height: 1.6;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    resize: vertical;
    transition: border-color var(--transition-fast);
  }

  .encoder-textarea:focus {
    outline: none;
    border-color: var(--color-border-hover);
  }

  .encoder-divider {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-lg) 0;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  .divider-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--color-text-tertiary);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 50%;
  }

  .encoder-output {
    min-height: 120px;
    padding: var(--spacing-md);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    line-height: 1.6;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    word-break: break-all;
    overflow-wrap: break-word;
  }

  .encoder-output .placeholder {
    color: var(--color-text-tertiary);
  }

  .encoder-output.has-error {
    border-color: var(--color-error);
  }

  .encoder-output .error-text {
    color: var(--color-error);
  }

  .encoder-output code {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-accent);
  }

  .copy-btn {
    font-size: 0.75rem;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  /* Features Section */
  .features-section {
    padding: var(--spacing-3xl) 0;
    border-top: 1px solid var(--color-border);
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    margin-bottom: var(--spacing-2xl);
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--spacing-lg);
  }

  .feature-card {
    padding: var(--spacing-lg);
  }

  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    color: var(--color-primary);
    background: var(--color-primary-dim);
    border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
  }

  .feature-card h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
  }

  .feature-card p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  .feature-card code {
    font-size: 0.8125rem;
  }

  /* Spec Section */
  .spec-section {
    padding: var(--spacing-3xl) 0;
    border-top: 1px solid var(--color-border);
  }

  .spec-card {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-lg);
  }

  .spec-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .spec-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
  }

  .spec-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .spec-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
  }

  .spec-value {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.875rem;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    border: none;
  }

  .spec-value.mono {
    font-size: 0.75rem;
    word-break: break-all;
  }

  /* Code Section */
  .code-section {
    padding: var(--spacing-3xl) 0;
    border-top: 1px solid var(--color-border);
  }

  .code-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: var(--spacing-lg);
  }

  .code-card {
    overflow: hidden;
  }

  .code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-bottom: 1px solid var(--color-border);
  }

  .code-lang {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-primary);
  }

  .code-install {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
  }

  .code-card pre {
    margin: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    padding: var(--spacing-md);
  }

  /* CLI Section */
  .cli-section {
    padding: var(--spacing-xl) 0;
  }

  .cli-card {
    overflow: hidden;
  }

  .cli-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .install-methods {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .install-method {
    display: flex;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    gap: var(--spacing-md);
  }

  .install-method:last-child {
    border-bottom: none;
  }

  .install-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
    min-width: 3rem;
  }

  .install-cmd {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--color-text);
    background: var(--color-bg-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    flex: 1;
    overflow-x: auto;
    white-space: nowrap;
  }

  .cli-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .cli-name {
    font-family: var(--font-mono);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .cli-badge {
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.125rem 0.375rem;
    background: var(--color-text);
    color: var(--color-bg);
    border-radius: var(--radius-sm);
  }

  .cli-examples {
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .cli-example {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .cli-example code {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--color-text);
    padding-left: var(--spacing-sm);
  }

  .cli-comment {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }

  .cli-footer {
    padding: var(--spacing-sm) var(--spacing-md);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
  }

  .cli-hint {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }

  .cli-hint code {
    color: var(--color-text-secondary);
  }

  /* Footer */
  .footer {
    margin-top: auto;
    padding: var(--spacing-lg) 0;
    border-top: 1px solid var(--color-border);
  }

  .footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
  }

  .footer-left,
  .footer-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .footer-logo {
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
  }

  .footer-sep {
    opacity: 0.5;
  }

  .footer a {
    color: var(--color-text-secondary);
  }

  .footer a:hover {
    color: var(--color-text);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }

    .encoder-header {
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: stretch;
    }

    .mode-switch {
      justify-content: center;
    }

    .encoder-actions {
      justify-content: center;
    }

    .footer-inner {
      flex-direction: column;
      gap: var(--spacing-sm);
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 2rem;
    }

    .hero-features {
      flex-direction: column;
      align-items: center;
    }

    .code-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
