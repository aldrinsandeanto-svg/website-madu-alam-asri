 
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

function buatNomorPesanan() {
  const tanggal = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  const acak = Math.floor(1000 + Math.random() * 9000);

  return `MAA-${tanggal}-${acak}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nama = String(body.nama_pelanggan || "").trim();
    const whatsapp = String(body.no_whatsapp || "").trim();
    const alamat = String(body.alamat || "").trim();
    const namaProduk = String(body.nama_produk || "").trim();
    const ukuran = String(body.ukuran || "").trim();
    const catatan = String(body.catatan || "").trim();
    const metodePembayaran = String(
      body.metode_pembayaran || "Transfer Bank"
    ).trim();

    const jumlah = Number(body.jumlah);

    // Validasi data pelanggan
    if (
      !nama ||
      !whatsapp ||
      !alamat ||
      !namaProduk ||
      !ukuran
    ) {
      return NextResponse.json(
        { message: "Semua data wajib harus diisi." },
        { status: 400 }
      );
    }

    if (
      nama.length > 150 ||
      whatsapp.length > 25 ||
      !/^[0-9+\-\s()]+$/.test(whatsapp) ||
      alamat.length > 2000 ||
      catatan.length > 2000
    ) {
      return NextResponse.json(
        { message: "Data pelanggan tidak valid." },
        { status: 400 }
      );
    }

    if (
      !Number.isSafeInteger(jumlah) ||
      jumlah < 1 ||
      jumlah > 100
    ) {
      return NextResponse.json(
        { message: "Jumlah pesanan tidak valid." },
        { status: 400 }
      );
    }

    const metodeValid = [
      "Transfer Bank",
      "COD",
      "QRIS",
      "E-wallet DANA",
      "E-wallet OVO",
      "E-wallet GoPay",
    ];

    if (!metodeValid.includes(metodePembayaran)) {
      return NextResponse.json(
        { message: "Metode pembayaran tidak valid." },
        { status: 400 }
      );
    }

    // Cari produk berdasarkan nama dan ukuran
    const { data: produk, error: produkError } =
      await supabaseAdmin
        .from("produk")
        .select("id, nama_produk, ukuran, harga, stok, status")
        .eq("nama_produk", namaProduk)
        .eq("ukuran", ukuran)
        .maybeSingle();

    if (produkError || !produk) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    if (
      produk.status !== "tersedia" ||
      Number(produk.stok) < jumlah
    ) {
      return NextResponse.json(
        { message: "Stok produk tidak mencukupi." },
        { status: 400 }
      );
    }

    // Harga selalu diambil dari database
    const harga = Number(produk.harga);
    const total = harga * jumlah;

    if (!Number.isFinite(harga) || harga <= 0) {
      return NextResponse.json(
        { message: "Harga produk tidak valid." },
        { status: 400 }
      );
    }

    // Kurangi stok dengan syarat stok masih mencukupi
    const stokBaru = Number(produk.stok) - jumlah;

    const { data: stokUpdate, error: stokError } =
      await supabaseAdmin
        .from("produk")
        .update({ stok: stokBaru })
        .eq("id", produk.id)
        .gte("stok", jumlah)
        .select("id")
        .maybeSingle();

    if (stokError || !stokUpdate) {
      return NextResponse.json(
        { message: "Stok berubah atau sudah habis. Silakan coba lagi." },
        { status: 409 }
      );
    }

    // Buat nomor pesanan
    const nomorPesanan = buatNomorPesanan();

    // Simpan pesanan
    const { data: pesanan, error: pesananError } =
      await supabaseAdmin
        .from("pesanan")
        .insert({
          nomor_pesanan: nomorPesanan,
          nama_pelanggan: nama,
          no_whatsapp: whatsapp,
          alamat,
          nama_produk: produk.nama_produk,
          ukuran: produk.ukuran,
          harga_satuan: harga,
          jumlah,
          total_harga: total,
          catatan: catatan || null,
          metode_pembayaran: metodePembayaran,
        })
        .select(
          "nomor_pesanan, nama_pelanggan, no_whatsapp, alamat, nama_produk, ukuran, jumlah, total_harga, metode_pembayaran"
        )
        .single();

    if (pesananError || !pesanan) {
      // Kembalikan stok jika penyimpanan pesanan gagal
      await supabaseAdmin
        .from("produk")
        .update({ stok: Number(produk.stok) })
        .eq("id", produk.id);

      console.error("Gagal menyimpan pesanan:", pesananError);

      return NextResponse.json(
        { message: "Gagal menyimpan pesanan." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pesanan berhasil dibuat.",
        pesanan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Kesalahan API pemesanan:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
