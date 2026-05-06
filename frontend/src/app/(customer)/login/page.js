"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import InteractiveFloorPlan from "../../_components/InteractiveFloorPlan";
import { apiFetch, saveAuthSession } from "../../_lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.email.trim() || !form.password.trim()) {
      if (!form.email.trim()) nextErrors.email = "Email wajib diisi.";
      if (!form.password.trim()) nextErrors.password = "Password wajib diisi.";
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      saveAuthSession(data);
      router.push(data.user.role === "admin" ? "/admin" : "/reservasi");
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_0.86fr]">
        <section className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/80 lg:block">
          <div className="grid min-h-[560px] grid-rows-[auto_1fr]">
            <div className="border-b border-slate-200 bg-slate-50 p-6">
              <Link href="/" className="inline-flex items-center gap-3 font-semibold text-slate-950">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <i className="fa-solid fa-utensils" aria-hidden="true" />
                </span>
                <span className="leading-tight">
                  Nusantara Table
                  <span className="block text-xs font-medium text-slate-500">
                    Restaurant & Reservation
                  </span>
                </span>
              </Link>

              <div className="mt-8 max-w-xl">
                <p className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold uppercase text-teal-800">
                  <i className="fa-solid fa-table-cells-large" aria-hidden="true" />
                  Interactive Floor Plan
                </p>
                <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-950">
                  Masuk dan lanjutkan reservasi meja favoritmu.
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                  Akses denah lantai, pilih ruangan, dan lihat status meja
                  Nusantara Table dalam satu alur yang ringkas.
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <InteractiveFloorPlan compact minimal />
              </div>

              <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  ["Tersedia", "bg-green-50 text-green-700"],
                  ["Telah dipesan", "bg-amber-50 text-amber-700"],
                  ["Sedang dipakai", "bg-red-50 text-red-700"],
                  ["Tidak aktif", "bg-slate-100 text-slate-700"],
                ].map(([label, className]) => (
                  <div
                    key={label}
                    className={`flex min-h-14 items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-center ${className}`}
                  >
                    <p className="text-sm font-bold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/80 sm:p-8">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 lg:hidden">
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            Kembali ke Home
          </Link>

          <div>
            <p className="text-sm font-semibold uppercase text-teal-700">Login</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Login ke Akun Anda</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Gunakan email dan password yang sudah terdaftar untuk melanjutkan reservasi di Nusantara Table.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {Object.values(errors).some(Boolean) ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errors.form || "Lengkapi data login terlebih dahulu."}
              </div>
            ) : null}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="nama@email.com"
                className={`mt-2 h-12 w-full rounded-md border bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition hover:border-teal-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                  errors.email ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"
                }`}
              />
              {errors.email ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.email}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Masukkan password"
                className={`mt-2 h-12 w-full rounded-md border bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition hover:border-teal-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                  errors.password ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"
                }`}
              />
              {errors.password ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.password}</p>
              ) : null}
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
              {isSubmitting ? "Memproses..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-800">
              Register
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
