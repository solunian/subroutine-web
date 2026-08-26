<script lang="ts">
  import { enhance } from "$app/forms";
  import ActivityGrid from "$lib/components/activity_grid.svelte";
  import DotSemaphore from "$lib/components/dot_semaphore.svelte";
  import DropdownMenuContent from "$lib/components/dropdown_menu_content.svelte";
  import Entries from "$lib/components/entries.svelte";
  import Torch from "$lib/components/torch.svelte";
  import TypeIdenticon from "$lib/components/type_identicon.svelte";
  import { to_date_str } from "$lib/helpers";
  import AtSymbol from "$lib/icons/at_symbol.svelte";
  import Check from "$lib/icons/check.svelte";
  import EllipsisHorizontal from "$lib/icons/ellipsis_horizontal.svelte";
  import Pencil from "$lib/icons/pencil.svelte";
  import Trash from "$lib/icons/trash.svelte";
  import XMark from "$lib/icons/x_mark.svelte";
  import { DropdownMenu } from "bits-ui";

  let { data } = $props();

  let editing_title = $state(false);
  let title_input = $state<HTMLInputElement>();

  $effect(() => {
    if (editing_title) {
      title_input?.focus();
    }
  });
</script>

{#if data.session}
  <div class="flex flex-col gap-4">
    <header class="flex flex-col gap-1 p-4">
      <a href="/@{data.username}" class="flex items-center font-nova text-xl opacity-50">
        <span class="size-5"><AtSymbol /></span>
        {data.username}
      </a>

      <div class="flex items-center gap-1 text-2xl">
        <TypeIdenticon type={data.subroutine.type} />
        <div class="flex gap-2">
          {#if !editing_title}
            <h1 class="h-8">{data.subroutine.title}</h1>
          {:else}
            <form
              method="POST"
              action="?/edit_subroutine"
              use:enhance={() => {
                return async ({ update }) => {
                  editing_title = false;
                  await update({ reset: false });
                };
              }}
              class="flex h-8 gap-2">
              <input name="subroutine_id" value={data.subroutine.id} class="hidden" />
              <input
                bind:this={title_input}
                name="title"
                value={data.subroutine.title}
                required
                class="field-sizing-content h-full min-w-24 border border-neutral-500 px-1 outline-none focus:border-current" />
              <button
                type="button"
                onclick={() => (editing_title = false)}
                class="flex aspect-square h-full shrink-0 items-center justify-center border border-neutral-500 p-1">
                <XMark />
              </button>
              <button
                type="submit"
                class="flex aspect-square h-full shrink-0 items-center justify-center border border-neutral-500 p-1">
                <Check />
              </button>
            </form>
          {/if}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class="text-neutral-500">
              <EllipsisHorizontal />
            </DropdownMenu.Trigger>
            <DropdownMenuContent forceMount align="start">
              <DropdownMenu.Item>
                <button
                  onclick={() => (editing_title = true)}
                  class="hover:text-curing-current flex min-w-40 items-center gap-2 p-2 text-left text-neutral-500 transition-colors duration-150 hover:bg-neutral-500/10">
                  <span class="size-5"><Pencil /></span> rename
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <button
                  class="hover:text-curing-current flex min-w-40 items-center gap-2 p-2 text-left text-neutral-500 transition-colors duration-150 hover:bg-neutral-500/10">
                  <span class="size-5"><Trash /></span> delete
                </button>
              </DropdownMenu.Item>
            </DropdownMenuContent>
          </DropdownMenu.Root>
        </div>
      </div>

      <div class="flex flex-nowrap items-center gap-2 text-nowrap opacity-50">
        <span>{to_date_str(new Date(data.subroutine.created_at))}</span>
        <span>·</span>
        <span>{data.entries.length} {(data.entries.length ?? 0) !== 1 ? "entries" : "entry"}</span>
      </div>

      <!-- nullable -->
      {#if data.subroutine.description}
        <div>{data.subroutine.description}</div>
      {/if}
    </header>

    <div class="max-w-5xl">
      {#if data.subroutine.type === "dot" || data.subroutine.type === "semaphore"}
        <DotSemaphore editable={data.is_self} subroutine={data.subroutine} entries={data.entries} />
      {:else if data.subroutine.type === "torch"}
        <Torch editable={data.is_self} subroutine={data.subroutine} entries={data.entries} />
      {:else}
        <div class="flex aspect-video w-full items-center justify-center border font-mono">
          not implemented yet -_-
        </div>
      {/if}
    </div>

    <ActivityGrid entries={data.entries} subroutine_type={data.subroutine.type} />

    <Entries entries={data.entries} editable={data.is_self} />

    <form
      method="POST"
      action="?/delete_subroutine"
      use:enhance={() => {
        return async ({ update }) => {
          await update({ reset: false });
        };
      }}>
      <input hidden name="subroutine_id" value={data.subroutine.id} />
      <button type="submit" class="border px-3 py-1 text-xl text-red-500/50">delete</button>
    </form>
  </div>
{/if}
