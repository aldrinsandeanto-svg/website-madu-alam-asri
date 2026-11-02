 
"use client";

import { useEffect, useMemo, useState } from "react";

type Produk = {
  id: number;
  nama_produk: string;
  ukuran: string;
  harga: number;
  stok: number;
  status: string;
};

type Props = {
  produk: Produk[];
};

type Resi = {
  nomor_pesanan: string;
  nama_pelanggan: string;
  no_whatsapp: string;
  alamat: string;
  nama_produk: string;
  ukuran: string;
  jumlah: number;
  total_harga: number;
  metode_pembayaran: string;
  tanggal_simpan: string;
};

const KUNCI_RIWAYAT = "riwayat_pesanan";

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function bacaRiwayat(): Resi[] {
  try {
    const data = localStorage.getItem(KUNCI_RIWAYAT);
    if (!data) return [];

    const hasil = JSON.parse(data);

    if (!Array.isArray(hasil)) return [];

    return hasil.filter(
      (item) =>
        item &&
        typeof item.nomor_pesanan === "string"
    );
  } catch {
    return [];
  }
}

export default function FormPemesanan({ produk }: Props) {
  const [namaProduk, setNamaProduk] = useState("");
  const [ukuran, setUkuran] = useState("");
  const [jumlah, setJumlah] = useState(1);

  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");

  const [metodePembayaran, setMetodePembayaran] =
    useState("Transfer Bank");

  const [loading, setLoading] = useState(false);
  const [pesanError, setPesanError] = useState("");

  const [resi, setResi] = useState<Resi | null>(null);

  const [riwayatPesanan, setRiwayatPesanan] =
    useState<Resi[]>([]);

  const [tampilanRiwayat, setTampilanRiwayat] =
    useState(false);

  const [siap, setSiap] = useState(false);

  // Ambil riwayat pesanan saat komponen dibuka
  useEffect(() => {
    setRiwayatPesanan(bacaRiwayat());
    setSiap(true);
  }, []);

  // Simpan riwayat ke browser
  function simpanRiwayat(data: Resi[]) {
    try {
      localStorage.setItem(
        KUNCI_RIWAYAT,
        JSON.stringify(data)
      );

      setRiwayatPesanan(data);
      return true;
    } catch {
      setPesanError(
        "Resi berhasil dibuat, tetapi riwayat gagal disimpan di browser."
      );
      return false;
    }
  }

  const jenisProduk = useMemo(
    () => [...new Set(produk.map((item) => item.nama_produk))],
    [produk]
  );

  const pilihanUkuran = produk.filter(
    (item) =>
      item.nama_produk === namaProduk &&
      item.status === "tersedia" &&
      Number(item.stok) > 0
  );

  const produkDipilih = pilihanUkuran.find(
    (item) => item.ukuran === ukuran
  );

  const total = produkDipilih
    ? Number(produkDipilih.harga) * jumlah
    : 0;

  function pilihProduk(namaPilihan: string) {
    setNamaProduk(namaPilihan);

    const tersedia = produk.find(
      (item) =>
        item.nama_produk === namaPilihan &&
        item.status === "tersedia" &&
        Number(item.stok) > 0
    );

    setUkuran(tersedia?.ukuran ?? "");
    setJumlah(1);
  }

  // Membuat pesanan baru
  async function buatPesanan(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setPesanError("");

    if (!produkDipilih) {
      setPesanError(
        "Silakan pilih produk dan ukuran yang tersedia."
      );
      return;
    }

    if (
      jumlah < 1 ||
      jumlah > Number(produkDipilih.stok)
    ) {
      setPesanError(
        "Jumlah pesanan melebihi stok yang tersedia."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/pesanan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_pelanggan: nama,
          no_whatsapp: whatsapp,
          alamat,
          nama_produk: namaProduk,
          ukuran,
          jumlah,
          catatan,
          metode_pembayaran: metodePembayaran,
        }),
      });

      const hasil = await response.json();

      if (!response.ok) {
        throw new Error(
          hasil.error ||
            hasil.message ||
            "Pesanan gagal dibuat."
        );
      }

      const data = hasil.pesanan ?? hasil.data ?? hasil;

      if (!data.nomor_pesanan) {
        throw new Error(
          "Nomor pesanan tidak ditemukan pada respons server."
        );
      }

      const resiBaru: Resi = {
        nomor_pesanan: data.nomor_pesanan,
        nama_pelanggan: data.nama_pelanggan ?? nama,
        no_whatsapp: data.no_whatsapp ?? whatsapp,
        alamat: data.alamat ?? alamat,
        nama_produk: data.nama_produk ?? namaProduk,
        ukuran: data.ukuran ?? ukuran,
        jumlah: Number(data.jumlah ?? jumlah),
        total_harga: Number(data.total_harga),
        metode_pembayaran:
          data.metode_pembayaran ?? metodePembayaran,
        tanggal_simpan: new Date().toISOString(),
      };

      // Simpan semua resi tanpa menghapus pesanan lama
      const riwayatLama = bacaRiwayat();

      const riwayatBaru = [
        resiBaru,
        ...riwayatLama.filter(
          (item) =>
            item.nomor_pesanan !== resiBaru.nomor_pesanan
        ),
      ];

      simpanRiwayat(riwayatBaru);

      setResi(resiBaru);
      setTampilanRiwayat(false);
    } catch (error) {
      setPesanError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  }

  // Buka kembali resi dari riwayat
  function bukaResi(item: Resi) {
    setResi(item);
    setTampilanRiwayat(false);
    setPesanError("");
  }

  // Kembali ke formulir pemesanan
  function pesanLagi() {
    setResi(null);
    setTampilanRiwayat(false);
    setPesanError("");

    setNamaProduk("");
    setUkuran("");
    setJumlah(1);
    setNama("");
    setWhatsapp("");
    setAlamat("");
    setCatatan("");
    setMetodePembayaran("Transfer Bank");
  }

  // Hapus seluruh riwayat lokal
  function hapusRiwayat() {
    const yakin = window.confirm(
      "Yakin ingin menghapus semua riwayat pesanan dari browser ini?"
    );

    if (!yakin) return;

    localStorage.removeItem(KUNCI_RIWAYAT);
    setRiwayatPesanan([]);
    setTampilanRiwayat(false);
  }

  // Tampilan loading awal
  if (!siap) {
    return (
      <section className="mx-auto max-w-4xl p-8 text-center">
        <p className="text-[#75451f]">
          Memuat riwayat pesanan...
        </p>
      </section>
    );
  }

  // Tampilan detail resi
  if (resi) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-[#eadfd1] bg-white p-6 shadow-sm md:p-10">
        <div id="resi-cetak">
          <div className="text-center">
            <div className="text-5xl">🍯</div>

            <p className="mt-3 text-sm font-bold tracking-[0.25em] text-[#a8794b]">
              PT MADU ALAM ASRI
            </p>

            <h2 className="mt-3 text-3xl font-bold text-[#59371f]">
              Resi Pemesanan
            </h2>

            <p className="mt-2 text-sm text-green-700">
              Pesanan berhasil dicatat!
            </p>
          </div>

          <div className="my-7 border-y border-dashed border-[#d9c5ae] py-5 text-center">
            <p className="text-sm text-gray-500">
              Nomor Pesanan
            </p>

            <p className="mt-2 break-all text-2xl font-bold tracking-wider text-[#75451f]">
              {resi.nomor_pesanan}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Nama pembeli
              </span>
              <strong>{resi.nama_pelanggan}</strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Nomor HP
              </span>
              <strong>{resi.no_whatsapp}</strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Produk
              </span>
              <strong>{resi.nama_produk}</strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Ukuran
              </span>
              <strong>{resi.ukuran}</strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Jumlah
              </span>
              <strong>{resi.jumlah}</strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Alamat
              </span>
              <strong className="max-w-[65%] text-right">
                {resi.alamat}
              </strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Metode Pembayaran
              </span>
              <strong>{resi.metode_pembayaran}</strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Tanggal Pesanan
              </span>
              <strong>
                {new Date(
                  resi.tanggal_simpan
                ).toLocaleDateString("id-ID")}
              </strong>
            </div>
          </div>

          <div className="mt-6 border-t border-[#eadfd1] pt-5">
            <div className="flex justify-between text-lg">
              <strong>Total Pesanan</strong>

              <strong className="text-[#89572d]">
                {rupiah(Number(resi.total_harga))}
              </strong>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500">
            Simpan resi ini sebagai bukti pemesanan Anda.
            <br />
            Terima kasih telah memilih PT Madu Alam Asri.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-full bg-[#75451f] px-7 py-3 font-semibold text-white hover:bg-[#59371f]"
          >
            Cetak Resi
          </button>

          <button
            onClick={() => {
              setResi(null);
              setTampilanRiwayat(true);
            }}
            className="rounded-full border border-[#75451f] px-7 py-3 font-semibold text-[#75451f]"
          >
            Riwayat Pesanan
          </button>

          <button
            onClick={pesanLagi}
            className="rounded-full border border-[#75451f] px-7 py-3 font-semibold text-[#75451f]"
          >
            Pesan Lagi
          </button>
        </div>

        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }

            #resi-cetak,
            #resi-cetak * {
              visibility: visible;
            }

            #resi-cetak {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 25px;
            }
          }
        `}</style>
      </section>
    );
  }

  // Tampilan riwayat semua pesanan
  if (tampilanRiwayat) {
    return (
      <section className="mx-auto max-w-4xl rounded-3xl border border-[#eadfd1] bg-white p-6 shadow-sm md:p-10">
        <div className="mb-8 text-center">
          <div className="text-5xl">📦</div>

          <p className="mt-3 text-xs font-bold tracking-[0.3em] text-[#a8794b]">
            PT MADU ALAM ASRI
          </p>

          <h2 className="mt-3 text-3xl font-bold text-[#59371f]">
            Riwayat Pesanan
          </h2>

          <p className="mt-2 text-sm text-[#796958]">
            Semua resi pemesanan yang tersimpan di browser ini.
          </p>
        </div>

        {riwayatPesanan.length === 0 ? (
          <div className="rounded-2xl bg-[#faf8f4] p-8 text-center">
            <p className="text-4xl">📭</p>

            <h3 className="mt-4 font-bold text-[#59371f]">
              Belum Ada Riwayat Pesanan
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Pesanan yang berhasil dibuat akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {riwayatPesanan.map((item) => (
              <div
                key={item.nomor_pesanan}
                className="rounded-2xl border border-[#eadfd1] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      Nomor Pesanan
                    </p>

                    <p className="mt-1 break-all font-bold text-[#75451f]">
                      {item.nomor_pesanan}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Tersimpan
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Produk
                    </span>
                    <strong>{item.nama_produk}</strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Ukuran
                    </span>
                    <strong>{item.ukuran}</strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Jumlah
                    </span>
                    <strong>{item.jumlah}</strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Total
                    </span>
                    <strong className="text-[#89572d]">
                      {rupiah(Number(item.total_harga))}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">
                      Tanggal
                    </span>
                    <strong>
                      {new Date(
                        item.tanggal_simpan
                      ).toLocaleDateString("id-ID")}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => bukaResi(item)}
                  className="mt-5 w-full rounded-full bg-[#75451f] px-5 py-3 font-semibold text-white hover:bg-[#59371f]"
                >
                  Lihat Resi
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={pesanLagi}
            className="rounded-full bg-[#75451f] px-7 py-3 font-semibold text-white"
          >
            Buat Pesanan Baru
          </button>

          {riwayatPesanan.length > 0 && (
            <button
              onClick={hapusRiwayat}
              className="rounded-full border border-red-300 px-7 py-3 font-semibold text-red-600"
            >
              Hapus Riwayat
            </button>
          )}
        </div>
      </section>
    );
  }

  // Tampilan formulir pemesanan
  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-[#eadfd1] bg-white p-6 shadow-sm md:p-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold tracking-[0.3em] text-[#a8794b]">
          PEMESANAN ONLINE
        </p>

        <h2 className="mt-3 text-3xl font-bold text-[#59371f]">
          Formulir Pemesanan Madu
        </h2>

        <p className="mt-3 text-sm text-[#796958]">
          Pilih produk, tentukan jumlah, lalu isi data pembeli.
        </p>

        <button
          type="button"
          onClick={() => setTampilanRiwayat(true)}
          className="mt-5 rounded-full border border-[#75451f] px-6 py-2.5 text-sm font-semibold text-[#75451f] hover:bg-[#f7f0e7]"
        >
          📦 Riwayat Pesanan ({riwayatPesanan.length})
        </button>
      </div>

      <form onSubmit={buatPesanan} className="space-y-7">
        <div>
          <label className="mb-2 block font-semibold text-[#59371f]">
            1. Pilih Jenis Produk
          </label>

          <select
            required
            value={namaProduk}
            onChange={(e) => pilihProduk(e.target.value)}
            className="w-full rounded-xl border border-[#e5d6c5] bg-[#faf8f4] p-3"
          >
            <option value="">-- Pilih jenis madu --</option>

            {jenisProduk.map((nama) => (
              <option key={nama} value={nama}>
                {nama}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block font-semibold text-[#59371f]">
              2. Pilih Ukuran
            </label>

            <select
              required
              value={ukuran}
              onChange={(e) => setUkuran(e.target.value)}
              disabled={!namaProduk || pilihanUkuran.length === 0}
              className="w-full rounded-xl border border-[#e5d6c5] bg-[#faf8f4] p-3 disabled:opacity-50"
            >
              <option value="">-- Pilih ukuran --</option>

              {pilihanUkuran.map((item) => (
                <option key={item.id} value={item.ukuran}>
                  {item.ukuran} - {rupiah(Number(item.harga))}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-semibold text-[#59371f]">
              3. Jumlah Pesanan
            </label>

            <input
              type="number"
              min="1"
              max={
                produkDipilih
                  ? Number(produkDipilih.stok)
                  : undefined
              }
              required
              value={jumlah}
              onChange={(e) =>
                setJumlah(Number(e.target.value))
              }
              className="w-full rounded-xl border border-[#e5d6c5] bg-[#faf8f4] p-3"
            />

            {produkDipilih && (
              <p className="mt-2 text-xs text-gray-500">
                Stok tersedia: {produkDipilih.stok}
              </p>
            )}
          </div>
        </div>

        {produkDipilih && (
          <div className="rounded-2xl bg-[#f7f0e7] p-5">
            <p className="text-sm text-[#796958]">
              Total pembayaran
            </p>

            <p className="mt-1 text-2xl font-bold text-[#75451f]">
              {rupiah(total)}
            </p>
          </div>
        )}

        <div className="border-t border-[#eadfd1] pt-7">
          <h3 className="mb-5 text-xl font-bold text-[#59371f]">
            4. Data Pembeli
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Nama Lengkap
              </label>

              <input
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full rounded-xl border border-[#e5d6c5] p-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Nomor HP / WhatsApp
              </label>

              <input
                required
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full rounded-xl border border-[#e5d6c5] p-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Alamat Lengkap
              </label>

              <textarea
                required
                rows={3}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Jalan, desa, kecamatan, kabupaten..."
                className="w-full rounded-xl border border-[#e5d6c5] p-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Catatan Pesanan (Opsional)
              </label>

              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tambahkan catatan jika diperlukan"
                className="w-full rounded-xl border border-[#e5d6c5] p-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                5. Metode Pembayaran
              </label>

              <select
                required
                value={metodePembayaran}
                onChange={(e) =>
                  setMetodePembayaran(e.target.value)
                }
                className="w-full rounded-xl border border-[#e5d6c5] bg-[#faf8f4] p-3"
              >
                <option value="Transfer Bank">
                  Transfer Bank
                </option>
                <option value="COD">
                  COD (Bayar di Tempat)
                </option>
                <option value="QRIS">QRIS</option>
                <option value="E-wallet DANA">DANA</option>
                <option value="E-wallet OVO">OVO</option>
                <option value="E-wallet GoPay">GoPay</option>
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Informasi rekening atau pembayaran akan diberikan
                oleh pihak PT Madu Alam Asri.
              </p>
            </div>
          </div>
        </div>

        {pesanError && (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {pesanError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !produkDipilih}
          className="w-full rounded-full bg-[#75451f] px-8 py-4 font-bold text-white hover:bg-[#59371f] disabled:opacity-50"
        >
          {loading ? "Menyimpan Pesanan..." : "Buat Pesanan"}
        </button>
      </form>
    </section>
  );
}
