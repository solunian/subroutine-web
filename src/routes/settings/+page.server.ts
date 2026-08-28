import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import * as v from "valibot";
import {
  NormalStrSchema,
  TrimNormalStrSchema,
  URLSchema,
  UsernameSchema,
  empty_to_null,
} from "$lib/schemas";

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) {
    redirect(303, "/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, name, website, avatar_url, bio")
    .eq("id", user.id)
    .single();

  return { session, profile, email: user.email };
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session, user } = await safeGetSession();

    if (!session || !user) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();

    const current_timestamp = new Date().toISOString();

    const name = v.safeParse(empty_to_null(TrimNormalStrSchema), fdata.get("name"));
    const username = v.safeParse(UsernameSchema, fdata.get("username"));
    const website = v.safeParse(empty_to_null(URLSchema), fdata.get("website"));
    const bio = v.safeParse(empty_to_null(NormalStrSchema), fdata.get("bio"));
    // const avatar_url = v.safeParse(
    //   v.optional(TrimNormalStrSchema),
    //   fdata.get("avatar_url") ?? undefined
    // );

    if (!name.success || !username.success || !website.success || !bio.success) {
      return fail(400, {
        errors: {
          name: name.issues && v.summarize(name.issues),
          username: username.issues && v.summarize(username.issues),
          website: website.issues && v.summarize(website.issues),
          bio: bio.issues && v.summarize(bio.issues),
          // avatar_url: avatar_url.issues && v.summarize(avatar_url.issues),
        },
      });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        updated_at: current_timestamp,
        name: name.output,
        username: username.output,
        website: website.output,
        bio: bio.output,
        // avatar_url: avatar_url.output,
      })
      .eq("id", user.id);

    if (error) {
      return fail(400, { message: error.message });
    }

    return {
      name: name.output,
      username: username.output,
      website: website.output,
      bio: bio.output,
      // avatar_url: avatar_url.output,
    };
  },
};
