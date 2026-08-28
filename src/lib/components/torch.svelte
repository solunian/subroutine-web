<script lang="ts">
  import type { Tables } from "$lib/types/database.types";
  import { now } from "$lib/state/time.svelte";
  import { enhance } from "$app/forms";
  import NumberFlow, { NumberFlowGroup } from "@number-flow/svelte";
  import TypeIdenticon from "./type_identicon.svelte";
  import { from_now, get_n_days_date, round_to_fixed } from "$lib/helpers";
  import ArrowTrendingUp from "$lib/icons/arrow_trending_up.svelte";
  import ArrowLongRight from "$lib/icons/arrow_long_right.svelte";
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
  $effect(() => {
    optimistic_entries = entries;
  });

  let torch_on = $derived(optimistic_entries.length % 2 !== 0);

  // in milliseconds
  let [total_duration, day_trend_value, week_trend_value] = $derived.by(() => {
    const day_start_time = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const one_week_ago_time = get_n_days_date(now, -7);

    let one_day_trend = 0;
    let one_week_trend = 0;
    let total = 0;

    // sum up all pairs
    for (let i = 0; i < Math.floor(optimistic_entries.length / 2) * 2; i += 2) {
      const [start, end] = [
        new Date(optimistic_entries[i].created_at),
        new Date(optimistic_entries[i + 1].created_at),
      ];

      const diff = end.getTime() - start.getTime();
      total += diff;

      if (day_start_time < end) {
        one_day_trend += end.getTime() - Math.max(start.getTime(), day_start_time.getTime());
      }
      if (one_week_ago_time < end) {
        one_week_trend += end.getTime() - Math.max(start.getTime(), one_week_ago_time.getTime());
      }
    }

    // for last entry
    if (optimistic_entries.length % 2 !== 0) {
      const last_entry_time = new Date(
        optimistic_entries[optimistic_entries.length - 1].created_at
      ).getTime();
      total += now.getTime() - last_entry_time;
      one_day_trend += now.getTime() - Math.max(last_entry_time, day_start_time.getTime());
      one_week_trend += now.getTime() - Math.max(last_entry_time, one_week_ago_time.getTime());
    }

    // clamp trend values to be non-negative only
    return [total, Math.max(0, one_day_trend), Math.max(0, one_week_trend)];
  });

  let hrs = $derived(Math.trunc(total_duration / 1000 / 60 / 60));
  let min = $derived(Math.trunc((total_duration / 1000 / 60) % 60));
  let sec = $derived(Math.trunc((total_duration / 1000) % 60));
</script>

<div
  class={[
    "flex flex-col gap-2 border p-2 transition",
    torch_on ? "border-amber-500 bg-amber-100 dark:bg-amber-900" : "border-neutral-500/50",
  ]}>
  <h2 class="flex items-center gap-1 text-xl">
    <TypeIdenticon type={subroutine.type} /> <a {href}>{subroutine.title}</a>
  </h2>

  <div class="flex flex-col items-center gap-1 px-3 py-2 font-mono text-2xl">
    <div>
      <NumberFlowGroup>
        <NumberFlow trend={+1} format={{ minimumIntegerDigits: 2 }} value={hrs} />:<NumberFlow
          trend={+1}
          digits={{ 1: { max: 5 } }}
          format={{ minimumIntegerDigits: 2 }}
          value={min} />:<NumberFlow
          trend={+1}
          digits={{ 1: { max: 5 } }}
          format={{ minimumIntegerDigits: 2 }}
          value={sec} />
      </NumberFlowGroup>
    </div>
    <div class="bg-neutral-500/10 px-2 py-1 text-sm">
      last torch
      {#if entries.length > 0}
        {from_now(now, new Date(entries[entries.length - 1].created_at))}
      {:else}
        never
      {/if}
    </div>
    <div
      class={[
        "flex items-center gap-2 text-base transition",
        day_trend_value <= 0 ? "text-neutral-500/90" : "text-green-500/90",
      ]}>
      1D

      <span class="h-6">
        {#if day_trend_value === 0}
          <ArrowLongRight />
        {:else}
          <ArrowTrendingUp />
        {/if}
      </span>

      {round_to_fixed(Math.abs(day_trend_value) / (1000 * 60 * 60), 2)} hrs
    </div>
    <div
      class={[
        "flex items-center gap-2 text-base transition",
        week_trend_value <= 0 ? "text-neutral-500/90" : "text-green-500/90",
      ]}>
      1W

      <span class="h-6">
        {#if week_trend_value === 0}
          <ArrowLongRight />
        {:else}
          <ArrowTrendingUp />
        {/if}
      </span>

      {round_to_fixed(Math.abs(week_trend_value) / (1000 * 60 * 60), 2)} hrs
    </div>
  </div>

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
          data: null,
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
      <input hidden name="subroutine_id" value={subroutine.id} />
      <button class="w-full bg-black/10 px-2 text-lg dark:bg-white/10"
        >{torch_on ? "torch off" : "torch on"}</button>
    </form>
  {/if}
</div>
