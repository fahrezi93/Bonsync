import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | BonSync",
  description: "Syarat dan Ketentuan layanan BonSync.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-[32px] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-200/60">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
          <ArrowLeft className="size-4" />
          Kembali ke Beranda
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight mb-8">
          Syarat dan Ketentuan (Terms of Service)
        </h1>
        
        <div className="space-y-6 text-slate-600 text-[15px] leading-relaxed">
          <p>Terakhir diperbarui: 27 Mei 2026</p>
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">1. Penerimaan Syarat</h2>
            <p>
              Dengan mengakses dan menggunakan aplikasi BonSync, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak diperkenankan menggunakan layanan kami.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">2. Penggunaan Layanan</h2>
            <p>Anda setuju untuk menggunakan BonSync hanya untuk tujuan yang sah dan sesuai dengan hukum yang berlaku. Anda dilarang untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Menggunakan layanan untuk tindakan penipuan atau melanggar hukum.</li>
              <li>Mencoba mendapatkan akses tidak sah ke sistem atau jaringan kami.</li>
              <li>Mengganggu atau mengacaukan keamanan atau kinerja aplikasi.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">3. Akun Pengguna</h2>
            <p>
              Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda (termasuk login melalui Google) dan atas semua aktivitas yang terjadi di bawah akun Anda.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">4. Fitur AI Roasting</h2>
            <p>
              Aplikasi BonSync menyertakan fitur &quot;AI Roasting&quot; yang dirancang untuk memberikan komentar bernada humor/sarkasme mengenai kebiasaan pengeluaran Anda. Dengan menggunakan fitur ini, Anda memahami bahwa komentar tersebut hanya untuk hiburan dan bukan saran finansial profesional.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">5. Penafian Jaminan (Disclaimer)</h2>
            <p>
              Layanan disediakan &quot;sebagaimana adanya&quot;. Kami tidak menjamin bahwa aplikasi akan selalu bebas dari kesalahan, gangguan, atau akan selalu memenuhi harapan spesifik Anda.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">6. Perubahan Syarat</h2>
            <p>
              Kami berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan berlaku segera setelah diposting di halaman ini. Penggunaan berkelanjutan atas aplikasi setelah perubahan berarti Anda menerima syarat yang baru.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
