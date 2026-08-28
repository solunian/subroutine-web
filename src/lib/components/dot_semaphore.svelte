<script lang="ts">
  import { enhance } from "$app/forms";
  import ArrowLongRight from "$lib/icons/arrow_long_right.svelte";
  import ChevronDown from "$lib/icons/chevron_down.svelte";
  import ChevronUp from "$lib/icons/chevron_up.svelte";
  import type { Tables } from "$lib/types/database.types";
  import LineChart from "./line_chart.svelte";
  import TypeIdenticon from "./type_identicon.svelte";

  let {
    username,
    subroutine,
    entries = [],
    href,
    editable = false,
  }: {
    username: string;
    subroutine: Tables<"subroutines">;
    entries?: Tables<"entries">[];
    href?: string;
    editable?: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  let optimistic_entries = $state(entries);
  // svelte-ignore state_referenced_locally
  let sem_value = $state(entries.at(-1)?.data?.value ?? 0);

  $effect(() => {
    optimistic_entries = entries;
    sem_value = entries.at(-1)?.data?.value ?? 0;
  });
</script>

<div class="flex flex-col gap-2 border border-neutral-500/50 p-2">
  <div>
    <h2 class="flex items-center gap-1 overflow-x-auto text-xl whitespace-nowrap">
      <TypeIdenticon type={subroutine.type} /> <a {href}>{subroutine.title}</a>
    </h2>
  </div>

  <LineChart type={subroutine.type} entries={optimistic_entries} />

  {#if editable}
    <form
      method="POST"
      action="/@{username}/{subroutine.id}?/insert_entry"
      use:enhance={({ formData }) => {
        const created_at = new Date().toISOString();
        formData.append("timestamp", created_at);

        // optimistic update
        optimistic_entries.push({
          created_at,
          data: subroutine.type === "semaphore" ? { value: sem_value } : null,
          id: "",
          subroutine_id: "",
          user_id: "",
          title: null,
          description: null,
          location: null,
          ascii_art: null,
        });
        // console.log("optimistic update");

        return async ({ result, update }) => {
          if (result.type === "error") {
            optimistic_entries.pop();
            // console.log(result.type, "(form submission failed)");
          } else {
            // console.log("success (form submitted)");
          }

          await update({ reset: false });
          // console.log("update state with fetched page data");
        };
      }}>
      {#if subroutine.type === "dot"}
        <input hidden name="subroutine_id" value={subroutine.id} />
        <button class="w-full bg-black/10 px-2 text-lg dark:bg-white/10">dot</button>
      {:else if subroutine.type === "semaphore"}
        <input hidden name="subroutine_id" value={subroutine.id} />
        <input hidden name="subroutine_type" value="semaphore" />
        <div class="flex shrink-0 gap-2">
          <input
            name="value"
            type="number"
            step="any"
            bind:value={sem_value}
            class="w-full basis-4/6 border border-neutral-500/50 bg-transparent p-2 py-2 text-center font-mono text-xl outline-none focus:border-current" />
          <div class="flex basis-1/6 flex-col gap-1">
            <button
              aria-label="increment"
              onclick={() => sem_value++}
              type="button"
              class="flex items-center justify-center border border-neutral-500/50">
              <span class="h-6">
                <ChevronUp />
              </span>
            </button>
            <button
              aria-label="decrement"
              type="button"
              onclick={() => sem_value--}
              class="flex items-center justify-center border border-neutral-500/50">
              <span class="h-6">
                <ChevronDown />
              </span>
            </button>
          </div>
          <button
            aria-label="submit"
            type="submit"
            class="flex w-full shrink-0 basis-1/6 items-center justify-center bg-black/10 px-2 text-lg dark:bg-white/10">
            <span class="h-6">
              <ArrowLongRight />
            </span>
          </button>
        </div>
      {/if}
    </form>
  {/if}
</div>
