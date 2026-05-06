const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiFetch(path, options = {}) {
  let token = "";

  if (typeof window !== "undefined") {
    try {
      token = JSON.parse(localStorage.getItem("nusantara_auth") || "{}").token || "";
    } catch {
      token = "";
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request gagal");
  }

  return payload.data ?? payload;
}

export const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const categoryLabels = {
  main_course: "Makanan Utama",
  seafood: "Seafood",
  beverage: "Minuman",
  dessert: "Dessert",
  package: "Paket",
  service: "Services",
};

export const statusLabels = {
  available: "Tersedia",
  sold_out: "Habis",
  hidden: "Disembunyikan",
};

export const reservationStatusLabels = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};

export const tableStatusLabels = {
  available: "Tersedia",
  reserved: "Dipesan",
  booked: "Dipesan",
  inactive: "Tidak aktif",
};

export const fallbackMenuImage =
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80";

export function saveAuthSession(auth) {
  localStorage.setItem("nusantara_auth", JSON.stringify(auth));
  localStorage.removeItem("nusantara_user");
  document.cookie = `nusantara_token=${auth.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  window.dispatchEvent(new Event("nusantara-auth-change"));
}

export function clearAuthSession() {
  localStorage.removeItem("nusantara_auth");
  localStorage.removeItem("nusantara_user");
  document.cookie = "nusantara_token=; path=/; max-age=0; SameSite=Lax";
  window.dispatchEvent(new Event("nusantara-auth-change"));
}
