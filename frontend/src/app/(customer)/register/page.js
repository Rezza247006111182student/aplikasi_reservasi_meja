"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, saveAuthSession } from "../../_lib/api";

const fields = [
  { name: "name", label: "Nama lengkap", type: "text", placeholder: "Masukkan nama lengkap" },
  { name: "email", label: "Email", type: "email", placeholder: "nama@email.com" },
  { name: "phone", label: "Nomor telepon", type: "tel", placeholder: "08xxxxxxxxxx" },
  { name: "password", label: "Password", type: "password", placeholder: "Minimal 8 karakter" },
  { name: "confirmPassword", label: "Konfirmasi password", type: "password", placeholder: "Ulangi password" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    fields.forEach((field) => {
      if (!form[field.name].trim()) {
        nextErrors[field.name] = `${field.label} wajib diisi.`;
      }
    });

    if (form.password && form.password.length < 8) {
      nextErrors.password = "Password minimal 8 karakter.";
    }

    if (form.confirmPassword && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Konfirmasi password tidak sama.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      saveAuthSession(data);
      router.push("/reservasi");
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
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10">
        <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/80 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 font-semibold text-slate-950">
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
            <span className="hidden rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 sm:inline-flex">
              Pelanggan
            </span>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm font-semibold uppercase text-teal-700">Register</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Buat Akun</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Daftar untuk memilih meja di Nusantara Table dari denah interaktif dan menyimpan riwayat reservasi.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {Object.values(errors).some(Boolean) ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errors.form || "Periksa kembali data pendaftaran."}
              </div>
            ) : null}

            {fields.map((field) => (
              <label key={field.label} className="block">
                <span className="text-sm font-semibold text-slate-700">{field.label}</span>
                <input
                  type={field.type}
                  value={form[field.name]}
                  onChange={(event) => updateField(field.name, event.target.value)}
                  placeholder={field.placeholder}
                  className={`mt-2 h-12 w-full rounded-md border bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
                    errors[field.name] ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"
                  }`}
                />
                {errors[field.name] ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {errors[field.name]}
                  </p>
                ) : null}
              </label>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <i className="fa-solid fa-user-plus" aria-hidden="true" />
              {isSubmitting ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
