<script lang="ts">
  import { enhance } from "$app/forms";
  import ActivityGrid from "$lib/components/activity_grid.svelte";
  import DotSemaphore from "$lib/components/dot_semaphore.svelte";
  import Entries from "$lib/components/entries.svelte";
  import Torch from "$lib/components/torch.svelte";
  import TypeIdenticon from "$lib/components/type_identicon.svelte";
  import { to_date_str } from "$lib/helpers";
  import AtSymbol from "$lib/icons/at_symbol.svelte";

  let { data } = $props();
</script>

{#if data.session}
  <div class="flex flex-col gap-4">
    <header class="flex flex-col gap-1 p-4">
      <a href="/@{data.username}" class="flex items-center font-nova text-xl opacity-50">
        <span class="size-5"><AtSymbol /></span>
        {data.username}
      </a>

      <h1 class="flex items-center gap-1 text-2xl">
        <TypeIdenticon type={data.subroutine.type} />
        {data.subroutine.title}
      </h1>

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
