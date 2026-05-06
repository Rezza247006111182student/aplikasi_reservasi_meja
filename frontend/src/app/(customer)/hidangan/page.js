import Image from "next/image";
import Link from "next/link";
import SiteFooter from "../../_components/SiteFooter";
import SiteHeader from "../../_components/SiteHeader";
import {
  categoryLabels,
  fallbackMenuImage,
  formatRupiah,
} from "../../_lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getMenus() {
  try {
    const response = await fetch(`${API_URL}/api/menus?status=available`, {
      cache: "no-store",
    });

    if (!response.ok) return [];

    const payload = await response.json();
    return payload.data ?? [];
  } catch {
    return [];
  }
}

const buildSectionId = (category) => category.replaceAll("_", "-");

export default async function HidanganPage() {
  const dishes = await getMenus();
  const categories = [...new Set(dishes.map((dish) => dish.category))];
  const heroDishes = dishes.slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold uppercase text-teal-800">
              <i className="fa-solid fa-bowl-food" aria-hidden="true" />
              Menu Nusantara Table
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              Semua hidangan restoran dalam satu katalog
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Lihat pilihan menu berdasarkan data dari backend TiDB. Hidangan
              dapat diperbarui melalui halaman admin.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/reservasi"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                <i className="fa-solid fa-chair" aria-hidden="true" />
                Reservasi Meja
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
              >
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                Kembali
              </Link>
            </div>
          </div>

          {heroDishes.length ? (
            <div className="animate-fade-up-delay grid auto-rows-[170px] gap-4 sm:grid-cols-2 sm:auto-rows-[190px]">
              {heroDishes.map((dish, index) => (
                <div
                  key={dish.id}
                  className={`relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${
                    index === 0 ? "sm:row-span-2" : ""
                  }`}
                >
                  <Image
                    src={dish.imageUrl || fallbackMenuImage}
                    alt={`Foto ${dish.name}`}
                    width={900}
                    height={640}
                    sizes="(max-width: 1024px) 50vw, 280px"
                    className="h-full w-full object-cover"
                    unoptimized={Boolean(dish.imageUrl)}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-4 text-white">
                    <p className="text-xs font-semibold uppercase text-teal-100">
                      {categoryLabels[dish.category] ?? dish.category}
                    </p>
                    <h2 className="text-sm font-bold">{dish.name}</h2>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-950">Belum ada hidangan</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tambahkan menu melalui admin agar katalog pelanggan terisi.
              </p>
            </div>
          )}
        </div>
      </section>

      {categories.length ? (
        <section className="border-b border-slate-200 bg-slate-50 py-8">
          <div className="mx-auto flex w-full max-w-6xl gap-3 overflow-x-auto px-5">
            {categories.map((category) => (
              <a
                key={category}
                href={`#${buildSectionId(category)}`}
                className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
              >
                {categoryLabels[category] ?? category}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-teal-700">
                Daftar Hidangan
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">
                Menu berdasarkan kategori
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Data menu ditampilkan langsung dari backend.
            </p>
          </div>

          <div className="mt-10 grid gap-12">
            {categories.map((category) => {
              const categoryDishes = dishes.filter((dish) => dish.category === category);

              return (
                <section key={category} id={buildSectionId(category)} className="scroll-mt-28">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-bold text-slate-950">
                      {categoryLabels[category] ?? category}
                    </h3>
                    <span className="rounded-md bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      {categoryDishes.length} menu
                    </span>
                  </div>

                  <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryDishes.map((dish) => (
                      <article
                        key={dish.id}
                        className="flex h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70"
                      >
                        <div className="grid w-full grid-rows-[190px_1fr]">
                          <div className="overflow-hidden bg-slate-100">
                            <Image
                              src={dish.imageUrl || fallbackMenuImage}
                              alt={`Foto ${dish.name}`}
                              width={900}
                              height={640}
                              sizes="(max-width: 768px) 100vw, 360px"
                              className="h-full w-full object-cover"
                              unoptimized={Boolean(dish.imageUrl)}
                            />
                          </div>
                          <div className="flex flex-col p-5">
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="text-lg font-semibold text-slate-950">
                                {dish.name}
                              </h4>
                              <span className="shrink-0 rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {categoryLabels[category] ?? category}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {dish.description}
                            </p>
                            <p className="mt-auto pt-5 text-base font-bold text-teal-700">
                              {formatRupiah(dish.price)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
