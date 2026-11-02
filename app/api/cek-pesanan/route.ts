
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nomorPesanan = String(body.nomor_pesanan || "").trim();

    if (!nomorPesanan || nomorPesanan.length > 100) {
      return NextResponse.json(
        { message: "Masukkan nomor pesanan yang valid." },
        { status: 400 }
      );
    }

    // Cari pesanan berdasarkan nomor pesanan
    const { data: pesanan, error } = await supabaseAdmin
      .from("pesanan")
      .select(`
        id,
        nomor_pesanan,
        nama_produk,
        ukuran,
        jumlah,
        total_harga,
        status,
        status_pengiriman,
        kurir,
        nomor_resi_kurir,
        created_at
      `)
      .eq("nomor_pesanan", nomorPesanan)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { message: "Gagal mengambil data pesanan." },
        { status: 500 }
      );
    }

    if (!pesanan) {
      return NextResponse.json(
        { message: "Nomor pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Ambil riwayat pengiriman
    const { data: riwayat, error: riwayatError } = await supabaseAdmin
      .from("riwayat_pengiriman")
      .select("status, keterangan, kurir, nomor_resi, created_at")
      .eq("pesanan_id", pesanan.id)
      .order("created_at", { ascending: true });

    if (riwayatError) {
      return NextResponse.json(
        { message: "Gagal mengambil riwayat pengiriman." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pesanan: {
        nomor_pesanan: pesanan.nomor_pesanan,
        nama_produk: pesanan.nama_produk,
        ukuran: pesanan.ukuran,
        jumlah: pesanan.jumlah,
        total_harga: pesanan.total_harga,
        status: pesanan.status,
        status_pengiriman: pesanan.status_pengiriman,
        kurir: pesanan.kurir,
        nomor_resi_kurir: pesanan.nomor_resi_kurir,
        created_at: pesanan.created_at,
        riwayat: riwayat || [],
      },
    });
  } catch (error) {
    console.error("Kesalahan API cek pesanan:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
