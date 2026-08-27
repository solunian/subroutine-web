<script lang="ts">
  import { enhance } from "$app/forms";
  import DotSemaphore from "$lib/components/dot_semaphore.svelte";
  import Torch from "$lib/components/torch.svelte";
  import TypeIdenticon from "$lib/components/type_identicon.svelte";
  import AtSymbol from "$lib/icons/at_symbol.svelte";
  import XMark from "$lib/icons/x_mark.svelte";
  import type { Database } from "$lib/types/database.types";

  let { data } = $props();

  const subtype_display_order: Database["public"]["Enums"]["subroutine_type"][] = [
    "dot",
    "semaphore",
    "torch",
  ];
  let grouped_subroutines = $derived(Map.groupBy(data.subroutines ?? [], (r) => r.type));
</script>

<div class="flex flex-col gap-2">
  <header class="flex flex-col gap-1 p-4">
    <div class="text-lg opacity-50">{data.profile.name}</div>

    <div class="flex items-center gap-4">
      <span class="flex items-center font-nova text-2xl">
        <span class="size-7"><AtSymbol /></span>
        {data.username}
      </span>

      <span
        hidden={!data.session || data.profile.id === data.user_id}
        class="flex flex-row items-stretch gap-1">
        {#if data.relationship && data.relationship.status === "accepted"}
          <button class="border px-2" disabled>friended</button>
        {:else if data.relationship && data.relationship.status === "pending" && data.relationship.requester_id === data.user_id}
          <button class="border px-2" disabled>requested</button>
        {:else if data.relationship && data.relationship.status === "pending" && data.relationship.requestee_id === data.user_id}
          <form
            method="POST"
            action="?/update_relation"
            use:enhance={() => {
              return async ({ update }) => {
                await update({ reset: false });
              };
            }}>
            <input name="other_id" value={data.profile.id} hidden />
            <input name="status" value="accepted" hidden />
            <button class="h-full border px-2" type="submit">confirm</button>
          </form>
        {:else}
          <form
            method="POST"
            action="?/request_relation"
            use:enhance={() => {
              return async ({ update }) => {
                await update({ reset: false });
              };
            }}>
            <input name="other_id" value={data.profile.id} hidden />
            <button class="border px-2" type="submit">add friend</button>
          </form>
        {/if}

        <form
          hidden={!data.relationship}
          method="POST"
          action="?/delete_relation"
          use:enhance={() => {
            return async ({ update }) => {
              await update({ reset: false });
            };
          }}>
          <input name="other_id" value={data.profile.id} hidden />
          <button type="submit" title="remove" class="h-full border px-1">
            <XMark />
          </button>
        </form>
      </span>
    </div>

    <div class="flex flex-nowrap items-center gap-2 text-nowrap opacity-50">
      <span>
        {data.subroutines?.length ?? 0}
        {(data.subroutines?.length ?? 0) !== 1 ? "subroutines" : "subroutine"}
      </span>
      <span>·</span>
      <a href="/@{data.username}/friends" class="transition-opacity hover:opacity-70">
        {data.num_friends}
        {data.num_friends !== 1 ? "friends" : "friend"}
      </a>
    </div>

    <!-- nullable -->
    {#if data.profile.bio}
      <div>{data.profile.bio}</div>
    {/if}
  </header>

  {#if data.session && data.subroutines && data.subroutines.length > 0}
    {#each subtype_display_order as subtype (subtype)}
      <h2 class="flex items-center gap-1 p-2 text-xl">
        <TypeIdenticon type={subtype} /><span>{subtype}</span>
      </h2>
      <div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {#each grouped_subroutines.get(subtype) as sub (sub.id)}
          {#if sub.type === "dot" || sub.type === "semaphore"}
            <DotSemaphore
              editable={data.is_self}
              subroutine={sub}
              entries={sub.entries}
              href="/@{data.username}/{sub.id}" />
          {:else if sub.type === "torch"}
            <Torch
              editable={data.is_self}
              subroutine={sub}
              entries={sub.entries}
              href="/@{data.username}/{sub.id}" />
          {:else}
            {`<${sub.type}>`} not implemented yet
          {/if}
        {/each}
      </div>
    {/each}
  {/if}
</div>
