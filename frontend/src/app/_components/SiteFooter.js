export default function SiteFooter() {
  return (
    <footer className="bg-slate-950 py-10 text-slate-300">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:grid-cols-4">
        <div>
          <h3 className="font-semibold text-white">Nusantara Table</h3>
          <p className="mt-3 text-sm leading-6">
            Restoran Indonesia modern dengan reservasi meja mandiri.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Kontak restoran</h4>
          <p className="mt-3 text-sm leading-6">
            Jl. Senja Rasa No. 18
            <br />
            0812-3456-7890
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Jam operasional</h4>
          <p className="mt-3 text-sm leading-6">
            Senin - Jumat, 10.00 - 22.00
            <br />
            Sabtu - Minggu, 09.00 - 23.00
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Sosial media</h4>
          <div className="mt-3 flex gap-3">
            {["fa-brands fa-instagram", "fa-brands fa-facebook", "fa-brands fa-x-twitter"].map(
              (icon) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 text-slate-200 transition hover:bg-teal-600"
                  aria-label="Sosial media restoran"
                >
                  <i className={icon} aria-hidden="true" />
                </a>
              ),
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 w-full max-w-6xl border-t border-slate-800 px-5 pt-6 text-sm text-slate-500">
        Copyright 2026 Nusantara Table. All rights reserved.
      </div>
    </footer>
  );
}
