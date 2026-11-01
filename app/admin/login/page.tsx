
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../../lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setPesan("");

    const supabase = createSupabaseBrowser();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setPesan("Email atau password salah.");
      setLoading(false);
      return;
    }

    if (
      data.user.email?.trim().toLowerCase() !==
      "admin@madualamasri.com"
    ) {
      await supabase.auth.signOut();
      setPesan("Akun ini bukan administrator.");
      setLoading(false);
      return;
    }

    router.replace("/admin/history");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f1e7] p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-7 text-center">
          <div className="text-5xl">🍯</div>

          <h1 className="mt-3 text-2xl font-bold text-[#315b35]">
            PT Madu Alam Asri
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Login Administrator
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full rounded-lg border p-3"
            />
          </div>

          {pesan && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {pesan}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#315b35] p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Memproses..." : "LOGIN"}
          </button>
        </form>
      </div>
    </main>
  );
}
