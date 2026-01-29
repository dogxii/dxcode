<script lang="ts">
  import { navigating } from '$app/stores'
  import '../app.css'

  let { children } = $props()
</script>

{#if $navigating}
  <div class="loading-bar"></div>
{/if}

<div class="page-layout">
  <header class="header">
    <div class="container header-inner">
      <a href="/" class="logo">
        <span class="logo-text">dxc</span>
        <span class="logo-dot">.</span>
        <span class="logo-domain">dogxi.me</span>
      </a>

      <nav class="nav">
        <a href="/showcase" class="nav-link">Showcase</a>
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

  <main class="main-content">
    {@render children()}
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-left">
        <span class="footer-copy">
          &copy; {new Date().getFullYear()} DXCode. Created by
          <a href="https://blog.dogxi.me" target="_blank">Dogxi</a>.
        </span>
      </div>
      <div class="footer-right">
        <a href="https://github.com/dogxii/dxcode" target="_blank">GitHub</a>
      </div>
    </div>
  </footer>
</div>

<style>
  .page-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .main-content {
    flex: 1;
  }

  /* Header Styles */
  .header {
    padding: var(--spacing-lg) 0;
    border-bottom: 1px solid transparent;
    transition: border-color var(--transition-normal);
  }

  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 1.25rem;
    display: flex;
    align-items: baseline;
    text-decoration: none;
  }

  .logo-text {
    color: var(--color-text);
  }

  .logo-dot {
    color: var(--color-primary);
  }

  .logo-domain {
    color: var(--color-text-tertiary);
  }

  .nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    transition: color var(--transition-fast);
  }

  .nav-link:hover {
    color: var(--color-text);
  }

  /* Footer Styles */
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

  .loading-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--color-text),
      transparent
    );
    background-size: 50% 100%;
    animation: loading 1s infinite linear;
    z-index: 9999;
  }

  @keyframes loading {
    0% {
      background-position: -50% 0;
    }
    100% {
      background-position: 150% 0;
    }
  }
</style>
