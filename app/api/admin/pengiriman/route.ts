
import { NextResponse } from "next/server";
import { createSupabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const STATUS_PENGIRIMAN = [
  "pesanan_diterima",
  "pesanan_diproses",
  "dikemas",
  "diserahkan_ke_kurir",
  "dalam_perjalanan",
  "telah_dikirim",
  "telah_sampai",
  "pengiriman_gagal",
];

export async function POST(request: Request) {
  try {
    // Periksa autentikasi admin
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (
      authError ||
      !user ||
      user.email?.toLowerCase() !== "admin@madualamasri.com"
    ) {
      return NextResponse.json(
        { message: "Akses ditolak. Hanya admin yang diizinkan." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const pesananId = Number(body.pesanan_id);
    const status = String(body.status || "");
    const kurir = String(body.kurir || "").trim();
    const nomorResi = String(body.nomor_resi || "").trim();
    const keterangan = String(body.keterangan || "").trim();

    if (!Number.isSafeInteger(pesananId) || pesananId <= 0) {
      return NextResponse.json(
        { message: "ID pesanan tidak valid." },
        { status: 400 }
      );
    }

    if (!STATUS_PENGIRIMAN.includes(status)) {
      return NextResponse.json(
        { message: "Status pengiriman tidak valid." },
        { status: 400 }
      );
    }

    // Periksa pesanan
    const { data: pesanan, error: cariError } = await supabaseAdmin
      .from("pesanan")
      .select("id, nomor_pesanan")
      .eq("id", pesananId)
      .single();

    if (cariError || !pesanan) {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Perbarui data pengiriman
    const { error: updateError } = await supabaseAdmin
      .from("pesanan")
      .update({
        status_pengiriman: status,
        kurir: kurir || null,
        nomor_resi_kurir: nomorResi || null,
      })
      .eq("id", pesananId);

    if (updateError) {
      return NextResponse.json(
        { message: "Gagal memperbarui pesanan: " + updateError.message },
        { status: 500 }
      );
    }

    // Simpan riwayat pengiriman
    const { error: riwayatError } = await supabaseAdmin
      .from("riwayat_pengiriman")
      .insert({
        pesanan_id: pesananId,
        status,
        keterangan:
          keterangan || "Status pengiriman diperbarui oleh admin.",
        kurir: kurir || null,
        nomor_resi: nomorResi || null,
      });

    if (riwayatError) {
      return NextResponse.json(
        {
          message:
            "Status pesanan sudah diperbarui, tetapi riwayat gagal disimpan: " +
            riwayatError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status pengiriman berhasil diperbarui.",
      nomor_pesanan: pesanan.nomor_pesanan,
    });
  } catch (error) {
    console.error("Kesalahan API pengiriman:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
