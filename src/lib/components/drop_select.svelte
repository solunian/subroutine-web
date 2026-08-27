<script lang="ts" generics="Value extends string">
  import ChevronDown from "$lib/icons/chevron_down.svelte";
  import { tick } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { cubicOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";

  interface SelectOption<Value extends string> {
    value: Value;
    label?: string;
    disabled?: boolean;
  }

  interface Props {
    options: readonly (Value | SelectOption<Value>)[];
    value?: Value | "";
    name?: string;
    id?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    onchange?: (value: Value) => void;
  }

  const generated_id = $props.id();
  const listbox_id = `${generated_id}-listbox`;

  let {
    options,
    value = $bindable<Value | "">(""),
    name,
    id = name ?? generated_id,
    placeholder = "--- select an option ---",
    required = false,
    disabled = false,
    ariaLabel,
    onchange,
  }: Props = $props();

  let open = $state(false);
  let root: HTMLDivElement | undefined;

  let selected_index = $derived(options.findIndex((option) => get_value(option) === value));
  let selected_label = $derived(
    selected_index === -1 ? placeholder : get_label(options[selected_index])
  );

  const capture_root: Attachment<HTMLDivElement> = (node) => {
    root = node;
    return () => (root = undefined);
  };

  function get_value(option: Value | SelectOption<Value>): Value {
    return typeof option === "string" ? option : option.value;
  }

  function get_label(option: Value | SelectOption<Value>): string {
    return typeof option === "string" ? option : (option.label ?? option.value);
  }

  function is_disabled(option: Value | SelectOption<Value>): boolean {
    return typeof option === "string" ? false : (option.disabled ?? false);
  }

  function enabled_index(start: number, direction: 1 | -1): number {
    if (options.length === 0) return -1;

    for (let step = 1; step <= options.length; step += 1) {
      const index = (start + step * direction + options.length) % options.length;
      if (!is_disabled(options[index])) return index;
    }

    return -1;
  }

  async function focus_option(index: number) {
    if (index === -1) return;

    open = true;
    await tick();
    root?.querySelector<HTMLButtonElement>(`[data-option-index="${index}"]`)?.focus();
  }

  function close_menu({ restore_focus = false } = {}) {
    open = false;
    if (restore_focus) root?.querySelector<HTMLButtonElement>(":scope > button")?.focus();
  }

  function select_option(option: Value | SelectOption<Value>) {
    if (is_disabled(option)) return;

    value = get_value(option);
    onchange?.(value);
    close_menu({ restore_focus: true });
  }

  function handle_trigger_click() {
    if (disabled) return;

    if (open) {
      close_menu();
    } else {
      open = true;
    }
  }

  function handle_trigger_keydown(event: KeyboardEvent) {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      void focus_option(selected_index === -1 ? enabled_index(-1, 1) : selected_index);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      void focus_option(selected_index === -1 ? enabled_index(0, -1) : selected_index);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close_menu();
    }
  }

  function handle_option_keydown(event: KeyboardEvent, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      void focus_option(enabled_index(index, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      void focus_option(enabled_index(index, -1));
    } else if (event.key === "Home") {
      event.preventDefault();
      void focus_option(enabled_index(-1, 1));
    } else if (event.key === "End") {
      event.preventDefault();
      void focus_option(enabled_index(0, -1));
    } else if (event.key === "Escape") {
      event.preventDefault();
      close_menu({ restore_focus: true });
    } else if (event.key === "Tab") {
      close_menu();
    }
  }

  function handle_window_pointerdown(event: PointerEvent) {
    if (open && root && !root.contains(event.target as Node)) close_menu();
  }
</script>

<svelte:window onpointerdown={handle_window_pointerdown} />

<div class="relative w-full" {@attach capture_root}>
  {#if name}
    <input type="hidden" {name} {value} />
  {/if}

  <button
    type="button"
    {id}
    {disabled}
    aria-label={ariaLabel}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={listbox_id}
    class="flex h-full w-full items-center justify-between gap-3 border border-neutral-500/50 bg-transparent p-2 text-left outline-none focus:border-current disabled:cursor-not-allowed disabled:opacity-50"
    onclick={handle_trigger_click}
    onkeydown={handle_trigger_keydown}>
    <span class:text-neutral-500={selected_index === -1} class="min-w-0 truncate">
      {selected_label}
    </span>
    {#if required}<span class="sr-only">required</span>{/if}
    <span
      aria-hidden="true"
      class="pointer-events-none size-4 shrink-0 text-neutral-500 transition-transform [&_svg]:size-4"
      class:rotate-180={open}>
      <ChevronDown />
    </span>
  </button>

  {#if open}
    <div
      in:fly={{ y: -5, duration: 150, easing: cubicOut }}
      out:fade={{ duration: 90 }}
      id={listbox_id}
      role="listbox"
      aria-label={ariaLabel}
      class="absolute top-full right-0 left-0 z-20 mt-1 max-h-60 overflow-y-auto border border-neutral-500/50 bg-white shadow-[4px_4px_0_rgb(0_0_0_/0.12)] dark:bg-black dark:shadow-[4px_4px_0_rgb(255_255_255_/0.08)]">
      {#each options as option, index (get_value(option))}
        <button
          id={`${listbox_id}-option-${index}`}
          type="button"
          role="option"
          aria-selected={get_value(option) === value}
          disabled={is_disabled(option)}
          data-option-index={index}
          class={[
            "flex w-full items-center justify-between gap-3 border-b border-neutral-500/50 p-2 text-left outline-none last:border-b-0 hover:bg-black/10 focus:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10 dark:focus:bg-white/10",
            get_value(option) === value && "bg-neutral-500/20",
          ]}
          onclick={() => select_option(option)}
          onkeydown={(event) => handle_option_keydown(event, index)}>
          <span class="truncate">{get_label(option)}</span>
          <!-- {#if get_value(option) === value}
            <span class="size-1.5 shrink-0 bg-current" aria-hidden="true"></span>
          {/if} -->
        </button>
      {:else}
        <p class="px-3 py-2 text-neutral-500">no options</p>
      {/each}
    </div>
  {/if}
</div>
