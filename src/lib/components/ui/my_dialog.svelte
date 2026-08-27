<script lang="ts">
  import type { Snippet } from "svelte";
  import { Dialog, type WithoutChild } from "bits-ui";

  type Props = Dialog.RootProps & {
    trigger?: Snippet;
    contentProps?: WithoutChild<Dialog.ContentProps>;
    // ...other component props if you wish to pass them
  };

  let { open = $bindable(false), children, contentProps, trigger, ...restProps }: Props = $props();
</script>

<Dialog.Root bind:open {...restProps}>
  {#if trigger}
    {@render trigger()}
  {/if}
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-black/30 opacity-100 transition-opacity duration-150 ease-out data-ending-style:opacity-0 
      data-ending-style:duration-100 data-ending-style:ease-in data-starting-style:opacity-0" />
    <Dialog.Content
      {...contentProps}
      class="
      rounded-card-lg fixed top-1/3
      left-1/2 z-50 w-full max-w-[calc(100%-2rem)]
      -translate-x-1/2 -translate-y-1/2
      scale-100 border border-white/90
      bg-white/70 p-5 opacity-100 outline-hidden backdrop-blur-xl
      transition-[opacity,scale] duration-180

      ease-out data-ending-style:scale-[0.98]
      data-ending-style:opacity-0 data-ending-style:duration-130 data-ending-style:ease-in

      data-starting-style:scale-[0.97]
      data-starting-style:opacity-0

      sm:max-w-lg
      md:w-full
      dark:border-neutral-500/50 dark:bg-neutral-500/10
    ">
      {@render children?.()}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
