"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "../../../_components/AdminShell";
import CustomSelect from "../../../_components/CustomSelect";
import FieldInput from "../../../_components/FieldInput";
import {
  apiFetch,
  categoryLabels,
  fallbackMenuImage,
  formatRupiah,
  statusLabels,
} from "../../../_lib/api";

const categoryOptions = [
  { label: "Semua kategori", value: "all" },
  { label: "Makanan Utama", value: "main_course" },
  { label: "Seafood", value: "seafood" },
  { label: "Minuman", value: "beverage" },
  { label: "Dessert", value: "dessert" },
  { label: "Paket", value: "package" },
  { label: "Services", value: "service" },
];

const statusOptions = [
  { label: "Semua status", value: "all" },
  { label: "Tersedia", value: "available" },
  { label: "Habis", value: "sold_out" },
  { label: "Disembunyikan", value: "hidden" },
];

const editStatusOptions = statusOptions.filter((option) => option.value !== "all");
const editCategoryOptions = categoryOptions.filter((option) => option.value !== "all");

const emptyForm = {
  id: "",
  name: "",
  category: "main_course",
  price: "",
  status: "available",
  isFavorite: false,
  imageUrl: "",
  description: "",
};

const maxImageSize = 2 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.readAsDataURL(file);
  });

export default function AdminMenuPage() {
  const [menus, setMenus] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editingMenu, setEditingMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const loadMenus = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch("/api/menus?status=all");
      setMenus(data);
      setNotice({ type: "", message: "" });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadMenus);
  }, []);

  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchCategory = categoryFilter === "all" || menu.category === categoryFilter;
      const matchStatus = statusFilter === "all" || menu.status === statusFilter;
      const matchQuery = menu.name.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchStatus && matchQuery;
    });
  }, [categoryFilter, menus, query, statusFilter]);

  const categoryCounts = editCategoryOptions.map((category) => ({
    ...category,
    total: menus.filter((menu) => menu.category === category.value).length,
  }));

  const stats = [
    ["Total Hidangan", menus.length, "fa-solid fa-bowl-food"],
    ["Tersedia", menus.filter((menu) => menu.status === "available").length, "fa-regular fa-circle-check"],
    ["Menu Unggulan", menus.filter((menu) => menu.isFavorite).length, "fa-solid fa-star"],
    ["Kategori", new Set(menus.map((menu) => menu.category)).size, "fa-solid fa-layer-group"],
  ];

  const openCreateModal = () => {
    setEditingMenu(emptyForm);
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      setNotice({ type: "error", message: "Format foto harus JPG, PNG, atau WEBP." });
      event.target.value = "";
      return;
    }

    if (file.size > maxImageSize) {
      setNotice({ type: "error", message: "Ukuran foto maksimal 2MB." });
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditingMenu((current) => ({
        ...current,
        imageUpload: {
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
        },
      }));
      setNotice({ type: "", message: "" });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  const saveMenu = async () => {
    setIsSaving(true);
    setNotice({ type: "", message: "" });

    try {
      let imageUrl = editingMenu.imageUrl;

      if (editingMenu.imageUpload) {
        const upload = await apiFetch("/api/admin/uploads/menu-image", {
          method: "POST",
          body: JSON.stringify(editingMenu.imageUpload),
        });
        imageUrl = upload.imageUrl;
      }

      const payload = {
        name: editingMenu.name,
        category: editingMenu.category,
        price: Number(editingMenu.price),
        description: editingMenu.description,
        imageUrl,
        isFavorite: editingMenu.isFavorite,
        status: editingMenu.status,
      };

      if (editingMenu.id) {
        await apiFetch(`/api/admin/menus/${editingMenu.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/admin/menus", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setEditingMenu(null);
      await loadMenus();
      setNotice({ type: "success", message: "Data hidangan berhasil disimpan." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell
      title="Kelola Hidangan"
      description="Kelola data menu makanan, minuman, kategori, harga, foto, dan status tampil pada katalog hidangan pelanggan."
    >
      {notice.message ? (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm font-semibold ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, icon]) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <i className={icon} aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-950">Kategori</h3>
              <p className="mt-1 text-sm text-slate-500">Ringkasan menu per kategori.</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-600 text-white transition hover:bg-teal-700"
              aria-label="Tambah hidangan"
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {categoryCounts.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setCategoryFilter(category.value)}
                className={`flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition ${
                  categoryFilter === category.value
                    ? "border-teal-300 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
                }`}
              >
                <span className="font-semibold">{category.label}</span>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">
                  {category.total}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_220px_180px_auto] lg:items-end">
            <div>
              <h3 className="font-bold text-slate-950">Daftar Hidangan</h3>
              <p className="mt-1 text-sm text-slate-500">
                Data hidangan terhubung langsung ke backend TiDB.
              </p>
            </div>
            <FieldInput
              label="Cari hidangan"
              icon="fa-solid fa-magnifying-glass"
              placeholder="Nama menu"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <CustomSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Tambah
            </button>
          </div>

          <div className="hidden border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-slate-500 lg:grid lg:grid-cols-[minmax(0,1fr)_150px_130px_88px] lg:items-center lg:gap-4">
            <span>Menu</span>
            <span>Kategori</span>
            <span>Harga</span>
            <span>Aksi</span>
          </div>

          <div className="divide-y divide-slate-200">
            {isLoading ? (
              <div className="p-8 text-center text-sm font-semibold text-slate-500">
                Memuat data hidangan...
              </div>
            ) : null}

            {!isLoading &&
              filteredMenus.map((menu) => (
                <article
                  key={menu.id}
                  className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_150px_130px_88px] lg:items-center lg:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      <Image
                        src={menu.imageUrl || fallbackMenuImage}
                        alt={`Foto ${menu.name}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized={Boolean(menu.imageUrl)}
                      />
                      <span
                        className={`absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md border text-[11px] shadow-sm ${
                          menu.isFavorite
                            ? "border-amber-300 bg-amber-400 text-white"
                            : "border-slate-200 bg-white/90 text-slate-400"
                        }`}
                        title={menu.isFavorite ? "Menu unggulan" : "Bukan menu unggulan"}
                      >
                        <i className={menu.isFavorite ? "fa-solid fa-star" : "fa-regular fa-star"} aria-hidden="true" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-950">{menu.name}</p>
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                          #{menu.id}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">
                        {menu.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 lg:hidden">Kategori</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 lg:mt-0">
                      {categoryLabels[menu.category] ?? menu.category}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 lg:hidden">Harga</p>
                    <p className="mt-1 text-sm font-bold text-teal-700 lg:mt-0">
                      {formatRupiah(menu.price)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingMenu(menu)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                  >
                    <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                    Edit
                  </button>
                </article>
              ))}

            {!isLoading && filteredMenus.length === 0 ? (
              <div className="m-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-950">Hidangan tidak ditemukan</p>
                <p className="mt-2 text-sm text-slate-500">
                  Tambahkan data dari tombol tambah atau ubah filter pencarian.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {editingMenu ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5 py-8">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-teal-700">Form Hidangan</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {editingMenu.id ? "Edit Menu" : "Tambah Menu"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingMenu(null)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                aria-label="Tutup form hidangan"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FieldInput
                label="Nama menu"
                value={editingMenu.name}
                onChange={(event) => setEditingMenu({ ...editingMenu, name: event.target.value })}
                icon="fa-solid fa-bowl-food"
                placeholder="Nama hidangan"
              />
              <FieldInput
                label="Harga"
                value={editingMenu.price}
                onChange={(event) => setEditingMenu({ ...editingMenu, price: event.target.value })}
                icon="fa-solid fa-tag"
                placeholder="48000"
              />
              <CustomSelect
                label="Kategori"
                value={editingMenu.category}
                onChange={(category) => setEditingMenu({ ...editingMenu, category })}
                options={editCategoryOptions}
              />
              <CustomSelect
                label="Status"
                value={editingMenu.status}
                onChange={(status) => setEditingMenu({ ...editingMenu, status })}
                options={editStatusOptions}
              />
              <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2 sm:grid-cols-[160px_minmax(0,1fr)]">
                <div className="relative h-36 overflow-hidden rounded-md bg-white">
                  <Image
                    src={editingMenu.imageUpload?.dataUrl || editingMenu.imageUrl || fallbackMenuImage}
                    alt="Preview foto hidangan"
                    fill
                    sizes="160px"
                    className="object-cover"
                    unoptimized={Boolean(editingMenu.imageUpload?.dataUrl || editingMenu.imageUrl)}
                  />
                </div>
                <div className="grid content-start gap-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Upload foto</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageFileChange}
                      className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:border-teal-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>
                  <FieldInput
                    label="URL foto"
                    value={editingMenu.imageUrl ?? ""}
                    onChange={(event) =>
                      setEditingMenu({ ...editingMenu, imageUrl: event.target.value, imageUpload: null })
                    }
                    icon="fa-regular fa-image"
                    placeholder="https://..."
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Upload JPG, PNG, atau WEBP maksimal 2MB. URL akan disimpan ke kolom image_url.
                  </p>
                </div>
              </div>
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Deskripsi</span>
                <textarea
                  value={editingMenu.description}
                  onChange={(event) => setEditingMenu({ ...editingMenu, description: event.target.value })}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  placeholder="Deskripsi singkat hidangan"
                />
              </label>
              <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={editingMenu.isFavorite}
                  onChange={(event) => setEditingMenu({ ...editingMenu, isFavorite: event.target.checked })}
                  className="h-4 w-4 accent-teal-600"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Tampilkan sebagai menu unggulan di halaman pelanggan
                </span>
              </label>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={saveMenu}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Menyimpan..." : "Simpan ke Backend"}
            </button>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
