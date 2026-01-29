<script lang="ts">
	import { page } from '$app/stores';
	import '../app.css';
</script>

<svelte:head>
	<title>{$page.status} - DX Encoding</title>
</svelte:head>

<div class="grid-bg"></div>

<div class="error-page">
	<div class="container flex flex-col items-center justify-center" style="min-height: 80vh;">
		<div class="card error-card animate-fade-in">
			<div class="error-header">
				<h1 class="error-code text-mono">{$page.status}</h1>
				<div class="error-divider"></div>
				<h2 class="error-title">
					{#if $page.status === 404}
						Page Not Found
					{:else}
						Something Went Wrong
					{/if}
				</h2>
			</div>

			<p class="error-message text-secondary">
				{$page.error?.message || 'Unknown error occurred'}
			</p>

			<div class="error-actions mt-lg">
				<a href="/" class="btn btn-primary">
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
						<path d="m12 19-7-7 7-7" />
						<path d="M19 12H5" />
					</svg>
					Back to Home
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.error-card {
		padding: var(--spacing-2xl);
		text-align: center;
		max-width: 480px;
		width: 100%;
		background: var(--color-bg-card);
		backdrop-filter: blur(8px);
	}

	.error-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.error-code {
		font-size: 4rem;
		font-weight: 700;
		line-height: 1;
		color: var(--color-text);
		letter-spacing: -0.05em;
	}

	.error-title {
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.error-message {
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: var(--spacing-lg);
	}

	.error-divider {
		width: 40px;
		height: 2px;
		background: var(--color-border);
		border-radius: 99px;
	}
</style>
