<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import {
    dxDecode,
    isDxEncoded,
    getTtlInfo,
    hasTtl,
    type TtlInfo,
  } from '$lib/dxcode'
  import { fade, slide } from 'svelte/transition'

  // 状态
  let decodedContent = $state('')
  let error = $state('')
  let loading = $state(true)
  let ttlInfo = $state<TtlInfo | null>(null)
  let copied = $state(false)
  let copiedLink = $state(false)
  let rawDxCode = $state('')

  // 从 URL 获取编码数据
  function getEncodedFromUrl(): string | null {
    const params = $page.url.searchParams
    return params.get('d') || params.get('data') || params.get('code')
  }

  // 解码函数
  function decodeContent(encoded: string) {
    rawDxCode = encoded
    loading = true
    error = ''
    decodedContent = ''
    ttlInfo = null

    try {
      if (!isDxEncoded(encoded)) {
        error = '无效的 DX 编码格式'
        loading = false
        return
      }

      // 检查 TTL
      if (hasTtl(encoded)) {
        ttlInfo = getTtlInfo(encoded)
      }

      // 解码（不检查 TTL，让用户自己决定是否信任过期数据）
      decodedContent = dxDecode(encoded, {
        asString: true,
        checkTtl: false,
      }) as string

      error = ''
    } catch (e) {
      error = e instanceof Error ? e.message : '解码失败'
    } finally {
      loading = false
    }
  }

  // URL 链接化
  function linkify(text: string): string {
    // URL 正则表达式
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g
    // Email 正则
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g

    let result = text
      // 先转义 HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // 链接化 URL
      .replace(
        urlRegex,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="content-link">$1</a>',
      )
      // 链接化 Email
      .replace(emailRegex, '<a href="mailto:$1" class="content-link">$1</a>')

    return result
  }

  // 复制功能
  async function copyContent() {
    if (!decodedContent) return

    try {
      await navigator.clipboard.writeText(decodedContent)
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch {
      error = '复制失败'
    }
  }

  // 复制当前分享链接
  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      copiedLink = true
      setTimeout(() => (copiedLink = false), 2000)
    } catch {
      error = '复制链接失败'
    }
  }

  // 格式化时间
  function formatTime(ts: number): string {
    return new Date(ts * 1000).toLocaleString('zh-CN')
  }

  // 计算剩余秒数
  function getRemainingSeconds(info: TtlInfo): number {
    if (info.ttlSeconds === 0 || info.expiresAt === null) {
      return Infinity
    }
    const now = Math.floor(Date.now() / 1000)
    return Math.max(0, info.expiresAt - now)
  }

  // 格式化剩余时间
  function formatRemaining(info: TtlInfo): string {
    const seconds = getRemainingSeconds(info)
    if (seconds === Infinity) return '永不过期'
    if (seconds <= 0) return '已过期'
    if (seconds < 60) return `${seconds} 秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
    if (seconds < 86400)
      return `${Math.floor(seconds / 3600)} 小时 ${Math.floor((seconds % 3600) / 60)} 分钟`
    return `${Math.floor(seconds / 86400)} 天 ${Math.floor((seconds % 86400) / 3600)} 小时`
  }

  // 检测内容类型
  function getContentType(content: string): 'text' | 'json' | 'code' {
    const trimmed = content.trim()
    // JSON 检测
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        JSON.parse(trimmed)
        return 'json'
      } catch {
        // not JSON
      }
    }
    // 代码检测（简单启发式）
    if (
      trimmed.includes('function ') ||
      trimmed.includes('const ') ||
      trimmed.includes('import ') ||
      trimmed.includes('def ') ||
      trimmed.includes('class ')
    ) {
      return 'code'
    }
    return 'text'
  }

  // 格式化 JSON
  function formatJson(content: string): string {
    try {
      return JSON.stringify(JSON.parse(content), null, 2)
    } catch {
      return content
    }
  }

  onMount(() => {
    const encoded = getEncodedFromUrl()
    if (encoded) {
      decodeContent(encoded)
    } else {
      loading = false
      error = '未提供编码数据。请在 URL 中添加 ?d=<dx编码> 参数'
    }
  })

  // 计算内容类型
  let contentType = $derived(
    decodedContent ? getContentType(decodedContent) : 'text',
  )
  let displayContent = $derived(
    contentType === 'json' ? formatJson(decodedContent) : decodedContent,
  )
</script>

<svelte:head>
  <title>查看分享内容 | DXCode</title>
  <meta name="description" content="查看 DX 编码分享的内容" />
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="grid-bg"></div>

<div class="view-page">
  <div class="container">
    {#if loading}
      <div class="loading-state" in:fade>
        <div class="spinner"></div>
        <p>正在解码...</p>
      </div>
    {:else if error}
      <div class="error-state card" in:fade>
        <div class="error-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>解码失败</h2>
        <p class="error-message">{error}</p>
        <a href="/" class="btn btn-primary">前往编码器</a>
      </div>
    {:else}
      <div class="content-card card" in:fade>
        <!-- 头部信息 -->
        <div class="content-header">
          <div class="header-left">
            <h1 class="content-title">
              <span class="dx-badge">DX</span>
              分享内容
            </h1>
            {#if ttlInfo}
              <div
                class="ttl-info"
                class:expired={ttlInfo.isExpired}
                transition:slide
              >
                {#if ttlInfo.isExpired}
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>已过期（创建于 {formatTime(ttlInfo.createdAt)}）</span>
                {:else if ttlInfo.ttlSeconds === 0}
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
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>永不过期（创建于 {formatTime(ttlInfo.createdAt)}）</span
                  >
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
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>剩余 {formatRemaining(ttlInfo)}</span>
                {/if}
              </div>
            {/if}
          </div>
          <div class="header-actions">
            <button
              class="btn btn-ghost"
              onclick={copyShareLink}
              title="复制分享链接"
            >
              {#if copiedLink}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                已复制
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                  />
                  <path
                    d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                  />
                </svg>
                复制链接
              {/if}
            </button>
            <button
              class="btn btn-primary"
              onclick={copyContent}
              disabled={!decodedContent}
            >
              {#if copied}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                已复制
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path
                    d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  />
                </svg>
                复制内容
              {/if}
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div
          class="content-body"
          class:is-json={contentType === 'json'}
          class:is-code={contentType === 'code'}
        >
          {#if contentType === 'text'}
            <div class="text-content">
              {@html linkify(displayContent)}
            </div>
          {:else}
            <pre class="code-content"><code>{displayContent}</code></pre>
          {/if}
        </div>

        <!-- 底部信息 -->
        <div class="content-footer">
          <div class="footer-info">
            <span class="info-item">
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
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {decodedContent.length} 字符
            </span>
            <span class="info-item">
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
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              {contentType === 'json'
                ? 'JSON'
                : contentType === 'code'
                  ? '代码'
                  : '文本'}
            </span>
          </div>
          <a href="/#editor" class="footer-link">
            在编码器中打开
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
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>

      <!-- 原始编码（可折叠） -->
      <details class="raw-code-section">
        <summary class="raw-code-toggle">
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
            <polyline points="9 18 15 12 9 6" />
          </svg>
          查看原始 DX 编码
        </summary>
        <div class="raw-code-content card">
          <code class="raw-code">{rawDxCode}</code>
        </div>
      </details>
    {/if}
  </div>
</div>

<style>
  .view-page {
    min-height: calc(100vh - 200px);
    padding: var(--spacing-2xl) 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .view-page .container {
    width: 100%;
    max-width: 800px;
  }

  /* 加载状态 */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl);
    color: var(--color-text-secondary);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-text);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: var(--spacing-md);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* 错误状态 */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl);
    text-align: center;
  }

  .error-icon {
    color: var(--color-error);
    margin-bottom: var(--spacing-lg);
    opacity: 0.8;
  }

  .error-state h2 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-sm);
  }

  .error-message {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xl);
    max-width: 400px;
  }

  /* 内容卡片 */
  .content-card {
    overflow: hidden;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .content-title {
    font-size: 1.25rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .dx-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-text);
    color: var(--color-bg);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 700;
    font-family: var(--font-mono);
  }

  .ttl-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    width: fit-content;
  }

  .ttl-info.expired {
    color: var(--color-error);
    background: rgba(239, 68, 68, 0.1);
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  /* 内容区域 */
  .content-body {
    padding: var(--spacing-lg);
    min-height: 200px;
    max-height: 60vh;
    overflow: auto;
  }

  .text-content {
    font-size: 1rem;
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .text-content :global(.content-link) {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: opacity var(--transition-fast);
  }

  .text-content :global(.content-link:hover) {
    opacity: 0.7;
  }

  .code-content {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
    overflow: visible;
  }

  .code-content code {
    background: transparent;
    border: none;
    padding: 0;
  }

  .content-body.is-json,
  .content-body.is-code {
    background: var(--color-bg-secondary);
  }

  /* 底部信息 */
  .content-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }

  .footer-info {
    display: flex;
    gap: var(--spacing-lg);
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.8rem;
    color: var(--color-text-tertiary);
  }

  .footer-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    transition: color var(--transition-fast);
  }

  .footer-link:hover {
    color: var(--color-text);
  }

  /* 原始编码区域 */
  .raw-code-section {
    margin-top: var(--spacing-lg);
  }

  .raw-code-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
    padding: var(--spacing-sm) 0;
    transition: color var(--transition-fast);
  }

  .raw-code-toggle:hover {
    color: var(--color-text-secondary);
  }

  .raw-code-toggle svg {
    transition: transform var(--transition-fast);
  }

  details[open] .raw-code-toggle svg {
    transform: rotate(90deg);
  }

  .raw-code-content {
    margin-top: var(--spacing-sm);
    padding: var(--spacing-md);
    overflow: auto;
  }

  .raw-code {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    word-break: break-all;
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    padding: 0;
  }

  /* 响应式 */
  @media (max-width: 640px) {
    .view-page {
      padding: var(--spacing-lg) 0;
    }

    .content-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      justify-content: stretch;
    }

    .header-actions .btn {
      flex: 1;
      justify-content: center;
    }

    .content-footer {
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: stretch;
    }

    .footer-info {
      justify-content: center;
    }

    .footer-link {
      justify-content: center;
    }
  }
</style>
