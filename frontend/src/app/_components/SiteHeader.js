"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, clearAuthSession } from "../_lib/api";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Hidangan", href: "/hidangan" },
  { label: "Cara Kerja", href: "/cara-kerja" },
  { label: "Reservasi", href: "/reservasi" },
  { label: "Riwayat", href: "/riwayat" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async (activeUser) => {
    if (!activeUser?.id) {
      setNotifications([]);
      return;
    }

    try {
      const data = await apiFetch(`/api/notifications/user/${activeUser.id}`);
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  }, []);

  const loadUser = useCallback(() => {
    try {
      const storedAuth = localStorage.getItem("nusantara_auth");
      const storedLegacyUser = localStorage.getItem("nusantara_user");

      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        const activeUser = auth.user ?? null;
        setUser(activeUser);
        void loadNotifications(activeUser);
        return;
      }

      const legacyUser = storedLegacyUser ? JSON.parse(storedLegacyUser) : null;
      setUser(legacyUser);
      void loadNotifications(legacyUser);
    } catch {
      setUser(null);
      setNotifications([]);
    }
  }, [loadNotifications]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadUser);

    window.addEventListener("storage", loadUser);
    window.addEventListener("nusantara-auth-change", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("nusantara-auth-change", loadUser);
    };
  }, [loadUser]);

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setNotifications([]);
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  const profileButton = (
    <button
      type="button"
      onClick={() => {
        setIsNotificationOpen(false);
        setIsProfileOpen((current) => !current);
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-100"
      aria-label="Buka pengaturan profil"
      aria-expanded={isProfileOpen}
    >
      <i className="fa-regular fa-user" aria-hidden="true" />
    </button>
  );

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-all duration-300 ${
        isScrolled
          ? "border-slate-200 bg-white/95 shadow-lg shadow-slate-200/60 backdrop-blur"
          : "border-transparent bg-white/90 backdrop-blur-sm"
      }`}
    >
      <nav
        className={`mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 transition-all duration-300 md:flex-nowrap ${
          isScrolled ? "py-2" : "py-3"
        }`}
      >
        <Link href="/" className="flex items-center gap-3 font-semibold text-slate-950">
          <span
            className={`flex items-center justify-center rounded-lg bg-teal-600 text-white transition-all duration-300 ${
              isScrolled ? "h-8 w-8" : "h-9 w-9"
            }`}
          >
            <i className="fa-solid fa-utensils" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            Nusantara Table
            <span className="block text-xs font-medium text-slate-500">
              Restaurant & Reservation
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative whitespace-nowrap rounded-md px-3 py-2 transition ${
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "hover:bg-slate-100 hover:text-teal-700"
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-teal-600 transition-all duration-300 ${
                    isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => setIsNotificationOpen(true)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
            aria-label="Buka notifikasi"
          >
            <i className="fa-regular fa-bell" aria-hidden="true" />
            {notifications.some((notification) => !notification.is_read) ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-teal-600 ring-2 ring-white" />
            ) : null}
          </button>
          {user ? (
            profileButton
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded-md px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  pathname === "/login"
                    ? "bg-slate-100 text-teal-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  pathname === "/register"
                    ? "bg-amber-500 text-white"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-teal-300 hover:text-teal-700 md:hidden"
          aria-label="Buka menu navigasi"
          aria-expanded={isMenuOpen}
        >
          <i className="fa-solid fa-bars-staggered" aria-hidden="true" />
        </button>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-300 md:hidden ${
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[min(82vw,340px)] flex-col border-l border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 transition-transform duration-300 md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3 font-semibold text-slate-950"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
              <i className="fa-solid fa-utensils" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              Nusantara Table
              <span className="block text-xs font-medium text-slate-500">
                Restaurant & Reservation
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            aria-label="Tutup menu navigasi"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-8 grid gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between rounded-md px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
                {isActive ? (
                  <span className="h-2 w-2 rounded-full bg-teal-600" />
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto grid gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              setIsNotificationOpen(true);
            }}
            className="relative inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
          >
            <i className="fa-regular fa-bell" aria-hidden="true" />
            Notifikasi
            {notifications.some((notification) => !notification.is_read) ? (
              <span className="absolute right-4 top-3 h-2.5 w-2.5 rounded-full bg-teal-600" />
            ) : null}
          </button>
          {user ? (
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsProfileOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white"
            >
              <i className="fa-regular fa-user" aria-hidden="true" />
              Profil
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </aside>

      {isProfileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-x-0 top-16 bottom-0 z-20 cursor-default bg-transparent"
            aria-label="Tutup pengaturan user"
            onClick={() => setIsProfileOpen(false)}
          />
          <section className="absolute right-5 top-full z-40 mt-3 w-[min(calc(100vw-2.5rem),24rem)] rounded-lg border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/20 md:right-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
            <div>
              <p className="text-xs font-semibold uppercase text-teal-700">
                Pengaturan User
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Profil Pelanggan
              </h2>
            </div>

            <div className="mt-4 flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-base font-bold text-white">
                {(user?.name || "U")
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-950">{user?.name || "Pelanggan"}</p>
                <p className="mt-1 truncate text-sm text-slate-600">{user?.email}</p>
                <span className="mt-2 inline-flex rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
                  {user?.role || "Pelanggan"}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <Link
                href="/riwayat"
                onClick={() => setIsProfileOpen(false)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
              >
                <i className="fa-regular fa-clock" aria-hidden="true" />
                Riwayat Reservasi
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                Logout
              </button>
            </div>
          </section>
        </>
      ) : null}

      {isNotificationOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-x-0 top-16 bottom-0 z-20 cursor-default bg-transparent"
            aria-label="Tutup notifikasi"
            onClick={() => setIsNotificationOpen(false)}
          />
          <div className="absolute right-5 top-full z-40 mt-3 w-[min(calc(100vw-2.5rem),28rem)] rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 md:right-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-semibold uppercase text-teal-700">
                  Notifikasi
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Pembaruan reservasi
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                aria-label="Tutup notifikasi"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3">
              {notifications.length ? notifications.map((notification) => (
                <article
                  key={notification.id}
                  className="rounded-lg p-3 transition hover:bg-slate-50"
                >
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <i className="fa-regular fa-bell" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-950">
                          {notification.title}
                        </h3>
                        {!notification.is_read ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-400">
                        {new Date(notification.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </article>
              )) : (
                <div className="rounded-lg bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                  Belum ada notifikasi.
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setIsNotificationOpen(false)}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Tandai Semua Dibaca
              </button>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
