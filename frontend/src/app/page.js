import Image from "next/image";
import InteractiveFloorPlan from "./_components/InteractiveFloorPlan";
import SiteFooter from "./_components/SiteFooter";
import SiteHeader from "./_components/SiteHeader";

const steps = [
  {
    number: "01",
    title: "Pilih tanggal & waktu",
    description: "Tentukan jadwal kedatangan agar sistem menampilkan meja yang relevan.",
    icon: "fa-regular fa-calendar",
  },
  {
    number: "02",
    title: "Lihat denah meja",
    description: "Pantau posisi meja, zona, dan jalur area restoran dari tampilan visual.",
    icon: "fa-regular fa-map",
  },
  {
    number: "03",
    title: "Pilih meja tersedia",
    description: "Klik meja berwarna hijau sesuai kapasitas dan preferensi tempat duduk.",
    icon: "fa-solid fa-chair",
  },
  {
    number: "04",
    title: "Konfirmasi reservasi",
    description: "Lengkapi data reservasi dan simpan bukti pemesanan di akunmu.",
    icon: "fa-regular fa-circle-check",
  },
];

const features = [
  {
    title: "Interactive Floor Plan",
    description: "Denah restoran 2D berbasis koordinat untuk memilih meja secara visual.",
    icon: "fa-solid fa-table-cells-large",
  },
  {
    title: "Status meja real-time",
    description: "Ketersediaan meja ditandai warna agar pelanggan tidak salah memilih.",
    icon: "fa-solid fa-signal",
  },
  {
    title: "Riwayat reservasi",
    description: "Semua pemesanan tersimpan rapi dan mudah dilihat kembali.",
    icon: "fa-regular fa-clock",
  },
  {
    title: "Notifikasi status pemesanan",
    description: "Pelanggan mendapat pembaruan saat reservasi dikonfirmasi atau dibatalkan.",
    icon: "fa-regular fa-bell",
  },
];

const highlights = [
  {
    title: "Ayam Bakar Madu",
    description: "Menu utama dengan bumbu rempah, sambal bawang, dan lalapan segar.",
    price: "Rp48.000",
    icon: "fa-solid fa-drumstick-bite",
    image:
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Paket Family Table",
    description: "Paket sharing untuk 4 orang, cocok dipasangkan dengan meja area utama.",
    price: "Rp185.000",
    icon: "fa-solid fa-people-group",
    image:
      "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Private Dining",
    description: "Layanan reservasi zona VIP untuk makan malam keluarga atau meeting kecil.",
    price: "By request",
    icon: "fa-solid fa-champagne-glasses",
    image:
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold uppercase text-teal-800">
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              Nusantara Table Restaurant
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Reservasi Meja Restoran Secara Mandiri
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Pilih meja favoritmu di Nusantara Table langsung dari denah
              restoran interaktif secara real-time.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/reservasi"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                <i className="fa-solid fa-chair" aria-hidden="true" />
                Reservasi Sekarang
              </a>
              <a
                href="/hidangan"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
              >
                <i className="fa-solid fa-bowl-food" aria-hidden="true" />
                Lihat Hidangan
              </a>
              <a
                href="/cara-kerja"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700 sm:hidden xl:inline-flex"
              >
                <i className="fa-regular fa-circle-play" aria-hidden="true" />
                Lihat Cara Kerja
              </a>
            </div>
          </div>

          <div className="animate-fade-up-delay">
            <InteractiveFloorPlan compact />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase text-teal-700">
                Hidangan & Services
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">
                Menu favorit dan layanan restoran
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Nusantara Table menyajikan menu Indonesia modern, paket sharing,
                dan layanan private dining untuk kebutuhan reservasi khusus.
              </p>
            </div>
            <a
              href="/hidangan"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700 sm:w-fit"
            >
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              Lihat Semua
            </a>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm"
              >
                <div className="relative h-44">
                  <Image
                    src={item.image}
                    alt={`Foto dummy ${item.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
                    <i className={item.icon} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                  <p className="mt-4 text-sm font-bold text-amber-600">{item.price}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="border-b border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-teal-700">
              Cara Kerja
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Reservasi dibuat dalam empat langkah sederhana
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.title}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-600">{step.number}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-teal-700">
                    <i className={step.icon} aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase text-teal-700">
                Fitur Utama
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">
                Dibuat untuk reservasi yang jelas dan transparan
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Tampilan pelanggan berfokus pada pemilihan meja, status
                ketersediaan, dan alur konfirmasi yang cepat.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-rose-600 shadow-sm">
                    <i className={feature.icon} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="reservasi" className="bg-teal-700 py-14 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-teal-100">
              Mulai dari denah interaktif
            </p>
            <h2 className="mt-2 text-3xl font-bold">Sudah siap memilih meja?</h2>
          </div>
          <a
            href="/register"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-amber-50"
          >
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            Mulai Reservasi
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
