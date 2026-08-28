<script lang="ts">
  import { enhance } from "$app/forms";
  import DropSelect from "$lib/components/drop_select.svelte";
  import { to_fulltime_str } from "$lib/helpers";
  import ArrowLeft from "$lib/icons/arrow_left.svelte";
  import ArrowRight from "$lib/icons/arrow_right.svelte";
  import PlusCircle from "$lib/icons/plus_circle.svelte";
  import XMark from "$lib/icons/x_mark.svelte";
  import type { Tables } from "$lib/types/database.types";
  import MyDialog from "./ui/my_dialog.svelte";

  let {
    username,
    subroutine_id,
    entries = [],
    editable = false,
  }: {
    username: string;
    subroutine_id: string;
    entries?: Tables<"entries">[];
    editable?: boolean;
  } = $props();

  const page_size_options = [
    { value: "32", label: "32 rows" },
    { value: "64", label: "64 rows" },
    { value: "128", label: "128 rows" },
  ] as const;
  const id = $props.id();
  let page = $state(1);
  let page_size = $state<"32" | "64" | "128">("32");
  let rows_per_page = $derived(Number(page_size));
  let total_pages = $derived(Math.max(1, Math.ceil(entries.length / rows_per_page)));
  let current_page = $derived(Math.max(1, Math.min(page, total_pages)));
  let page_start = $derived((current_page - 1) * rows_per_page);
  let visible_entries = $derived(
    entries.toReversed().slice(page_start, page_start + rows_per_page)
  );

  function go_to_page(next_page: number) {
    if (!Number.isFinite(next_page)) return;
    page = Math.max(1, Math.min(Math.trunc(next_page), total_pages));
  }

  let updating_entry = $state<string | null>(null); // uuid of updating entry
  let inserting_entry = $state(false);
</script>

<section class="border border-neutral-500/50" aria-labelledby="{id}-heading">
  <div
    class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-500/50 bg-neutral-500/10 px-6 py-2 text-neutral-500 backdrop-blur dark:bg-neutral-900/95">
    <h2 id="{id}-heading" class="text-xl">entries</h2>

    <nav
      class="flex flex-wrap items-center justify-end gap-6 text-sm"
      aria-label="Entries pagination">
      <div class="flex gap-3">
        <button
          type="button"
          class="flex size-8 items-center justify-center border border-neutral-500/50 p-1.5 text-neutral-500 transition-colors disabled:cursor-not-allowed disabled:border-neutral-500/30 disabled:text-neutral-500/50"
          aria-label="Previous page"
          disabled={current_page === 1}
          onclick={() => go_to_page(current_page - 1)}>
          <span class="size-4" aria-hidden="true"><ArrowLeft /></span>
        </button>

        <div class="flex items-center gap-1">
          <label for="{id}-page">page</label>
          <input
            id="{id}-page"
            value={current_page}
            oninput={(event) => {
              const val = Number(event.currentTarget.value);
              if (1 <= val && val <= total_pages) {
                go_to_page(val);
              }
            }}
            class="h-8 w-10 border border-neutral-500/50 bg-transparent px-1 text-center text-current outline-none focus:border-current" />
          <span>of {total_pages}</span>
        </div>

        <button
          type="button"
          class="flex size-8 items-center justify-center border border-neutral-500/50 p-1.5 transition-colors disabled:cursor-not-allowed disabled:border-neutral-500/30 disabled:text-neutral-500/50"
          aria-label="Next page"
          disabled={current_page === total_pages}
          onclick={() => go_to_page(current_page + 1)}>
          <span class="size-4" aria-hidden="true"><ArrowRight /></span>
        </button>
      </div>

      <div>
        <DropSelect
          id="{id}-page-size"
          options={page_size_options}
          bind:value={page_size}
          onchange={() => (page = 1)}
          ariaLabel="rows per page" />
      </div>

      <span>
        {entries.length}
        {entries.length === 1 ? "entry" : "entries"}
      </span>
    </nav>
  </div>

  <MyDialog bind:open={inserting_entry}>
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2 text-2xl">
        <span class="h-8"><PlusCircle /></span> insert entry
      </div>

      <form
        method="POST"
        action="/@{username}/{subroutine_id}?/insert_entry"
        use:enhance={({ formData }) => {
          formData.append("timestamp", new Date().toISOString());

          return async ({ update }) => {
            await update({ reset: false });
          };
        }}>
        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => (inserting_entry = false)}
            class="grow bg-neutral-500/25 py-1 text-lg">cancel</button>
          <button type="submit" class="grow bg-green-500/25 py-1 text-lg">insert</button>
        </div>
      </form>
    </div>
  </MyDialog>

  {#if entries.length === 0}
    <div class="flex flex-col items-center gap-2 py-20">
      <h2 class="text-2xl">no entries</h2>
      <button
        type="button"
        onclick={() => (inserting_entry = true)}
        class="flex items-center gap-1 bg-black/10 px-2 py-1 dark:bg-white/10">
        <span class="h-5"><PlusCircle /></span>
        insert entry
      </button>
    </div>
  {:else}
    <div>
      {#each visible_entries as entry, idx (entry.id)}
        {@const entry_number = entries.length - page_start - idx - 1}
        <div class="flex gap-4 border-neutral-500/50 px-2 py-2 not-last:border-b">
          <span class="basis-1/12 text-neutral-500/50">{entry_number}</span>
          <div class="flex w-full items-center justify-between gap-1">
            <span>{to_fulltime_str(new Date(entry.created_at))}</span>
            <span class="font-mono text-sm">{JSON.stringify(entry.data)}</span>
          </div>
          {#if editable}
            <form
              method="POST"
              action="/@{username}/{subroutine_id}?/delete_entry"
              use:enhance={({ formData }) => {
                formData.append("timestamp", new Date().toISOString());

                return async ({ update }) => {
                  await update({ reset: false });
                };
              }}
              class="h-6">
              <input name="entry_id" value={entry.id} hidden />
              <button aria-label="delete entry" type="submit" class="h-6">
                <XMark />
              </button>
            </form>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</section>
