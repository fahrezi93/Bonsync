import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | BonSync",
  description: "Kebijakan Privasi aplikasi BonSync.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-[32px] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-200/60">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight mb-8">
          Kebijakan Privasi (Privacy Policy)
        </h1>
        
        <div className="space-y-6 text-slate-600 text-[15px] leading-relaxed">
          <p>Terakhir diperbarui: 27 Mei 2026</p>
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">1. Pendahuluan</h2>
            <p>
              Selamat datang di BonSync. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat Anda menggunakan aplikasi kami.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">2. Informasi yang Kami Kumpulkan</h2>
            <p>Kami dapat mengumpulkan informasi berikut:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Informasi Akun:</strong> Nama, alamat email, dan foto profil (jika Anda menggunakan Google Sign-In).</li>
              <li><strong>Data Transaksi:</strong> Data struk belanja yang Anda unggah, nominal pengeluaran, dan kategori pengeluaran yang Anda catat.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">3. Bagaimana Kami Menggunakan Informasi Anda</h2>
            <p>Informasi yang kami kumpulkan digunakan untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Menyediakan layanan pencatatan pengeluaran dan "split bill".</li>
              <li>Menghasilkan analisis pengeluaran (AI Roasting) menggunakan kecerdasan buatan.</li>
              <li>Meningkatkan pengalaman pengguna dan keamanan aplikasi.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">4. Berbagi Informasi</h2>
            <p>
              Kami tidak akan menjual atau menyewakan data pribadi Anda kepada pihak ketiga. Kami hanya membagikan data kepada layanan pihak ketiga (seperti penyedia AI) secara anonim dan sebatas yang diperlukan untuk menjalankan fitur aplikasi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">5. Keamanan Data</h2>
            <p>
              Kami mengimplementasikan langkah-langkah keamanan yang wajar untuk melindungi informasi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800">6. Hubungi Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi kami di <a href="mailto:support@bonsync.com" className="text-emerald-600 hover:underline">support@bonsync.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
