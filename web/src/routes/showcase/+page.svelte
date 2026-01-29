<script lang="ts">
  import { fade } from 'svelte/transition'
  import '../../app.css'

  let activeScenarioTab = $state('comparison')
</script>

<svelte:head>
  <title>Showcase - DXCode</title>
  <meta
    name="description"
    content="Explore DXCode capabilities: Smart compression, URL state management, and secure configuration."
  />
</svelte:head>

<div class="grid-bg"></div>

<div class="page-container">
  <div class="container">
    <header class="showcase-header text-center mb-xl">
      <h1 class="page-title">为什么选择 DXCode?</h1>
      <p class="page-subtitle text-secondary">
        智能压缩、内置有效期、以及完整性校验。
        <br />
        专为现代应用场景设计的编码方案。
      </p>
    </header>

    <div class="scenarios-card card">
      <div class="cli-tabs">
        <button
          class="cli-tab"
          class:active={activeScenarioTab === 'comparison'}
          onclick={() => (activeScenarioTab = 'comparison')}
        >
          体积对比
        </button>
        <button
          class="cli-tab"
          class:active={activeScenarioTab === 'url'}
          onclick={() => (activeScenarioTab = 'url')}
        >
          URL 状态
        </button>
        <button
          class="cli-tab"
          class:active={activeScenarioTab === 'config'}
          onclick={() => (activeScenarioTab = 'config')}
        >
          安全配置
        </button>
      </div>

      <div class="scenarios-content">
        {#if activeScenarioTab === 'comparison'}
          <div class="scenario-panel" in:fade={{ duration: 200 }}>
            <div class="chart-container">
              <div class="chart-row">
                <div class="chart-label">Base64</div>
                <div class="chart-bar-wrapper">
                  <div class="chart-bar base64" style="width: 100%"></div>
                  <span class="chart-value">1,368 bytes</span>
                </div>
              </div>
              <div class="chart-row">
                <div class="chart-label text-primary">DXCode</div>
                <div class="chart-bar-wrapper">
                  <div class="chart-bar dx" style="width: 45%"></div>
                  <span class="chart-value text-primary">612 bytes</span>
                </div>
              </div>
            </div>
            <p class="scenario-desc">
              针对典型 JSON 配置文件 (~1KB) 的编码体积对比。 DXCode 使用 <strong>DEFLATE</strong>
              算法显著减小载荷体积，同时保持便携性。
            </p>
          </div>
        {:else if activeScenarioTab === 'url'}
          <div class="scenario-panel" in:fade={{ duration: 200 }}>
            <div class="code-preview">
              <div class="preview-item">
                <div class="preview-header">
                  <span>原始 URL (Base64)</span>
                  <span class="preview-meta text-error">2000+ chars (可能截断)</span>
                </div>
                <div class="code-block single-line">
                  <code
                    >https://api.example.com/v1/share?state=eyJmaWx0ZXJzIjp7ImNhdGVnb3J5IjpbImVsZWN0cm9uaWNzIiwiY29tcHV0ZXJzIl0sInByaWNlX3JhbmdlIjp7Im1pbiI6MTAwMCwibWF4Ijo1MDAwfSwic29ydCI6InByaWNlX2FzYyJ9LCJ1c2VyX3ByZWZlcmVuY2VzIjp7InRoZW1lIjoiZGFyayIsImxhbmd1YWdlIjoiZW4tdXMiLCJub3RpZmljYXRpb25zIjp0cnVlfSwic2Vzc2lvbl9pZCI6Ijh...</code
                  >
                </div>
              </div>
              <div class="preview-item">
                <div class="preview-header">
                  <span class="text-primary">DXCode URL</span>
                  <span class="preview-meta text-success">安全 & 紧凑</span>
                </div>
                <div class="code-block single-line">
                  <code class="text-primary"
                    >https://api.example.com/v1/share?state=dx1.7ZRBcsIwEEX3OYW...</code
                  >
                </div>
              </div>
            </div>
            <p class="scenario-desc">
              完美的 <strong>URL 状态容器</strong>。不仅体积更小，内置的 CRC16
              校验还能防止因链接截断或复制错误导致的解析崩溃。
            </p>
          </div>
        {:else if activeScenarioTab === 'config'}
          <div class="scenario-panel" in:fade={{ duration: 200 }}>
            <div class="config-demo">
              <div class="code-block">
                <code>dx1.t1726588800.7ZRBcsIwEEX3OYW...</code>
              </div>
            </div>
            <div class="text-center mt-md">
              <div class="config-badge justify-center">
                <span class="ttl-badge">有效期: 24小时</span>
                <span class="ttl-badge">格式: JSON</span>
                <span class="ttl-badge">压缩: DEFLATE</span>
              </div>
            </div>
            <p class="scenario-desc">
              <strong>“阅后即焚”</strong> 的配置分发。 将敏感配置（如数据库连接串、API
              Keys）编码为带有 TTL 的短字符串。过期后解码器自动拒绝，无需中心化服务器验证。
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .page-container {
    padding-top: var(--spacing-3xl);
    padding-bottom: var(--spacing-3xl);
  }

  .showcase-header {
    margin-bottom: var(--spacing-2xl);
  }

  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: var(--spacing-md);
    background: linear-gradient(to right, var(--color-text), var(--color-text-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .page-subtitle {
    font-size: 1.1rem;
    line-height: 1.6;
  }

  /* Scenarios Card */
  .scenarios-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .scenarios-content {
    padding: var(--spacing-xl);
    min-height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .scenario-panel {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .scenario-desc {
    margin-top: var(--spacing-xl);
    color: var(--color-text-secondary);
    font-size: 1rem;
    line-height: 1.6;
    max-width: 600px;
    text-align: center;
  }

  /* Tabs */
  .cli-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }

  .cli-tab {
    flex: 1;
    padding: var(--spacing-md);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all var(--transition-fast);
  }

  .cli-tab:hover {
    color: var(--color-text);
    background: var(--color-bg-tertiary);
  }

  .cli-tab.active {
    color: var(--color-text);
    border-bottom-color: var(--color-primary);
    background: var(--color-bg-card);
  }

  /* Charts */
  .chart-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    width: 100%;
    max-width: 600px;
  }

  .chart-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .chart-label {
    width: 80px;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    text-align: right;
  }

  .chart-bar-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .chart-bar {
    height: 28px;
    border-radius: 4px;
    transition: width 1s ease-out;
  }

  .chart-bar.base64 {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
  }

  .chart-bar.dx {
    background: var(--color-text);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
  }

  .chart-value {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    min-width: 80px;
  }

  /* Preview */
  .code-preview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    width: 100%;
    max-width: 600px;
  }

  .preview-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .code-block.single-line {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    overflow-x: auto;
    white-space: nowrap;
  }

  .text-error {
    color: var(--color-error);
  }

  .text-success {
    color: var(--color-success);
  }

  /* Config Demo */
  .config-demo {
    background: var(--color-bg-tertiary);
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }

  .config-badge {
    display: flex;
    gap: var(--spacing-sm);
  }

  .ttl-badge {
    display: inline-flex;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }

  @media (max-width: 768px) {
    .page-title {
      font-size: 2rem;
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
