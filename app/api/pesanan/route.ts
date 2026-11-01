 
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      nama_pelanggan,
      no_whatsapp,
      alamat,
      nama_produk,
      ukuran,
      jumlah,
      catatan,
      metode_pembayaran,
    } = body;

    // Validasi data pelanggan dan pesanan
    if (
      !nama_pelanggan ||
      !no_whatsapp ||
      !alamat ||
      !nama_produk ||
      !ukuran ||
      !Number.isInteger(Number(jumlah)) ||
      Number(jumlah) < 1
    ) {
      return NextResponse.json(
        { error: "Lengkapi data pelanggan dan pesanan dengan benar." },
        { status: 400 }
      );
    }

    const jumlahPesanan = Number(jumlah);
    const metodePembayaran =
      typeof metode_pembayaran === "string" && metode_pembayaran.trim()
        ? metode_pembayaran.trim()
        : "Transfer Bank";

    // Cari produk berdasarkan nama dan ukuran
    const { data: produk, error: produkError } = await supabaseAdmin
      .from("produk")
      .select("id, nama_produk, ukuran, harga, stok, status")
      .eq("nama_produk", nama_produk)
      .eq("ukuran", ukuran)
      .single();

    if (produkError || !produk) {
      return NextResponse.json(
        { error: "Produk atau ukuran yang dipilih tidak ditemukan." },
        { status: 404 }
      );
    }

    if (produk.status !== "tersedia") {
      return NextResponse.json(
        { error: "Produk sedang tidak tersedia." },
        { status: 400 }
      );
    }

    if (Number(produk.stok) < jumlahPesanan) {
      return NextResponse.json(
        { error: `Stok tidak cukup. Stok tersedia: ${produk.stok}.` },
        { status: 400 }
      );
    }

    const hargaSatuan = Number(produk.harga);
    const totalHarga = hargaSatuan * jumlahPesanan;

    // Membuat nomor pesanan unik
    const nomorPesanan =
      "MAA-" +
      new Date().toISOString().slice(0, 10).replace(/-/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();

    // Simpan pesanan
    const { data: pesanan, error: pesananError } = await supabaseAdmin
      .from("pesanan")
      .insert({
        nomor_pesanan: nomorPesanan,
        nama_pelanggan: nama_pelanggan.trim(),
        no_whatsapp: no_whatsapp.trim(),
        alamat: alamat.trim(),
        nama_produk: produk.nama_produk,
        ukuran: produk.ukuran,
        harga_satuan: hargaSatuan,
        jumlah: jumlahPesanan,
        total_harga: totalHarga,
        catatan: catatan?.trim() || null,
        metode_pembayaran: metodePembayaran,
        status: "menunggu",
        status_pengiriman: "pesanan_diterima",
      })
      .select()
      .single();

    if (pesananError || !pesanan) {
      console.error("Gagal menyimpan pesanan:", pesananError);

      return NextResponse.json(
        { error: pesananError?.message || "Pesanan gagal disimpan." },
        { status: 500 }
      );
    }

    // Buat riwayat pengiriman pertama
    const { error: riwayatError } = await supabaseAdmin
      .from("riwayat_pengiriman")
      .insert({
        pesanan_id: pesanan.id,
        status: "pesanan_diterima",
        keterangan: "Pesanan berhasil diterima dan tercatat oleh sistem.",
        kurir: null,
        nomor_resi: null,
      });

    // Jika riwayat gagal dibuat, batalkan penyimpanan pesanan
    if (riwayatError) {
      console.error("Gagal membuat riwayat pengiriman:", riwayatError);

      const { error: hapusError } = await supabaseAdmin
        .from("pesanan")
        .delete()
        .eq("id", pesanan.id);

      if (hapusError) {
        console.error("Gagal membatalkan pesanan:", hapusError);
      }

      return NextResponse.json(
        { error: "Riwayat pengiriman gagal dibuat. Silakan coba kembali." },
        { status: 500 }
      );
    }

    // Kurangi stok setelah pesanan dan riwayat berhasil disimpan
    const stokBaru = Number(produk.stok) - jumlahPesanan;

    const { error: stokError } = await supabaseAdmin
      .from("produk")
      .update({ stok: stokBaru })
      .eq("id", produk.id);

    if (stokError) {
      console.error(
        "Pesanan tersimpan, tetapi stok gagal diperbarui:",
        stokError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pesanan berhasil dicatat.",
        data: pesanan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Kesalahan API pesanan:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat mencatat pesanan." },
      { status: 500 }
    );
  }
}
