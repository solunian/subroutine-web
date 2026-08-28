<script lang="ts">
  import ArrowRight from "$lib/icons/arrow_right.svelte";
  import NullSet from "$lib/icons/null_set.svelte";

  let { data } = $props();

  let friend_count = $derived(data.friends?.length ?? 0);
</script>

<main class="mx-auto w-full max-w-3xl py-8 sm:py-14">
  <section class="border border-neutral-500/50">
    <header class="border-b border-neutral-500/50 p-5 sm:p-7">
      <!-- <a
        href="/@{data.username}"
        class="mb-5 inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-inherit">
        <span class="size-4"><ArrowLeft /></span>
        back to profile
      </a> -->

      <div class="flex flex-wrap items-end justify-between gap-2">
        <h1 class="font-nova text-3xl sm:text-4xl">{">/friends"}</h1>

        <div class="flex w-full gap-2">
          <div class=" text-neutral-500">
            connections for
            <a href="/@{data.username}" class="transition-opacity hover:opacity-70">
              @{data.username}
            </a>
          </div>

          {#if data.friends}
            <span>·</span>
            <span class="text-neutral-500">
              {friend_count}
              {friend_count === 1 ? "connection" : "connections"}
            </span>
          {/if}
        </div>
      </div>
    </header>

    {#if !data.friends}
      <div class="p-8 text-center sm:p-12">
        <div class="mx-auto mb-4 size-8 text-neutral-500"><NullSet /></div>
        <h2 class="text-lg">friends list unavailable</h2>
        <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
          this list is only visible to @{data.username} and their friends.
        </p>
      </div>
    {:else if data.friends.length === 0}
      <div class="p-8 text-center sm:p-12">
        <div class="mx-auto mb-4 size-8 text-neutral-500"><NullSet /></div>
        <h2 class="text-lg">no friends yet</h2>
        <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
          new connections will appear here once friend requests are accepted.
        </p>
      </div>
    {:else}
      <ul class="divide-y divide-neutral-500/25">
        {#each data.friends as friend (friend.username)}
          <li>
            <a
              href="/@{friend.username}"
              aria-label="View @{friend.username}'s profile"
              class="group flex items-center gap-4 p-4 transition-colors hover:bg-neutral-500/10 sm:px-7">
              <span
                class="flex size-10 shrink-0 items-center justify-center border border-neutral-500/50 font-nova text-lg text-neutral-500 transition-colors group-hover:border-current group-hover:text-inherit"
                aria-hidden="true">
                {(friend.name || friend.username).slice(0, 1).toUpperCase()}
              </span>

              <span class="min-w-0 flex-1">
                <span class="block truncate">{friend.name || friend.username}</span>
                <span class="block truncate text-sm text-neutral-500">@{friend.username}</span>
              </span>

              <span
                class="size-5 shrink-0 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-inherit"
                aria-hidden="true">
                <ArrowRight />
              </span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}

    <footer class="border-t border-neutral-500/50 px-5 py-3 sm:px-7">
      <p class="font-mono text-xs text-neutral-500">profiles open at /@username</p>
    </footer>
  </section>
</main>
