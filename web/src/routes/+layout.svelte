<script lang="ts">
  import { navigating } from '$app/stores'
  import '../app.css'

  let { children } = $props()
</script>

{#if $navigating}
  <div class="loading-bar"></div>
{/if}

{@render children()}

<style>
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
