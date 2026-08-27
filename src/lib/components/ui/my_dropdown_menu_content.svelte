<script lang="ts">
  import type { Snippet } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { DropdownMenu, type WithoutChildrenOrChild } from "bits-ui";
  import { cubicOut } from "svelte/easing";

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: WithoutChildrenOrChild<DropdownMenu.ContentProps> & {
    children?: Snippet;
  } = $props();
</script>

<DropdownMenu.Content bind:ref {...restProps} forceMount>
  {#snippet child({ wrapperProps, props, open })}
    {#if open}
      <div {...wrapperProps}>
        <div
          {...props}
          in:fly={{ y: -5, duration: 150, easing: cubicOut }}
          out:fade={{ duration: 90 }}
          class="z-10 flex flex-col gap-1 border border-neutral-500/50 bg-neutral-500/10 p-1 text-base shadow-[4px_4px_0_rgb(0_0_0_/0.12)] backdrop-blur-lg dark:shadow-[4px_4px_0_rgb(255_255_255_/0.08)]">
          {@render children?.()}
        </div>
      </div>
    {/if}
  {/snippet}
</DropdownMenu.Content>
