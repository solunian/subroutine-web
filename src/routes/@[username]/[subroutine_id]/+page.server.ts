import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as v from "valibot";
import {
  DateTimeSchema,
  empty_to_null,
  empty_to_undefined,
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
    .select("*")
    .eq("id", params.subroutine_id)
    .single();
  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }

  const entries_res = await supabase
    .from("entries")
    .select("*")
    .eq("subroutine_id", params.subroutine_id)
    .order("created_at");

  const subroutine = sub_res.data;
  const entries = entries_res.data ?? [];

  return {
    subroutine,
    entries,
  };
};

export const actions: Actions = {
  edit_subroutine: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const subroutine_id = v.safeParse(UUIDSchema, fdata.get("subroutine_id"));
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

    if (!subroutine_id.success || !title.success || !description.success || !deadline.success) {
      return fail(400, {
        errors: {
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
          title: title.issues && v.summarize(title.issues),
          description: description.issues && v.summarize(description.issues),
          deadline: deadline.issues && v.summarize(deadline.issues),
        },
      });
    }

    const edit_res = await supabase
      .from("subroutines")
      .update({
        title: title.output,
        description: description.output,
        deadline: deadline.output,
      })
      .eq("id", subroutine_id.output);

    if (edit_res.error) {
      return fail(edit_res.status, { message: edit_res.error.message });
    }

    return { form_name: "edit_subroutine" };
  },
  delete_subroutine: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const subroutine_id = v.safeParse(TrimNormalStrSchema, fdata.get("subroutine_id"));
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
  edit_entry: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const entry_id = v.safeParse(UUIDSchema, fdata.get("entry_id"));
    const subroutine_id = v.safeParse(UUIDSchema, fdata.get("subroutine_id"));
    const title = v.safeParse(v.optional(TrimNormalStrSchema), fdata.get("title") ?? undefined);
    const description = v.safeParse(
      v.optional(NormalStrSchema),
      fdata.get("description") ?? undefined
    );
    // const location = v.safeParse(..., fdata.get("location") ?? undefined);
    // const ascii_art = v.safeParse(..., fdata.get("ascii_art") ?? undefined);
    const data = v.safeParse(v.optional(NormalStrSchema), fdata.get("data") ?? undefined);

    if (
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

    const edit_res = await supabase
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

    if (edit_res.error) {
      return fail(edit_res.status, { message: edit_res.error.message });
    }

    return { form_name: "edit_entry", entry_id: edit_res.data.id };
  },
  delete_entry: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const entry_id_vbot = v.safeParse(TrimNormalStrSchema, fdata.get("entry_id"));
    if (!entry_id_vbot.success) {
      return fail(400, {
        errors: {
          entry_id: entry_id_vbot.issues && v.summarize(entry_id_vbot.issues),
        },
      });
    }

    const del_res = await supabase.from("entries").delete().eq("id", entry_id_vbot.output);

    if (del_res.error) {
      return fail(del_res.status, { message: del_res.error.message });
    }
  },
};
