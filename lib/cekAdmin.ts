import { redirect } from "next/navigation";
import { createSupabaseServer } from "./supabaseServer";

export async function cekAdmin() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  if (user.email?.toLowerCase() !== "admin@madualamasri.com") {
    redirect("/admin/login");
  }

  return user;
}