import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as v from "valibot";
import {
  DateTimeSchema,
  empty_to_null,
  empty_to_undefined,
  FinNumberSchema,
  NormalStrSchema,
  TrimNormalStrSchema,
  UUIDSchema,
} from "$lib/schemas";

export const load: PageServerLoad = async ({
  url,
  params,
  locals: { safeGetSession, supabase },
}) => {
  const { session } = await safeGetSession();
  if (!session) {
    redirect(303, `/signin?redirect=${url}`);
  }

  // if logged in...

  // load subroutine and entries
  const sub_res = await supabase
    .from("subroutines")
    .select("*, profiles!inner(username), entries(*)")
    .eq("profiles.username", params.username)
    .eq("id", params.subroutine_id)
    .order("created_at")
    .order("created_at", { referencedTable: "entries", ascending: true })
    .single();

  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }

  return {
    subroutine: sub_res.data,
    entries: sub_res.data.entries,
  };
};

// update_subroutine, insert_entry, update_entry, delete_entry: must set the timestamp for subroutines.updated_at.

export const actions: Actions = {
  update_subroutine: async ({ request, params, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const timestamp = v.safeParse(
      TrimNormalStrSchema,
      fdata.get("timestamp") ?? new Date().toISOString()
    );
    const subroutine_id = v.safeParse(UUIDSchema, params.subroutine_id);
    const title = v.safeParse(
      v.optional(v.pipe(TrimNormalStrSchema, v.nonEmpty())),
      fdata.get("title") ?? undefined
    );
    const description = v.safeParse(
      v.optional(empty_to_null(NormalStrSchema)),
      fdata.get("description") ?? undefined
    );
    // const location = v.safeParse(NormalStrSchema, fdata.get("location"));
    // const ascii_art = v.safeParse(v.optional(NormalStrSchema), fdata.get("ascii_art") ?? undefined);
    // datetime is default empty string ""
    const deadline = v.safeParse(
      v.optional(empty_to_undefined(DateTimeSchema)),
      fdata.get("deadline") ?? undefined
    );

    if (
      !timestamp.success ||
      !subroutine_id.success ||
      !title.success ||
      !description.success ||
      !deadline.success
    ) {
      return fail(400, {
        errors: {
          timestamp: timestamp.issues && v.summarize(timestamp.issues),
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
          title: title.issues && v.summarize(title.issues),
          description: description.issues && v.summarize(description.issues),
          deadline: deadline.issues && v.summarize(deadline.issues),
        },
      });
    }

    const updated_at_prom = supabase
      .from("subroutines")
      .update({ updated_at: timestamp.output })
      .eq("id", subroutine_id.output);

    const update_prom = supabase
      .from("subroutines")
      .update({
        title: title.output,
        description: description.output,
        deadline: deadline.output,
      })
      .eq("id", subroutine_id.output);

    const [updated_at_res, update_res] = await Promise.all([updated_at_prom, update_prom]);

    if (updated_at_res.error) {
      return fail(updated_at_res.status, { message: updated_at_res.error.message });
    }

    if (update_res.error) {
      return fail(update_res.status, { message: update_res.error.message });
    }

    return { form_name: "update_subroutine" };
  },
  delete_subroutine: async ({ params, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const subroutine_id = v.safeParse(UUIDSchema, params.subroutine_id);
    if (!subroutine_id.success) {
      return fail(400, {
        errors: {
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
        },
      });
    }

    const del_res = await supabase.from("subroutines").delete().eq("id", subroutine_id.output);

    if (del_res.error) {
      return fail(del_res.status, { message: del_res.error.message });
    }

    redirect(303, "/");
  },
  insert_entry: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();

    // data validation
    const timestamp = v.safeParse(
      TrimNormalStrSchema,
      fdata.get("timestamp") ?? new Date().toISOString()
    );
    const subroutine_id = v.safeParse(TrimNormalStrSchema, fdata.get("subroutine_id"));
    const subroutine_type = v.safeParse(
      v.nullable(TrimNormalStrSchema),
      fdata.get("subroutine_type")
    );

    if (!subroutine_id.success || !timestamp.success || !subroutine_type.success) {
      return fail(400, {
        errors: {
          timestamp: timestamp.issues && v.summarize(timestamp.issues),
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
          subroutine_type: subroutine_type.issues && v.summarize(subroutine_type.issues),
        },
      });
    }

    // db queries
    // custom data json for each subroutine
    const custom_data_map = new Map();
    if (subroutine_type.output) {
      if (subroutine_type.output === "semaphore") {
        const value = v.safeParse(FinNumberSchema, fdata.get("value"));
        if (!value.success) {
          return fail(400, {
            errors: {
              value: value.issues && v.summarize(value.issues),
            },
          });
        }

        custom_data_map.set("value", value.output);
      }
    }

    const updated_at_prom = supabase
      .from("subroutines")
      .update({ updated_at: timestamp.output })
      .eq("id", subroutine_id.output);

    const new_entry_prom = supabase.from("entries").insert({
      created_at: timestamp.output,
      subroutine_id: subroutine_id.output,
      user_id: session.user.id,
      data: custom_data_map.size === 0 ? null : Object.fromEntries(custom_data_map),
    });

    const [updated_at_res, new_entry_res] = await Promise.all([updated_at_prom, new_entry_prom]);

    if (updated_at_res.error) {
      return fail(updated_at_res.status, { message: updated_at_res.error.message });
    }

    if (new_entry_res.error) {
      return fail(new_entry_res.status, { message: new_entry_res.error.message });
    }
  },
  update_entry: async ({ request, params, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const timestamp = v.safeParse(
      TrimNormalStrSchema,
      fdata.get("timestamp") ?? new Date().toISOString()
    );
    const entry_id = v.safeParse(UUIDSchema, fdata.get("entry_id"));
    const subroutine_id = v.safeParse(UUIDSchema, params.subroutine_id);
    const title = v.safeParse(v.optional(TrimNormalStrSchema), fdata.get("title") ?? undefined);
    const description = v.safeParse(
      v.optional(NormalStrSchema),
      fdata.get("description") ?? undefined
    );
    // const location = v.safeParse(..., fdata.get("location") ?? undefined);
    // const ascii_art = v.safeParse(..., fdata.get("ascii_art") ?? undefined);
    const data = v.safeParse(v.optional(NormalStrSchema), fdata.get("data") ?? undefined);

    if (
      !timestamp.success ||
      !entry_id.success ||
      !subroutine_id.success ||
      // !created_at.success ||
      !title.success ||
      !description.success ||
      // !location.success ||
      // !ascii_art.success ||
      !data.success
    ) {
      return fail(400, {
        errors: {
          timestamp: timestamp.issues && v.summarize(timestamp.issues),
          entry_id: entry_id.issues && v.summarize(entry_id.issues),
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
          // created_at: created_at.issues && v.summarize(created_at.issues),
          title: title.issues && v.summarize(title.issues),
          description: description.issues && v.summarize(description.issues),
          // location: location.issues && v.summarize(location.issues),
          // ascii_art: ascii_art.issues && v.summarize(ascii_art.issues),
          data: data.issues && v.summarize(data.issues),
        },
      });
    }

    const updated_at_prom = supabase
      .from("subroutines")
      .update({ updated_at: timestamp.output })
      .eq("id", subroutine_id.output);

    const update_prom = supabase
      .from("entries")
      .update({
        title: title.output,
        description: description.output,
        data: data.output,
      })
      .eq("id", entry_id.output)
      .eq("subroutine_id", subroutine_id.output)
      .eq("user_id", session.user.id)
      .select("id")
      .single();

    const [updated_at_res, update_res] = await Promise.all([updated_at_prom, update_prom]);

    if (updated_at_res.error) {
      return fail(updated_at_res.status, { message: updated_at_res.error.message });
    }

    if (update_res.error) {
      return fail(update_res.status, { message: update_res.error.message });
    }

    return { form_name: "update_entry", entry_id: update_res.data.id };
  },
  delete_entry: async ({ request, params, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const timestamp = v.safeParse(
      TrimNormalStrSchema,
      fdata.get("timestamp") ?? new Date().toISOString()
    );
    const subroutine_id = v.safeParse(UUIDSchema, params.subroutine_id);
    const entry_id = v.safeParse(UUIDSchema, fdata.get("entry_id"));
    if (!timestamp.success || !subroutine_id.success || !entry_id.success) {
      return fail(400, {
        errors: {
          timestamp: timestamp.issues && v.summarize(timestamp.issues),
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
          entry_id: entry_id.issues && v.summarize(entry_id.issues),
        },
      });
    }

    const updated_at_prom = supabase
      .from("subroutines")
      .update({ updated_at: timestamp.output })
      .eq("id", subroutine_id.output);

    const del_prom = supabase.from("entries").delete().eq("id", entry_id.output);

    const [updated_at_res, del_res] = await Promise.all([updated_at_prom, del_prom]);

    if (updated_at_res.error) {
      return fail(updated_at_res.status, { message: updated_at_res.error.message });
    }
    if (del_res.error) {
      return fail(del_res.status, { message: del_res.error.message });
    }
  },
};
