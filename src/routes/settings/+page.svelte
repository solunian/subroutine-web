<script lang="ts">
  import { enhance } from "$app/forms";
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
  import Cog from "$lib/icons/cog.svelte";
  import type { SubmitFunction } from "@sveltejs/kit";

  let { data, form } = $props();

  let loading = $state(false);

  const submit: SubmitFunction = ({ formData }) => {
    formData.append("timestamp", new Date().toISOString());

    loading = true;
    return async ({ update }) => {
      loading = false;
      update({ reset: false, invalidateAll: false });
    };
  };
</script>

<div class="flex w-full justify-center py-16">
  <div class="flex w-lg flex-col items-center gap-2 border border-neutral-500/50 p-8">
    <h1 class="flex w-full items-center gap-2 py-2 font-nova text-3xl sm:text-4xl">
      <span class="size-10 animate-[spin_7s_linear_infinite]"><Cog /></span>
      <span>/settings</span>
    </h1>
    <form method="POST" use:enhance={submit} class="flex w-full flex-col gap-2">
      {form?.message}

      <div>
        <label for="email">email</label>
        <input name="email" type="text" class="text-neutral-500" value={data.email} disabled />
      </div>

      <div>
        <label for="username">username</label>
        <input name="username" type="text" value={form?.username ?? data.profile?.username ?? ""} />
        {form?.errors?.username}
      </div>

      <div>
        <label for="name">name</label>
        <input name="name" type="text" value={form?.name ?? data.profile?.name ?? ""} />
        {form?.errors?.name}
      </div>

      <div>
        <label for="website">bio</label>
        <textarea name="bio" value={form?.bio ?? data.profile?.bio ?? ""}></textarea>
        {form?.errors?.bio}
      </div>

      <div>
        <label for="website">website</label>
        <input name="website" type="url" value={form?.website ?? data.profile?.website ?? ""} />
        {form?.errors?.website}
      </div>

      <div class="flex justify-between gap-2 py-2">
        <button
          type="submit"
          disabled={loading}
          class="flex w-full items-center justify-center bg-black/10 px-4 py-1 dark:bg-white/10">
          {#if loading}
            <CircularSpinner />
            <span class="sr-only">updating...</span>
          {:else}
            update
          {/if}
        </button>
        <a
          href="/signout"
          data-sveltekit-reload
          class="w-full bg-black/10 px-4 py-1 text-center dark:bg-white/10">/signout</a>
      </div>
    </form>
  </div>
</div>

<style>
  @reference "tailwindcss";

  input,
  textarea {
    @apply w-full border border-neutral-500/50 bg-transparent p-2 outline-none focus:border-current;
  }

  textarea {
    @apply resize-y;
  }
</style>
