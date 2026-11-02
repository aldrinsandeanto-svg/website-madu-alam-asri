import { cekAdmin } from "../../../lib/cekAdmin";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import LogoutButton from "../LogoutButton";

function rupiah(nilai: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

export default async function HistoryPage() {
  await cekAdmin();

  const { data: pesanan, error } = await supabaseAdmin
    .from("pesanan")
    .select("*")
    .order("created_at", { ascending: false });

  const daftar = pesanan ?? [];

  const totalTransaksi = daftar.length;

  const totalNilai = daftar.reduce(
    (total, item) => total + Number(item.total_harga || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f5f1e7] p-5 md:p-10">
      <div className="mx-auto max-w-7xl">

        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#315b35]">
              🍯 History Transaksi
            </h1>
            <p className="mt-2 text-gray-600">
              Riwayat pembelian PT Madu Alam Asri
            </p>
          </div>

          <LogoutButton />
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-gray-500">Total Transaksi</p>
            <h2 className="mt-2 text-3xl font-bold text-[#315b35]">
              {totalTransaksi}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-gray-500">Total Nilai Transaksi</p>
            <h2 className="mt-2 text-2xl font-bold text-[#315b35]">
              {rupiah(totalNilai)}
            </h2>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow">
          <div className="border-b p-5">
            <h2 className="text-lg font-bold text-[#315b35]">
              Daftar Pembeli
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Transaksi terbaru ditampilkan paling atas.
            </p>
          </div>

          {error ? (
            <p className="p-6 text-red-600">
              Gagal mengambil data: {error.message}
            </p>
          ) : daftar.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              Belum ada transaksi yang tercatat.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-[#edf2e9] text-[#315b35]">
                  <tr>
                    <th className="p-4">No.</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">No. Resi</th>
                    <th className="p-4">Nama Pembeli</th>
                    <th className="p-4">WhatsApp</th>
                    <th className="p-4">Alamat</th>
                    <th className="p-4">Produk</th>
                    <th className="p-4">Ukuran</th>
                    <th className="p-4">Jumlah</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {daftar.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4">{index + 1}</td>

                      <td className="whitespace-nowrap p-4">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString(
                              "id-ID",
                              { timeZone: "Asia/Jakarta" }
                            )
                          : "-"}
                      </td>

                      <td className="p-4 font-semibold text-[#315b35]">
                        {item.nomor_pesanan}
                      </td>

                      <td className="p-4">{item.nama_pelanggan}</td>
                      <td className="p-4">{item.no_whatsapp}</td>
                      <td className="p-4">{item.alamat}</td>
                      <td className="p-4">{item.nama_produk}</td>
                      <td className="p-4">{item.ukuran}</td>
                      <td className="p-4">{item.jumlah}</td>

                      <td className="whitespace-nowrap p-4 font-semibold">
                        {rupiah(Number(item.total_harga))}
                      </td>

                      <td className="p-4">{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
