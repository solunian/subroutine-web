<script lang="ts">
  import DotSemaphore from "$lib/components/dot_semaphore.svelte";
  import Torch from "$lib/components/torch.svelte";
  import TypeIdenticon from "$lib/components/type_identicon.svelte";
  import type { PageProps } from "./$types";
  import type { Database } from "$lib/types/database.types";
  import Journal from "$lib/components/journal.svelte";
  import LandingPage from "$lib/components/landing_page.svelte";

  let { data }: PageProps = $props();

  const subtype_display_order: Database["public"]["Enums"]["subroutine_type"][] = [
    "dot",
    "semaphore",
    "torch",
    "journal",
    "summit",
    "nudge",
    "ping",
    "ledger",
    "blaze",
  ];

  let grouped_subroutines = $derived(Map.groupBy(data.subroutines ?? [], (r) => r.type));
</script>

<main class="flex flex-col gap-2 py-2">
  {#if data.session && data.username}
    {#each subtype_display_order as subtype (subtype)}
      <h2 class="flex items-center gap-1 p-2 text-xl">
        <TypeIdenticon type={subtype} /><span>{subtype}</span>
      </h2>
      {#if (grouped_subroutines.get(subtype) ?? []).length === 0}
        <div>._.</div>
      {:else}
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {#each grouped_subroutines.get(subtype) as sub (sub.id)}
            {#if sub.type === "dot" || sub.type === "semaphore"}
              <DotSemaphore
                username={data.username}
                subroutine={sub}
                entries={sub.entries}
                href="/@{data.username}/{sub.id}"
                editable />
            {:else if sub.type === "torch"}
              <Torch
                username={data.username}
                subroutine={sub}
                entries={sub.entries}
                href="/@{data.username}/{sub.id}"
                editable />
            {:else if sub.type === "journal"}
              <Journal
                username={data.username}
                subroutine={sub}
                entries={sub.entries}
                href="/@{data.username}/{sub.id}"
                editable />
            {:else}
              {`<${sub.type}>`} not implemented yet
            {/if}
          {/each}
        </div>
      {/if}
    {/each}
  {:else}
    <LandingPage />
  {/if}
</main>
