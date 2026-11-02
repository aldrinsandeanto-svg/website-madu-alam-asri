
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  pesananId: number;
  statusSaatIni: string | null;
  kurirSaatIni: string | null;
  nomorResiSaatIni: string | null;
};

const daftarStatus = [
  { value: "pesanan_diterima", label: "Pesanan diterima" },
  { value: "pesanan_diproses", label: "Pesanan diproses" },
  { value: "dikemas", label: "Sedang dikemas" },
  { value: "diserahkan_ke_kurir", label: "Diserahkan ke kurir" },
  { value: "dalam_perjalanan", label: "Dalam perjalanan" },
  { value: "telah_dikirim", label: "Telah dikirim" },
  { value: "telah_sampai", label: "Telah sampai" },
  { value: "pengiriman_gagal", label: "Pengiriman gagal" },
];

export default function FormStatusPengiriman({
  pesananId,
  statusSaatIni,
  kurirSaatIni,
  nomorResiSaatIni,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState(
    statusSaatIni || "pesanan_diterima"
  );
  const [kurir, setKurir] = useState(kurirSaatIni || "");
  const [nomorResi, setNomorResi] = useState(
    nomorResiSaatIni || ""
  );
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState("");

  async function simpanPerubahan() {
    setLoading(true);
    setPesan("");

    try {
      const response = await fetch("/api/admin/pengiriman", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pesanan_id: pesananId,
          status,
          kurir,
          nomor_resi: nomorResi,
          keterangan,
        }),
      });

      const hasil = await response.json();

      if (!response.ok) {
        throw new Error(hasil.message || "Gagal memperbarui pengiriman.");
      }

      setPesan("Status pengiriman berhasil diperbarui.");
      setKeterangan("");
      router.refresh();
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

  return (
    <div className="min-w-[240px] space-y-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-2 text-sm"
      >
        {daftarStatus.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={kurir}
        onChange={(e) => setKurir(e.target.value)}
        placeholder="Nama kurir (JNE, J&T, dll.)"
        className="w-full rounded-lg border border-gray-300 p-2 text-sm"
      />

      <input
        type="text"
        value={nomorResi}
        onChange={(e) => setNomorResi(e.target.value)}
        placeholder="Nomor resi"
        className="w-full rounded-lg border border-gray-300 p-2 text-sm"
      />

      <textarea
        value={keterangan}
        onChange={(e) => setKeterangan(e.target.value)}
        placeholder="Keterangan pengiriman"
        rows={2}
        className="w-full rounded-lg border border-gray-300 p-2 text-sm"
      />

      <button
        type="button"
        onClick={simpanPerubahan}
        disabled={loading}
        className="w-full rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Simpan Status"}
      </button>

      {pesan && (
        <p className="text-xs text-gray-700" role="status">
          {pesan}
        </p>
      )}
    </div>
  );
}
