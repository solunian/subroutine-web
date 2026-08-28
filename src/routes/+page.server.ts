import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) {
    return;
  }

  const sub_prom = supabase
    .from("subroutines")
    .select("*, entries(*)")
    .eq("user_id", user.id)
    .order("created_at")
    .order("created_at", { referencedTable: "entries", ascending: true });
  const username_prom = supabase.from("profiles").select("username").eq("id", user.id).single();

  const [sub_res, username_res] = await Promise.all([sub_prom, username_prom]);

  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }
  if (username_res.error) {
    error(username_res.status, username_res.error.message);
  }

  return { subroutines: sub_res.data, username: username_res.data.username };
};
