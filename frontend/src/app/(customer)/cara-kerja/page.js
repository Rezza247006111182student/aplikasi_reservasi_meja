import Image from "next/image";
import Link from "next/link";
import SiteFooter from "../../_components/SiteFooter";
import SiteHeader from "../../_components/SiteHeader";

const steps = [
  {
    number: "01",
    title: "Pilih tanggal & waktu",
    description:
      "Masukkan tanggal, jam kedatangan, jumlah tamu, dan preferensi area sebelum melihat denah meja.",
    icon: "fa-regular fa-calendar",
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80",
  },
  {
    number: "02",
    title: "Lihat denah meja",
    description:
      "Denah Nusantara Table menampilkan zona, posisi meja, kapasitas, dan status ketersediaan.",
    icon: "fa-regular fa-map",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  },
  {
    number: "03",
    title: "Pilih meja tersedia",
    description:
      "Meja hijau dapat dipilih, meja merah sedang dipesan, dan meja abu-abu sedang tidak aktif.",
    icon: "fa-solid fa-chair",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
  },
  {
    number: "04",
    title: "Konfirmasi reservasi",
    description:
      "Periksa detail reservasi, lalu simpan. Riwayat dan notifikasi akan muncul di akun pelanggan.",
    icon: "fa-regular fa-circle-check",
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80",
  },
];

const notes = [
  {
    title: "Data dummy frontend",
    description: "Sampai backend tersedia, seluruh jadwal, meja, dan status masih berupa data contoh.",
    icon: "fa-solid fa-database",
  },
  {
    title: "Siap validasi double booking",
    description: "Alur reservasi sudah disiapkan agar nanti validasi bentrok jadwal dilakukan di server.",
    icon: "fa-solid fa-shield-halved",
  },
  {
    title: "Siap real-time update",
    description: "Status meja dapat dihubungkan ke Socket.io agar perubahan langsung terlihat oleh pelanggan.",
    icon: "fa-solid fa-signal",
  },
];

const statusItems = [
  {
    label: "Tersedia",
    description: "Meja dapat dipilih dan dilanjutkan ke konfirmasi.",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  {
    label: "Dipesan",
    description: "Meja sedang dipakai atau sudah dipesan pada jadwal tersebut.",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  {
    label: "Tidak aktif",
    description: "Meja tidak dibuka karena maintenance atau pengaturan admin.",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
];

export default function CaraKerjaPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold uppercase text-teal-800">
              <i className="fa-solid fa-route" aria-hidden="true" />
              Cara Kerja
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              Dari pilih jadwal sampai meja dikonfirmasi
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Pelanggan bisa melihat suasana restoran, memilih lantai dan
              ruangan, lalu menentukan meja favorit melalui denah interaktif
              yang mudah dipahami.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/reservasi"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                <i className="fa-solid fa-chair" aria-hidden="true" />
                Mulai Reservasi
              </Link>
              <Link
                href="/hidangan"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
              >
                <i className="fa-solid fa-bowl-food" aria-hidden="true" />
                Lihat Hidangan
              </Link>
            </div>
          </div>

          <div className="animate-fade-up-delay overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-xl shadow-slate-200/70">
            <div className="relative h-72 sm:h-80">
              <Image
                src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80"
                alt="Suasana restoran sebagai foto placeholder"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-xs font-semibold uppercase text-teal-100">
                  Nusantara Table
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Alur reservasi mandiri untuk pengalaman makan yang lebih pasti
                </h2>
              </div>
            </div>
            <div className="grid gap-3 bg-white p-4 sm:grid-cols-3">
              {statusItems.map((status) => (
                <div
                  key={status.label}
                  className={`rounded-lg border p-4 ${status.className}`}
                >
                  <p className="text-sm font-bold">{status.label}</p>
                  <p className="mt-1 text-xs leading-5 opacity-80">
                    {status.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase text-teal-700">
              Alur Pelanggan
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Empat langkah yang terlihat jelas di layar
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="animate-rise-card overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70"
              >
                <div className="relative h-40">
                  <Image
                    src={step.image}
                    alt={`Foto placeholder untuk ${step.title}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 280px"
                    className="object-cover"
                  />
                  <span className="absolute left-4 top-4 rounded-md bg-white/95 px-3 py-2 text-sm font-bold text-amber-600 shadow-sm">
                    {step.number}
                  </span>
                  {index < steps.length - 1 ? (
                    <span className="absolute right-4 top-4 hidden h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white lg:flex">
                      <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                    </span>
                  ) : null}
                </div>
                <div className="p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-teal-700">
                    <i className={step.icon} aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-base font-semibold text-slate-950">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=900&q=80"
                alt="Foto placeholder area makan restoran"
                width={900}
                height={640}
                sizes="(max-width: 1024px) 100vw, 300px"
                className="h-64 w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:mt-10">
              <Image
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80"
                alt="Foto placeholder meja restoran"
                width={900}
                height={640}
                sizes="(max-width: 1024px) 100vw, 300px"
                className="h-64 w-full object-cover"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase text-teal-700">
              Catatan Implementasi
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Tampilan sudah siap diarahkan ke backend
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Saat ini halaman menggunakan foto dan data dummy. Struktur
              tampilan tetap disiapkan agar nanti data meja, layout ruangan,
              status reservasi, dan notifikasi bisa diambil dari API.
            </p>
            <div className="mt-6 grid gap-3">
              {notes.map((note) => (
                <article
                  key={note.title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
                      <i className={note.icon} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">
                        {note.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {note.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
