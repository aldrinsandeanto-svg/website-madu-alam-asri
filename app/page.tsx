 
import { Suspense } from "react";
import { connection } from "next/server";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import FormPemesanan from "./komponen/FormPemesanan";

async function KontenProduk() {
  await connection();

  const { data: produk, error } = await supabaseAdmin
    .from("produk")
    .select("id, nama_produk, ukuran, harga, stok, status")
    .order("nama_produk", { ascending: true })
    .order("harga", { ascending: true });

  if (error) {
    return (
      <p className="mx-auto max-w-4xl rounded-xl bg-red-50 p-5 text-red-700">
        Gagal mengambil data produk: {error.message}
      </p>
    );
  }

  return <FormPemesanan produk={produk ?? []} />;
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#3d3025]">
      <header className="border-b border-[#eadfd1] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <a href="/" className="text-2xl font-bold text-[#75451f]">
            MADU ALAM ASRI
            <span className="mt-1 block text-[10px] font-normal tracking-[0.3em] text-[#a8794b]">
              NATURAL HONEY
            </span>
          </a>

          <nav className="flex flex-wrap gap-5 text-sm font-medium">
            <a href="#beranda">Beranda</a>
            <a href="#tentang">Tentang Kami</a>
            <a href="#pemesanan">Pemesanan</a>
          </nav>
        </div>
      </header>

      <section id="beranda" className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="grid items-center gap-10 rounded-3xl bg-[#eee3d3] p-8 md:grid-cols-2 md:p-14">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-[#986333]">
              KEBAIKAN ALAM DALAM SETIAP TETES
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#59371f] md:text-6xl">
              Kebaikan Alam,
              <br />
              Dalam Setiap
              <br />
              Tetes Madu.
            </h1>

            <p className="mt-5 max-w-md leading-7 text-[#715b48]">
              Temukan pilihan madu PT Madu Alam Asri dan pesan
              dengan mudah melalui website kami.
            </p>

            <a
              href="#pemesanan"
              className="mt-8 inline-block rounded-full bg-[#75451f] px-8 py-3 font-semibold text-white hover:bg-[#59371f]"
            >
              Pesan Sekarang
            </a>
          </div>

          <div className="flex min-h-64 items-center justify-center rounded-2xl bg-[#e2d1b9]">
            <div className="text-center">
              <div className="text-9xl">🍯</div>
              <p className="mt-4 text-sm font-medium tracking-[0.25em] text-[#75451f]">
                PURE NATURAL HONEY
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="mx-auto max-w-5xl px-6 py-12 text-center">
        <p className="text-xs font-bold tracking-[0.3em] text-[#a8794b]">
          TENTANG KAMI
        </p>

        <h2 className="mt-4 text-3xl font-semibold text-[#59371f]">
          PT Madu Alam Asri
        </h2>

        <p className="mx-auto mt-5 max-w-2xl leading-8 text-[#796958]">
          Kami menghadirkan berbagai pilihan produk madu untuk
          memenuhi kebutuhan pelanggan.
        </p>
      </section>

      <section id="pemesanan" className="px-5 py-14">
        <Suspense
          fallback={
            <p className="mx-auto max-w-4xl rounded-xl bg-white p-8 text-center">
              Memuat daftar produk...
            </p>
          }
        >
          <KontenProduk />
        </Suspense>
      </section>

      <footer className="bg-[#59371f] px-6 py-10 text-center text-white">
        <h2 className="text-xl font-semibold">PT Madu Alam Asri</h2>
        <p className="mt-3 text-sm text-[#e8d9c8]">
          Menghadirkan pilihan madu untuk keluarga Indonesia.
        </p>
        <p className="mt-6 text-xs text-[#d0bda7]">
          © 2026 PT Madu Alam Asri. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </main>
  );
}
