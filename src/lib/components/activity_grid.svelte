<script lang="ts">
  import { get_day_start, get_next_day, to_date_str, to_duration_str } from "$lib/helpers";
  import { now } from "$lib/state/time.svelte";
  import type { Tables } from "$lib/types/database.types";

  type EntryActivity = Pick<Tables<"entries">, "created_at">;
  type SubroutineType = Tables<"subroutines">["type"];
  type ActivityByDay = Record<string, number>;
  type Props = {
    entries?: EntryActivity[];
    weeks?: number;
    subroutine_type?: SubroutineType;
  };
  type GridDay = {
    date: Date;
    key: string;
    value: number;
    is_today: boolean;
  };
  type WeekColumn = {
    key: string;
    label: string;
    days: GridDay[];
  };

  let { entries = [], weeks = 52, subroutine_type }: Props = $props();

  // The grid starts on Monday and only labels alternating rows to save space.
  const short_day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  // Add a timed session to each calendar day it crosses.
  function add_duration(activity: ActivityByDay, start: Date, end: Date) {
    let cursor = get_day_start(start);

    while (cursor < end) {
      const key = to_date_str(cursor);
      const next_day = get_next_day(cursor);
      const segment_start = Math.max(start.getTime(), cursor.getTime());
      const segment_end = Math.min(end.getTime(), next_day.getTime());
      activity[key] = (activity[key] ?? 0) + Math.max(0, segment_end - segment_start);
      cursor = next_day;
    }
  }

  // Convert entries into one value per day: entry counts normally, durations for torches.
  function get_activity_by_day(end: Date): ActivityByDay {
    const activity: ActivityByDay = {};

    if (subroutine_type !== "torch") {
      for (const entry of entries) {
        const key = to_date_str(new Date(entry.created_at));
        activity[key] = (activity[key] ?? 0) + 1;
      }
      return activity;
    }

    // Torch entries alternate between session start and session end.
    const complete_entry_count = entries.length - (entries.length % 2);
    for (let idx = 0; idx < complete_entry_count; idx += 2) {
      add_duration(
        activity,
        new Date(entries[idx].created_at),
        new Date(entries[idx + 1].created_at)
      );
    }

    // An unmatched final entry means the current session is still running.
    if (entries.length % 2 !== 0) {
      add_duration(activity, new Date(entries.at(-1)!.created_at), end);
    }

    return activity;
  }

  // Choose a color by comparing a day with the busiest day in the visible grid.
  function activity_class(value: number, max_value: number) {
    if (value <= 0 || max_value <= 0) return "bg-neutral-500/15";

    const colors =
      subroutine_type === "torch"
        ? ["bg-amber-500/20", "bg-amber-500/40", "bg-amber-500/60", "bg-amber-500/80"]
        : ["bg-green-500/20", "bg-green-500/40", "bg-green-500/60", "bg-green-500/80"];
    const intensity = value / max_value;

    if (intensity >= 0.8) return colors[3];
    if (intensity >= 0.4) return colors[2];
    if (intensity >= 0.2) return colors[1];
    return colors[0];
  }

  // Build everything the template needs in one reactive pass.
  let grid = $derived.by(() => {
    const today = get_day_start(now);
    const today_key = to_date_str(today);
    const activity = get_activity_by_day(now);

    // Include the requested range, then extend backwards to the preceding Monday.
    const requested_start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (weeks * 7 - 1)
    );
    const start = new Date(
      requested_start.getFullYear(),
      requested_start.getMonth(),
      requested_start.getDate() - ((requested_start.getDay() + 6) % 7)
    );

    const grid_days: GridDay[] = [];
    let max_value = 0;

    for (let cursor = start; cursor <= today; cursor = get_next_day(cursor)) {
      const key = to_date_str(cursor);
      const value = activity[key] ?? 0;
      grid_days.push({
        date: new Date(cursor),
        key,
        value,
        is_today: key === today_key,
      });
      max_value = Math.max(max_value, value);
    }

    // Split the flat day list into the vertical week columns shown by the UI.
    const week_days: GridDay[][] = [];
    for (let idx = 0; idx < grid_days.length; idx += 7) {
      week_days.push(grid_days.slice(idx, idx + 7));
    }

    // Label the first visible week and the first Monday of each month.
    const labels = week_days.map((week, idx) => {
      const first = week[0]?.date;
      if (!first) return "";
      if (idx === 0 || first.getDate() <= 7) {
        return first.toLocaleDateString("en", { month: "short" }).toLowerCase();
      }
      return "";
    });

    const columns: WeekColumn[] = week_days.map((days, idx) => ({
      key: days[0]?.key ?? String(idx),
      // Hide the earlier label if two adjacent labels would overlap.
      label: labels[idx + 1] ? "" : labels[idx],
      days,
    }));

    return { columns, days: grid_days, max_value, today_key };
  });

  // Hovering temporarily replaces today's summary in the footer.
  let hovered_day_key = $state<string | null>(null);
  let selected_day = $derived(
    grid.days.find((day) => day.key === (hovered_day_key ?? grid.today_key)) ?? grid.days.at(-1)
  );
</script>

<div class="max-w-fit border border-neutral-500/50">
  <div class="overflow-x-auto p-4">
    <div
      class="inline-grid gap-x-2 gap-y-1 p-2"
      role="presentation"
      onpointerleave={() => (hovered_day_key = null)}>
      <!-- Month labels share the same columns as the activity grid below. -->
      <div
        class="grid gap-0.5 pl-8"
        style:grid-template-columns="repeat({grid.columns.length}, 0.75rem)">
        {#each grid.columns as column (column.key)}
          <div class="h-4 text-xs text-neutral-500">{column.label}</div>
        {/each}
      </div>

      <!-- Weekday names sit beside one vertical column for each week. -->
      <div class="inline-flex gap-0.5 pt-1">
        <div class="flex w-8 flex-col gap-0.5 text-xs text-neutral-500">
          {#each short_day_names as day_name, day_idx (day_name)}
            <div class="h-3">
              {day_idx % 2 === 0 ? day_name : ""}
            </div>
          {/each}
        </div>

        {#each grid.columns as column (column.key)}
          <div class="flex flex-col gap-0.5">
            {#each column.days as day (day.key)}
              <div
                class="size-3"
                role="presentation"
                onpointerenter={() => (hovered_day_key = day.key)}
                onpointerleave={() => (hovered_day_key = null)}>
                <div
                  class={[
                    "size-3 border border-neutral-500/10 transition hover:border-neutral-500/70",
                    day.is_today && hovered_day_key === null && "border-neutral-500/70",
                    activity_class(day.value, grid.max_value),
                  ]}>
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Show today's value by default, or the hovered day's value. -->
  {#if selected_day}
    <div
      class="flex w-full justify-between border-t border-neutral-500/50 px-3 py-2 font-mono text-base text-neutral-500">
      <span>{selected_day.key}</span>

      <span>
        {#if subroutine_type === "torch"}
          <span>{to_duration_str(selected_day.value)}</span>
        {:else}
          <span>
            {selected_day.value}
            {selected_day.value === 1 ? "entry" : "entries"}
          </span>
        {/if}
      </span>
    </div>
  {/if}
</div>
