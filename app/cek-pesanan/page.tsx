
"use client";

import { useState } from "react";

type Riwayat = {
  status: string;
  keterangan: string | null;
  kurir: string | null;
  nomor_resi: string | null;
  created_at: string;
};

type Pesanan = {
  nomor_pesanan: string;
  nama_produk: string;
  ukuran: string;
  jumlah: number;
  total_harga: number;
  status: string;
  status_pengiriman: string | null;
  kurir: string | null;
  nomor_resi_kurir: string | null;
  created_at: string;
  riwayat: Riwayat[];
};

const NOMOR_WA_ADMIN = "6281392961305";

const labelStatus: Record<string, string> = {
  pesanan_diterima: "Pesanan diterima",
  pesanan_diproses: "Pesanan diproses",
  dikemas: "Sedang dikemas",
  diserahkan_ke_kurir: "Diserahkan ke kurir",
  dalam_perjalanan: "Dalam perjalanan",
  telah_dikirim: "Telah dikirim",
  telah_sampai: "Telah sampai",
  pengiriman_gagal: "Pengiriman gagal",
};

function rupiah(nilai: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

function tanggal(nilai: string) {
  return new Date(nilai).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "long",
    timeStyle: "short",
  });
}

async function salinResi(resi: string) {
  try {
    await navigator.clipboard.writeText(resi);
    alert("Nomor resi berhasil disalin!");
  } catch {
    alert("Gagal menyalin nomor resi. Silakan salin secara manual.");
  }
}

