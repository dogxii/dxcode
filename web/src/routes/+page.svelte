<script lang="ts">
  import {
    dxEncode,
    dxDecode,
    isDxEncoded,
    getDxInfo,
    dxEncodeWithTtl,
    getTtlInfo,
    hasTtl,
    type DxInfo,
    type TtlInfo,
  } from '$lib/dxcode'
  import { fade, slide } from 'svelte/transition'

  // 状态
  let plainText = $state('')
  let dxText = $state('')
  let error = $state('')

  // TTL 相关状态
  let enableTtl = $state(false)
  let ttlValue = $state(3600) // 默认 1 小时
  let ttlUnit = $state<'seconds' | 'minutes' | 'hours' | 'days'>('hours')
  let decodedTtlInfo = $state<TtlInfo | null>(null)

  // 复制状态
  let copiedPlain = $state(false)
  let copiedDx = $state(false)
  let copiedCli = $state(false)

  // 正在编辑的一侧，防止循环更新
  let activeSide = $state<'plain' | 'dx' | null>(null)

  // 编码信息
  const info: DxInfo = getDxInfo()

  // CLI 标签页
  let activeCliTab = $state('curl') // curl, homebrew, cargo, npm

  // SDK 标签页
  let activeSdkTab = $state('javascript')
  let copiedSdk = $state(false)

  // TTL 单位转换
  function getTtlSeconds(): number {
    switch (ttlUnit) {
      case 'seconds':
        return ttlValue
      case 'minutes':
        return ttlValue * 60
      case 'hours':
        return ttlValue * 3600
      case 'days':
        return ttlValue * 86400
    }
  }

  // 格式化时间戳
  function formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleString()
  }

  // 格式化剩余时间
  function formatTtl(seconds: number): string {
    if (seconds <= 0) return '已过期'
    if (seconds < 60) return `${seconds} 秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时`
    return `${Math.floor(seconds / 86400)} 天`
  }

  // 处理文本输入
  function handlePlainInput(e: Event) {
    const target = e.target as HTMLTextAreaElement
    plainText = target.value
    activeSide = 'plain'
    decodedTtlInfo = null

    if (!plainText) {
      dxText = ''
      error = ''
      return
    }

    try {
      if (enableTtl) {
        dxText = dxEncodeWithTtl(plainText, getTtlSeconds())
      } else {
        dxText = dxEncode(plainText)
      }
      error = ''
    } catch (e) {
      error = e instanceof Error ? e.message : '编码错误'
    }
  }

  // 处理 DX 输入
  function handleDxInput(e: Event) {
    const target = e.target as HTMLTextAreaElement
    dxText = target.value.trim()
    activeSide = 'dx'
    decodedTtlInfo = null

    if (!dxText) {
      plainText = ''
      error = ''
      return
    }

    try {
      if (isDxEncoded(dxText)) {
        // 检查 TTL 信息
        if (hasTtl(dxText)) {
          decodedTtlInfo = getTtlInfo(dxText)
        }
        plainText = dxDecode(dxText, {
          asString: true,
          checkTtl: false,
        }) as string
        error = ''
      } else {
        // 如果不是有效的 DX 编码，暂时清空明文或保持原样
        // 这里选择保持原样但不报错，除非它是空的
        if (dxText.startsWith('dx')) {
          error = '无效的 DX 编码格式'
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '解码错误'
    }
  }

  // 复制功能
  async function copyText(text: string, type: 'plain' | 'dx' | 'cli' | 'sdk') {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      if (type === 'plain') {
        copiedPlain = true
        setTimeout(() => (copiedPlain = false), 2000)
      } else if (type === 'dx') {
        copiedDx = true
        setTimeout(() => (copiedDx = false), 2000)
      } else if (type === 'cli') {
        copiedCli = true
        setTimeout(() => (copiedCli = false), 2000)
      } else {
        copiedSdk = true
        setTimeout(() => (copiedSdk = false), 2000)
      }
    } catch {
      error = '复制失败'
    }
  }

  // 清空
  function clear() {
    plainText = ''
    dxText = ''
    error = ''
    activeSide = null
    decodedTtlInfo = null
  }

  // TTL 开关变化时重新编码
  function handleTtlToggle() {
    if (plainText && activeSide === 'plain') {
      try {
        if (enableTtl) {
          dxText = dxEncodeWithTtl(plainText, getTtlSeconds())
        } else {
          dxText = dxEncode(plainText)
        }
        error = ''
      } catch (e) {
        error = e instanceof Error ? e.message : '编码错误'
      }
    }
  }
</script>

<svelte:head>
  <title>dxcode | 带有 `dx` 前缀的自定义编码算法</title>
  <meta name="description" content="DX 编码 - 由 Dogxi 创造的独特编码算法" />
</svelte:head>

<div class="grid-bg"></div>

<div class="page">
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
          rel="noopener noreferrer"
          class="nav-link"
        >
          GitHub
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
            <path
              d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
            />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container text-center">
        <div class="badge badge-primary mb-md">
          <span class="badge-dot"></span>
          <span>v{info.version} 现已发布</span>
        </div>

        <h1 class="hero-title">
          <span class="hero-dx">DX</span> Encoding
        </h1>

        <p class="hero-desc">
          一种独特的二进制文本编码方案。
          <br />
          <span class="text-secondary"
            >带有标志性的 <code>dx</code> 前缀，URL 安全，专为开发者设计。</span
          >
        </p>
      </div>
    </section>

    <!-- 双栏编辑器 -->
    <section class="encoder-section" id="editor">
      <div class="container">
        <div class="editor-container card">
          <!-- 工具栏 -->
          <div class="editor-toolbar">
            <div class="toolbar-left">
              <span class="status-indicator" class:active={activeSide !== null}>
                {#if activeSide === 'plain'}
                  正在编码...
                {:else if activeSide === 'dx'}
                  正在解码...
                {:else}
                  就绪
                {/if}
              </span>
            </div>
            <div class="toolbar-right">
              <!-- TTL 选项 -->
              <div class="ttl-options">
                <label class="ttl-toggle">
                  <input
                    type="checkbox"
                    bind:checked={enableTtl}
                    onchange={handleTtlToggle}
                  />
                  <span class="ttl-label">TTL</span>
                </label>
                <div class="ttl-input-group" class:ttl-hidden={!enableTtl}>
                  <input
                    type="number"
                    class="ttl-input"
                    bind:value={ttlValue}
                    min="1"
                    onchange={handleTtlToggle}
                    disabled={!enableTtl}
                  />
                  <select
                    class="ttl-select"
                    bind:value={ttlUnit}
                    onchange={handleTtlToggle}
                    disabled={!enableTtl}
                  >
                    <option value="seconds">秒</option>
                    <option value="minutes">分钟</option>
                    <option value="hours">小时</option>
                    <option value="days">天</option>
                  </select>
                </div>
              </div>
              <button
                class="btn btn-ghost btn-sm"
                onclick={clear}
                title="清空所有内容"
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
                  <path d="M3 6h18" /><path
                    d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                  /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                清空
              </button>
            </div>
          </div>

          <div class="editor-panes">
            <!-- 左侧：明文 -->
            <div class="editor-pane plain-pane">
              <div class="pane-header">
                <label for="plain-input" class="pane-title">Plain Text</label>
                <button
                  class="copy-btn-icon"
                  onclick={() => copyText(plainText, 'plain')}
                  title="复制明文"
                  disabled={!plainText}
                >
                  {#if copiedPlain}
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
                      class="text-success"><path d="M20 6 9 17l-5-5" /></svg
                    >
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
                      ><rect
                        width="14"
                        height="14"
                        x="8"
                        y="8"
                        rx="2"
                        ry="2"
                      /><path
                        d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                      /></svg
                    >
                  {/if}
                </button>
              </div>
              <textarea
                id="plain-input"
                class="editor-textarea"
                placeholder="在此输入文本..."
                value={plainText}
                oninput={handlePlainInput}
                spellcheck="false"
              ></textarea>
            </div>

            <!-- 中间：分隔/箭头 -->
            <div class="editor-divider">
              <div class="divider-arrow">
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
                  <path d="M7 16V4M7 4L3 8M7 4L11 8" />
                  <path d="M17 8v12M17 20l4-4M17 20l-4-4" />
                </svg>
              </div>
            </div>

            <!-- 右侧：DX 编码 -->
            <div class="editor-pane dx-pane">
              <div class="pane-header">
                <label for="dx-input" class="pane-title">DX Encoded</label>
                <div class="pane-actions">
                  {#if decodedTtlInfo}
                    <span
                      class="ttl-badge"
                      class:expired={decodedTtlInfo.isExpired}
                      transition:fade
                      title={`创建时间: ${formatTimestamp(decodedTtlInfo.createdAt)}${decodedTtlInfo.expiresAt ? `\n过期时间: ${formatTimestamp(decodedTtlInfo.expiresAt)}` : '\n永不过期'}`}
                    >
                      {#if decodedTtlInfo.isExpired}
                        ⏰ 已过期
                      {:else if decodedTtlInfo.ttlSeconds === 0}
                        ⏰ 永不过期
                      {:else}
                        ⏰ {formatTtl(
                          decodedTtlInfo.expiresAt! -
                            Math.floor(Date.now() / 1000),
                        )}
                      {/if}
                    </span>
                  {/if}
                  {#if error}
                    <span class="error-badge" transition:fade>{error}</span>
                  {/if}
                  <button
                    class="copy-btn-icon"
                    onclick={() => copyText(dxText, 'dx')}
                    title="复制编码"
                    disabled={!dxText}
                  >
                    {#if copiedDx}
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
                        class="text-success"><path d="M20 6 9 17l-5-5" /></svg
                      >
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
                        ><rect
                          width="14"
                          height="14"
                          x="8"
                          y="8"
                          rx="2"
                          ry="2"
                        /><path
                          d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                        /></svg
                      >
                    {/if}
                  </button>
                </div>
              </div>
              <textarea
                id="dx-input"
                class="editor-textarea font-mono"
                placeholder="在此输入 DX 编码..."
                value={dxText}
                oninput={handleDxInput}
                spellcheck="false"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 特性介绍 -->
    <section class="features-section">
      <div class="container">
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
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg
              >
            </div>
            <h3>CRC16 校验</h3>
            <p>内置 CRC16-CCITT 校验和，自动检测数据完整性，防止意外损坏。</p>
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
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line
                  x1="12"
                  y1="22.08"
                  x2="12"
                  y2="12"
                /></svg
              >
            </div>
            <h3>智能压缩</h3>
            <p>DEFLATE 压缩算法，≥32 字节自动压缩，减小编码体积。</p>
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
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><polyline points="16 18 22 12 16 6" /><polyline
                  points="8 6 2 12 8 18"
                /></svg
              >
            </div>
            <h3>易于识别</h3>
            <p>强制性的 <code>dx</code> 前缀，URL 安全字符集，一目了然。</p>
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
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><circle cx="12" cy="12" r="10" /><polyline
                  points="12 6 12 12 16 14"
                /></svg
              >
            </div>
            <h3>TTL 过期</h3>
            <p>内置时间戳与过期时间支持，适用于临时令牌、验证码等场景。</p>
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
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                  d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                /></svg
              >
            </div>
            <h3>高性能</h3>
            <p>Rust 核心实现，即时编解码，零依赖，极低的资源占用。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CLI 安装部分 -->
    <section class="cli-section">
      <div class="container">
        <div class="section-header text-center mb-lg">
          <h2 class="section-title">命令行工具</h2>
          <p class="section-subtitle text-secondary">
            在终端中使用 dxcode，支持所有主流操作系统。
          </p>
        </div>

        <div class="cli-card card">
          <div class="cli-tabs">
            <button
              class="cli-tab"
              class:active={activeCliTab === 'curl'}
              onclick={() => (activeCliTab = 'curl')}
            >
              Curl (Universal)
            </button>
            <button
              class="cli-tab"
              class:active={activeCliTab === 'homebrew'}
              onclick={() => (activeCliTab = 'homebrew')}
            >
              Homebrew
            </button>
            <button
              class="cli-tab"
              class:active={activeCliTab === 'cargo'}
              onclick={() => (activeCliTab = 'cargo')}
            >
              Cargo
            </button>
          </div>

          <div class="cli-content">
            {#if activeCliTab === 'curl'}
              <div class="cli-panel" in:fade>
                <div class="code-block">
                  <code
                    >curl -fsSL https://cdn.dogxi.me/dxcode_install.sh | sh</code
                  >
                  <button
                    class="copy-btn"
                    onclick={() =>
                      copyText(
                        'curl -fsSL https://cdn.dogxi.me/dxcode_install.sh | sh',
                        'cli',
                      )}
                  >
                    {#if copiedCli}
                      已复制
                    {:else}
                      复制
                    {/if}
                  </button>
                </div>
                <p class="cli-hint">自动检测系统并下载预编译二进制文件。</p>
              </div>
            {:else if activeCliTab === 'homebrew'}
              <div class="cli-panel" in:fade>
                <div class="code-block">
                  <code>brew install dogxii/tap/dxcode</code>
                  <button
                    class="copy-btn"
                    onclick={() =>
                      copyText('brew install dogxii/tap/dxcode', 'cli')}
                  >
                    {#if copiedCli}
                      已复制
                    {:else}
                      复制
                    {/if}
                  </button>
                </div>
                <p class="cli-hint">适用于 macOS 和 Linux。</p>
              </div>
            {:else if activeCliTab === 'cargo'}
              <div class="cli-panel" in:fade>
                <div class="code-block">
                  <code>cargo install dxcode</code>
                  <button
                    class="copy-btn"
                    onclick={() => copyText('cargo install dxcode', 'cli')}
                  >
                    {#if copiedCli}
                      已复制
                    {:else}
                      复制
                    {/if}
                  </button>
                </div>
                <p class="cli-hint">需要 Rust 环境。从源码编译安装。</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- SDK 使用部分 -->
    <section class="cli-section">
      <div class="container">
        <div class="section-header text-center mb-lg">
          <h2 class="section-title">多语言 SDK</h2>
          <p class="section-subtitle text-secondary">
            在您的项目中集成 dxcode，支持多种主流编程语言。
          </p>
        </div>

        <div class="cli-card card">
          <div class="cli-tabs">
            <button
              class="cli-tab"
              class:active={activeSdkTab === 'javascript'}
              onclick={() => (activeSdkTab = 'javascript')}
            >
              JavaScript
            </button>
            <button
              class="cli-tab"
              class:active={activeSdkTab === 'python'}
              onclick={() => (activeSdkTab = 'python')}
            >
              Python
            </button>
            <button
              class="cli-tab"
              class:active={activeSdkTab === 'go'}
              onclick={() => (activeSdkTab = 'go')}
            >
              Go
            </button>
            <button
              class="cli-tab"
              class:active={activeSdkTab === 'rust'}
              onclick={() => (activeSdkTab = 'rust')}
            >
              Rust
            </button>
          </div>

          <div class="cli-content">
            {#if activeSdkTab === 'javascript'}
              <div class="cli-panel" in:fade>
                <div class="code-block multiline">
                  <pre><code
                      >{`import { dxEncode, dxDecode } from 'dxcode-lib'

const encoded = dxEncode('Hello World')
console.log(encoded) // dx...

const decoded = dxDecode(encoded)
console.log(decoded) // Hello World`}</code
                    ></pre>
                  <button
                    class="copy-btn"
                    onclick={() =>
                      copyText(
                        `import { dxEncode, dxDecode } from 'dxcode-lib'

const encoded = dxEncode('Hello World')
console.log(encoded) // dx...

const decoded = dxDecode(encoded)
console.log(decoded) // Hello World`,
                        'sdk',
                      )}
                  >
                    {#if copiedSdk}
                      已复制
                    {:else}
                      复制
                    {/if}
                  </button>
                </div>
                <p class="cli-hint">
                  安装: <code>npm install dxcode-lib</code>
                </p>
              </div>
            {:else if activeSdkTab === 'python'}
              <div class="cli-panel" in:fade>
                <div class="code-block multiline">
                  <pre><code
                      >{`from dxcode import dx_encode, dx_decode

encoded = dx_encode('Hello World')
print(encoded)

decoded = dx_decode(encoded)
print(decoded)`}</code
                    ></pre>
                  <button
                    class="copy-btn"
                    onclick={() =>
                      copyText(
                        `from dxcode import dx_encode, dx_decode

encoded = dx_encode('Hello World')
print(encoded)

decoded = dx_decode(encoded)
print(decoded)`,
                        'sdk',
                      )}
                  >
                    {#if copiedSdk}
                      已复制
                    {:else}
                      复制
                    {/if}
                  </button>
                </div>
                <p class="cli-hint">安装: <code>pip install dxcode</code></p>
              </div>
            {:else if activeSdkTab === 'go'}
              <div class="cli-panel" in:fade>
                <div class="code-block multiline">
                  <pre><code
                      >{`package main

import (
    "fmt"
    dx "github.com/dogxii/dxcode"
)

func main() {
    encoded := dx.Encode([]byte("Hello World"))
    fmt.Println(encoded)

    decoded, _ := dx.Decode(encoded)
    fmt.Println(string(decoded))
}`}</code
                    ></pre>
                  <button
                    class="copy-btn"
                    onclick={() =>
                      copyText(
                        `package main

import (
    "fmt"
    dx "github.com/dogxii/dxcode"
)

func main() {
    encoded := dx.Encode([]byte("Hello World"))
    fmt.Println(encoded)

    decoded, _ := dx.Decode(encoded)
    fmt.Println(string(decoded))
}`,
                        'sdk',
                      )}
                  >
                    {#if copiedSdk}
                      已复制
                    {:else}
                      复制
                    {/if}
                  </button>
                </div>
                <p class="cli-hint">
                  安装: <code>go get github.com/dogxii/dxcode</code>
                </p>
              </div>
            {:else if activeSdkTab === 'rust'}
              <div class="cli-panel" in:fade>
                <div class="code-block multiline">
                  <pre><code
                      >{`use dxcode::{encode, decode};

fn main() {
    let encoded = encode("Hello World".as_bytes());
    println!("{}", encoded);

    let decoded = decode(&encoded).unwrap();
    println!("{}", String::from_utf8(decoded).unwrap());
}`}</code
                    ></pre>
                  <button
                    class="copy-btn"
                    onclick={() =>
                      copyText(
                        `use dxcode::{encode, decode};

fn main() {
    let encoded = encode("Hello World".as_bytes());
    println!("{}", encoded);

    let decoded = decode(&encoded).unwrap();
    println!("{}", String::from_utf8(decoded).unwrap());
}`,
                        'sdk',
                      )}
                  >
                    {#if copiedSdk}
                      已复制
                    {:else}
                      复制
                    {/if}
                  </button>
                </div>
                <p class="cli-hint">
                  安装: 在 <code>Cargo.toml</code> 添加
                  <code>dxcode = "1.0"</code>
                </p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-left">
        <span class="footer-copy"
          >© 2026 <a href="https://blog.dogxi.me">Dogxi</a>. MIT License.</span
        >
      </div>
      <div class="footer-right">
        <a href="https://github.com/dogxii/dxcode" target="_blank">GitHub</a>
      </div>
    </div>
  </footer>
</div>

<style>
  /* 页面布局 */
  .page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
  }

  /* Header */
  .header {
    padding: var(--spacing-md) 0;
    /* backdrop-filter: blur(8px); */
  }

  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    font-weight: 700;
    font-size: 1.25rem;
    display: flex;
    align-items: baseline;
    gap: 2px;
  }

  .logo-text {
    letter-spacing: -0.02em;
  }

  .logo-dot {
    color: var(--color-text-tertiary);
  }

  .logo-domain {
    color: var(--color-text-secondary);
    font-size: 1rem;
    font-weight: 500;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .nav-link:hover {
    color: var(--color-text);
  }

  /* Hero */
  .hero {
    padding: var(--spacing-3xl) 0;
  }

  .hero-title {
    font-size: 4rem;
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -0.04em;
    margin-bottom: var(--spacing-lg);
    background: linear-gradient(to bottom right, #fff 0%, #aaa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-dx {
    font-family: var(--font-mono);
  }

  .hero-desc {
    font-size: 1.25rem;
    color: var(--color-text-secondary);
    max-width: 600px;
    margin: 0 auto;
  }

  /* Editor Section (Two-Pane) */
  .encoder-section {
    padding-bottom: var(--spacing-3xl);
  }

  .editor-container {
    display: flex;
    flex-direction: column;
    height: 500px;
    overflow: hidden;
    background: var(--color-bg-card);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .editor-toolbar {
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-bg-tertiary);
  }

  .status-indicator {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .status-indicator::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-text-tertiary);
  }

  .status-indicator.active {
    color: var(--color-success);
  }

  .status-indicator.active::before {
    background: var(--color-success);
    box-shadow: 0 0 8px var(--color-success);
  }

  .editor-panes {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; /* 防止内容溢出 */
  }

  .pane-header {
    padding: var(--spacing-sm) var(--spacing-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* border-bottom: 1px dashed var(--color-border); */
  }

  .pane-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
  }

  .pane-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .error-badge {
    font-size: 0.75rem;
    color: var(--color-error);
    background: rgba(239, 68, 68, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .copy-btn-icon {
    padding: 4px;
    border-radius: 4px;
    color: var(--color-text-tertiary);
    transition: all 0.2s;
  }

  .copy-btn-icon:hover {
    color: var(--color-text);
    background: var(--color-bg-tertiary);
  }

  .copy-btn-icon:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .editor-textarea {
    flex: 1;
    width: 100%;
    border: none;
    border-radius: 0;
    resize: none;
    padding: var(--spacing-md);
    background: transparent;
    line-height: 1.6;
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }

  .editor-textarea:focus {
    border: none;
    outline: none;
    background: rgba(255, 255, 255, 0.02);
  }

  .editor-divider {
    width: 1px;
    background: var(--color-border);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .divider-arrow {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-tertiary);
    z-index: 10;
  }

  .text-success {
    color: var(--color-success);
  }

  /* Features */
  .features-section {
    padding: var(--spacing-3xl) 0;
    /* border-top: 1px solid var(--color-border); */
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-lg);
  }

  .feature-card {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-lg);
    color: var(--color-text);
  }

  .feature-card h3 {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .feature-card p {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }

  /* CLI Section (Tabbed) */
  .cli-section {
    padding: var(--spacing-3xl) 0;
    border-top: 1px solid var(--color-border);
  }

  .cli-card {
    max-width: 800px;
    margin: 0 auto;
    overflow: hidden;
  }

  .cli-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-tertiary);
  }

  .cli-tab {
    flex: 1;
    padding: var(--spacing-md);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .cli-tab:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.02);
  }

  .cli-tab.active {
    color: var(--color-text);
    border-bottom-color: var(--color-primary);
    background: var(--color-bg-card);
  }

  .cli-content {
    padding: var(--spacing-xl);
  }

  .code-block {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #000;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    gap: var(--spacing-md);
  }

  .code-block code {
    font-family: var(--font-mono);
    color: var(--color-text);
    border: none;
    background: transparent;
    padding: 0;
    font-size: 0.95rem;
    word-break: break-all;
  }

  .code-block.multiline {
    align-items: flex-start;
  }

  .code-block.multiline pre {
    margin: 0;
    background: transparent;
    border: none;
    padding: 0;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--color-text);
    overflow-x: auto;
  }

  .code-block.multiline code {
    word-break: normal;
    white-space: pre;
  }

  .copy-btn {
    flex-shrink: 0;
    padding: 6px 12px;
    font-size: 0.8rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    transition: all 0.2s;
  }

  .copy-btn:hover {
    color: var(--color-text);
    border-color: var(--color-text-secondary);
    background: var(--color-bg-tertiary);
  }

  .cli-hint {
    margin-top: var(--spacing-md);
    font-size: 0.9rem;
    color: var(--color-text-tertiary);
    text-align: center;
  }

  /* TTL Options */
  .ttl-options {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-right: var(--spacing-md);
  }

  .ttl-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .ttl-toggle input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
    cursor: pointer;
  }

  .ttl-label {
    font-weight: 500;
  }

  .ttl-input-group {
    display: flex;
    align-items: center;
    gap: 4px;
    transition: opacity 0.15s ease;
  }

  .ttl-input-group.ttl-hidden {
    opacity: 0;
    pointer-events: none;
  }

  .ttl-input {
    width: 60px;
    padding: 4px 8px;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }

  .ttl-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .ttl-select {
    padding: 4px 8px;
    font-size: 0.85rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-tertiary);
    color: var(--color-text);
    cursor: pointer;
  }

  .ttl-select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .ttl-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: var(--radius-sm);
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    white-space: nowrap;
  }

  .ttl-badge.expired {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  /* Footer */
  .footer {
    padding: var(--spacing-xl) 0;
    border-top: 1px solid var(--color-border);
    margin-top: auto;
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
  }

  .footer-right a:hover {
    text-decoration: underline;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }

    .editor-container {
      height: auto;
      min-height: 600px;
    }

    .editor-panes {
      flex-direction: column;
    }

    .editor-divider {
      width: 100%;
      height: 1px;
      margin: var(--spacing-xs) 0;
    }

    .divider-arrow {
      transform: rotate(90deg);
    }

    .editor-textarea {
      min-height: 200px;
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .ttl-options {
      margin-right: var(--spacing-sm);
    }

    .cli-tabs {
      flex-direction: column;
    }

    .cli-tab {
      border-bottom: 1px solid var(--color-border);
      border-left: 2px solid transparent;
    }

    .cli-tab.active {
      border-bottom-color: var(--color-border);
      border-left-color: var(--color-primary);
    }
  }
</style>
