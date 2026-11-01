"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../lib/supabaseBrowser";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Gagal logout. Silakan coba lagi.");
      return;
    }

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white"
    >
      Logout
    </button>
  );
}