export default function CekPesananPage() {
  const [nomorPesanan, setNomorPesanan] = useState("");
  const [pesanan, setPesanan] = useState<Pesanan | null>(null);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState("");

  async function cekPesanan() {
    if (!nomorPesanan.trim()) {
      setPesan("Masukkan nomor pesanan terlebih dahulu.");
      return;
    }

    setLoading(true);
    setPesan("");
    setPesanan(null);

    try {
      const response = await fetch("/api/cek-pesanan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomor_pesanan: nomorPesanan.trim(),
        }),
      });

      const hasil = await response.json();

      if (!response.ok) {
        throw new Error(hasil.message || "Pesanan tidak ditemukan.");
      }

      setPesanan(hasil.pesanan);
    } catch (error) {
      setPesan(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  const linkWhatsApp = pesanan
    ? `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(
        `Halo Admin PT Madu Alam Asri, saya ingin menanyakan pesanan ${pesanan.nomor_pesanan}. Terima kasih.`
      )}`
    : "#";

  return (
    <main className="min-h-screen bg-[#f5f1e7] px-5 py-12">
      <div className="mx-auto max-w-3xl">

        <a
          href="/"
          className="text-sm font-semibold text-[#315b35] hover:underline"
        >
          ← Kembali ke Beranda
        </a>

        {/* FORM CEK PESANAN */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg md:p-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
              PT Madu Alam Asri
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#315b35]">
              Cek Pesanan
            </h1>

            <p className="mt-3 text-gray-500">
              Masukkan nomor pesanan untuk melihat status dan
              riwayat pengiriman produk Anda.
            </p>
          </div>

          <div className="mt-8">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Nomor Pesanan
            </label>

            <input
              type="text"
              value={nomorPesanan}
              onChange={(e) => setNomorPesanan(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") cekPesanan();
              }}
              placeholder="Contoh: MAA-20261102-123456"
              className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-amber-700"
            />

            <button
              onClick={cekPesanan}
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-[#315b35] p-4 font-semibold text-white hover:bg-[#24472a] disabled:opacity-50"
            >
              {loading ? "Memeriksa..." : "Lacak Pesanan"}
            </button>

            {pesan && (
              <p className="mt-4 text-center text-sm text-red-600">
                {pesan}
              </p>
            )}
          </div>
        </div>

        {/* HASIL PESANAN */}
        {pesanan && (
          <div className="mt-6 space-y-6">

            {/* DETAIL PESANAN */}
            <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
              <h2 className="text-xl font-bold text-[#315b35]">
                Detail Pesanan
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Nomor Pesanan</p>
                  <p className="font-bold">
                    {pesanan.nomor_pesanan}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Tanggal Pesanan</p>
                  <p className="font-semibold">
                    {tanggal(pesanan.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Produk</p>
                  <p className="font-semibold">
                    {pesanan.nama_produk}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Ukuran</p>
                  <p className="font-semibold">
                    {pesanan.ukuran}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Jumlah</p>
                  <p className="font-semibold">
                    {pesanan.jumlah}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Total Pembayaran
                  </p>
                  <p className="font-bold text-[#315b35]">
                    {rupiah(Number(pesanan.total_harga))}
                  </p>
                </div>
              </div>
            </section>

            {/* INFORMASI PENGIRIMAN */}
            <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                Informasi Paket
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#315b35]">
                Informasi Pengiriman
              </h2>

              <div className="mt-5 rounded-xl bg-[#f5f1e7] p-5">
                <p className="text-sm text-gray-500">
                  Status Pengiriman
                </p>

                <p className="mt-1 text-lg font-bold text-[#315b35]">
                  {labelStatus[pesanan.status_pengiriman || ""] ||
                    "Menunggu pembaruan"}
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Kurir</p>
                  <p className="mt-1 font-semibold">
                    {pesanan.kurir || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Nomor Resi</p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="break-all font-semibold">
                      {pesanan.nomor_resi_kurir || "-"}
                    </p>

                    {pesanan.nomor_resi_kurir && (
                      <button
                        type="button"
                        onClick={() =>
                          salinResi(pesanan.nomor_resi_kurir!)
                        }
                        className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200"
                      >
                        Salin Resi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* TIMELINE PENGIRIMAN */}
            <section className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                    Perjalanan Paket
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-[#315b35]">
                    Riwayat Pengiriman
                  </h2>
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  {pesanan.riwayat.length} pembaruan
                </span>
              </div>

              {pesanan.riwayat.length === 0 ? (
                <div className="mt-6 rounded-xl bg-gray-50 p-5 text-center">
                  <p className="font-semibold text-gray-700">
                    Belum ada pembaruan pengiriman
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Informasi perjalanan pesanan akan muncul setelah
                    admin memperbarui status pengiriman.
                  </p>
                </div>
              ) : (
                <div className="mt-8">
                  {pesanan.riwayat.map((item, index) => {
                    const terakhir =
                      index === pesanan.riwayat.length - 1;

                    const gagal =
                      item.status === "pengiriman_gagal";

                    return (
                      <div
                        key={`${item.created_at}-${index}`}
                        className="relative flex gap-4 pb-8 last:pb-0"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                              gagal
                                ? "bg-red-100 text-red-600"
                                : terakhir
                                ? "bg-[#315b35] text-white"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {gagal ? (
                              <span className="font-bold">!</span>
                            ) : terakhir ? (
                              <span className="text-lg">●</span>
                            ) : (
                              <span className="font-bold">✓</span>
                            )}
                          </div>

                          {!terakhir && (
                            <div className="mt-2 min-h-12 w-0.5 flex-1 bg-green-200" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`font-bold ${
                                gagal
                                  ? "text-red-600"
                                  : "text-[#315b35]"
                              }`}
                            >
                              {labelStatus[item.status] || item.status}
                            </h3>

                            {terakhir && (
                              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                Status terbaru
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-gray-500">
                            {tanggal(item.created_at)}
                          </p>

                          {item.keterangan && (
                            <div className="mt-3 rounded-xl bg-gray-50 p-3">
                              <p className="text-sm text-gray-700">
                                {item.keterangan}
                              </p>
                            </div>
                          )}

                          {item.kurir && (
                            <p className="mt-2 text-sm text-gray-600">
                              Kurir: <strong>{item.kurir}</strong>
                            </p>
                          )}

                          {item.nomor_resi && (
                            <p className="mt-1 break-all text-sm text-gray-600">
                              Nomor resi:{" "}
                              <strong>{item.nomor_resi}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* HUBUNGI ADMIN VIA WHATSAPP */}
            <section className="rounded-2xl bg-[#315b35] p-6 text-white shadow-lg">
              <h2 className="text-xl font-bold">
                Butuh Bantuan?
              </h2>

              <p className="mt-2 text-sm text-green-100">
                Hubungi admin PT Madu Alam Asri jika ingin bertanya
                mengenai pesanan atau pengiriman Anda.
              </p>

              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-[#315b35] hover:bg-green-50"
              >
                Hubungi Admin via WhatsApp
              </a>
            </section>

          </div>
        )}
      </div>
    </main>
  );
}
