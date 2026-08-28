import { RelationshipStatusType, TrimNormalStrSchema } from "$lib/schemas";
import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import * as v from "valibot";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, locals: { safeGetSession, supabase } }) => {
  const { session, user } = await safeGetSession();

  if (!session || !user) {
    return;
  }

  // load relevant page data after the layout load
  const layout_data = await parent();

  // load subroutines
  const sub_prom = supabase
    .from("subroutines")
    .select("*, profiles!inner(username), entries(*)")
    .eq("profiles.username", layout_data.username)
    .order("created_at")
    .order("created_at", { referencedTable: "entries", ascending: true });

  const num_friends_prom = supabase
    .from("relationships")
    .select("*", { count: "exact" })
    .eq("status", "accepted")
    .or(`requester_id.eq.${layout_data.profile.id},requestee_id.eq.${layout_data.profile.id}`);

  const [sub_res, num_friends_res] = await Promise.all([sub_prom, num_friends_prom]);

  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }

  return { subroutines: sub_res.data, num_friends: num_friends_res.count ?? 0 };
};

export const actions: Actions = {
  request_relation: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession();
    if (!session || !user) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const other_id = v.safeParse(TrimNormalStrSchema, fdata.get("other_id"));
    if (!other_id.success) {
      return fail(400, {
        errors: {
          other_id: other_id.issues && v.summarize(other_id.issues),
        },
      });
    }

    const req_res = await supabase.from("relationships").insert({
      requester_id: user.id,
      requestee_id: other_id.output,
      status: "pending",
    });

    if (req_res.error) {
      return fail(req_res.status, { message: req_res.error.message });
    }

    return { form_name: "request_relation" };
  },
  delete_relation: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession();

    if (!session || !user) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const other_id = v.safeParse(TrimNormalStrSchema, fdata.get("other_id"));
    if (!other_id.success) {
      return fail(400, {
        errors: {
          other_id: other_id.issues && v.summarize(other_id.issues),
        },
      });
    }

    const del_res = await supabase
      .from("relationships")
      .delete()
      .or(
        `and(requester_id.eq.${user.id},requestee_id.eq.${other_id.output}),and(requester_id.eq.${other_id.output},requestee_id.eq.${user.id})`
      );

    if (del_res.error) {
      return fail(del_res.status, { message: del_res.error.message });
    }

    return { form_name: "delete_relation" };
  },
  update_relation: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession();

    if (!session || !user) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const other_id = v.safeParse(TrimNormalStrSchema, fdata.get("other_id"));
    const status = v.safeParse(RelationshipStatusType, fdata.get("status"));
    if (!other_id.success || !status.success) {
      return fail(400, {
        errors: {
          other_id: other_id.issues && v.summarize(other_id.issues),
          status: status.issues && v.summarize(status.issues),
        },
      });
    }

    const update_res = await supabase
      .from("relationships")
      .update({ status: status.output })
      .or(
        `and(requester_id.eq.${user.id},requestee_id.eq.${other_id.output}),and(requester_id.eq.${other_id.output},requestee_id.eq.${user.id})`
      );

    if (update_res.error) {
      return fail(update_res.status, { message: update_res.error.message });
    }

    return { form_name: "update_relation" };
  },
};
