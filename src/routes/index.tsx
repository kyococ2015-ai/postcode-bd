import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import rawData from "@/data/postcodes.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PostCode.Bangla — Find any Bangladesh post code" },
      {
        name: "description",
        content:
          "Instantly search 1,357 Bangladesh post offices by post code, district, thana or sub-office. Bengali names with English district spellings.",
      },
      { property: "og:title", content: "PostCode.Bangla — Find any Bangladesh post code" },
      {
        property: "og:description",
        content:
          "Instantly search Bangladesh post codes by district, thana or sub-office in Bengali or English.",
      },
    ],
  }),
  component: Index,
});

type Row = {
  dv: string;
  db: string;
  de: string;
  t: string;
  o: string;
  c: string;
  n: string;
};

const data = rawData as Row[];

const DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Mymensingh",
];

const indexed = data.map((r) => ({
  row: r,
  key: `${r.db} ${r.de} ${r.t} ${r.o} ${r.c} ${r.n} ${r.dv}`.toLowerCase(),
}));

const PAGE = 60;

function Index() {
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("All");
  const [district, setDistrict] = useState("All");
  const [limit, setLimit] = useState(PAGE);
  const [copied, setCopied] = useState<string | null>(null);

  const districts = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of data) {
      if (division !== "All" && r.dv !== division) continue;
      map.set(r.de, r.db);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [division]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    return indexed
      .filter(({ row, key }) => {
        if (division !== "All" && row.dv !== division) return false;
        if (district !== "All" && row.de !== district) return false;
        return terms.every((t) => key.includes(t));
      })
      .map((i) => i.row);
  }, [query, division, district]);

  const shown = results.slice(0, limit);

  const copy = (row: Row) => {
    const text = row.n;
    void navigator.clipboard?.writeText(text);
    setCopied(`${row.o}-${row.n}`);
    window.setTimeout(() => setCopied(null), 1200);
  };

  const reset = () => {
    setLimit(PAGE);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background font-body text-ink antialiased selection:bg-brand-soft">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(125deg, transparent 42%, oklch(0.6 0.2 253 / 0.1) 50%, transparent 58%)",
          backgroundSize: "240% 240%",
          animation: "sheen 9s var(--ease-kinetic) infinite",
        }}
      />
      <div className="pointer-events-none absolute -left-40 top-10 -z-10 h-[420px] w-[520px] -skew-x-12 rounded-[40px] bg-glass opacity-70 outline-1 -outline-offset-1 outline-white/40 backdrop-blur-xl" />
      <div className="pointer-events-none absolute -right-52 top-40 -z-10 h-[460px] w-[560px] skew-x-12 rounded-[44px] bg-glass2 opacity-60 outline-1 -outline-offset-1 outline-white/40 backdrop-blur-xl" />

      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <header className="sticky top-0 z-20 -mx-5 border-b border-line bg-background/70 backdrop-blur-xl sm:-mx-8">
          <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 -skew-x-6 place-items-center rounded-md bg-ink font-mono text-xs font-medium text-background">
                <span className="font-bn">প</span>
              </div>
              <div className="leading-none">
                <div className="font-display text-[15px] font-extrabold tracking-tight">
                  PostCode<b className="text-brand">.</b>Bangla
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fog">
                  Postal Reference Registry
                </div>
              </div>
            </div>
            <div className="hidden items-center gap-5 font-mono text-[11px] uppercase tracking-[0.14em] text-fog sm:flex">
              <span>{data.length.toLocaleString()} offices</span>
              <span className="text-ink">8 divisions</span>
              <span>64 districts</span>
            </div>
          </div>
        </header>

        <section className="pb-10 pt-14">
          <div className="max-w-[34ch] animate-[rise_0.6s_var(--ease-kinetic)_both]">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">
              (a) Lookup
            </p>
            <h1 className="mt-3 text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Find any office by <span className="text-brand">code</span> or name.
            </h1>
            <p className="mt-4 max-w-[46ch] text-pretty text-[15px] leading-relaxed text-fog">
              Search post codes, districts, thanas and sub-offices across Bangladesh. Labels in
              English; place names in Bengali with English alongside.
            </p>
          </div>

          <div className="relative mt-8 max-w-2xl animate-[rise_0.7s_var(--ease-kinetic)_both] [animation-delay:120ms]">
            <div className="absolute -inset-1 -z-10 -skew-x-3 rounded-2xl bg-glass outline-1 -outline-offset-1 outline-white/50 backdrop-blur-xl" />
            <div className="flex items-center gap-3 rounded-2xl bg-panel px-5 py-4 outline-2 outline-transparent ring-1 ring-black/5 backdrop-blur-xl transition-shadow focus-within:outline-brand/60">
              <span className="select-none font-mono text-lg text-brand">/</span>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  reset();
                }}
                placeholder="Code, district, thana or office…"
                className="flex-1 bg-transparent font-bn text-[15px] outline-none placeholder:text-fog/60"
              />
              {query ? (
                <button
                  onClick={() => {
                    setQuery("");
                    reset();
                  }}
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog hover:text-ink"
                >
                  Clear
                </button>
              ) : (
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-fog sm:block">
                  ↵
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 animate-[rise_0.7s_var(--ease-kinetic)_both] [animation-delay:200ms]">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.16em] text-fog">
              Division
            </span>
            {["All", ...DIVISIONS].map((d) => {
              const active = division === d;
              return (
                <button
                  key={d}
                  onClick={() => {
                    setDivision(d);
                    setDistrict("All");
                    reset();
                  }}
                  className={
                    active
                      ? d === "All"
                        ? "rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-medium text-background"
                        : "rounded-full bg-brand-soft px-3.5 py-1.5 text-[12px] font-medium text-brand ring-1 ring-brand/20"
                      : "rounded-full bg-white/60 px-3.5 py-1.5 text-[12px] font-medium text-fog ring-1 ring-line transition-colors hover:text-ink"
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 animate-[rise_0.7s_var(--ease-kinetic)_both] [animation-delay:240ms]">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.16em] text-fog">
              District
            </span>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                reset();
              }}
              className="rounded-full bg-white/60 px-3.5 py-1.5 text-[12px] font-medium text-ink ring-1 ring-line outline-none"
            >
              <option value="All">All districts</option>
              {districts.map(([en, bn]) => (
                <option key={en} value={en}>
                  {en} — {bn}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="pb-16">
          <div className="mb-3 flex items-end justify-between animate-[rise_0.6s_var(--ease-kinetic)_both] [animation-delay:260ms]">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-lg font-extrabold tracking-tight">Results</h2>
              <span className="font-mono text-[11px] text-fog">
                {results.length.toLocaleString()} matches
              </span>
            </div>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-fog sm:block">
              Sorted · relevance
            </span>
          </div>

          <div className="relative animate-[sweep_0.7s_var(--ease-kinetic)_both] [animation-delay:320ms]">
            <div className="absolute -inset-1 -z-10 skew-x-[-1.5deg] rounded-[20px] bg-glass outline-1 -outline-offset-1 outline-white/50 backdrop-blur-xl" />
            <div className="overflow-hidden rounded-[16px] bg-panel ring-1 ring-black/5 backdrop-blur-xl">
              <div className="grid grid-cols-[1.1fr_1.5fr_1.3fr_1fr_auto] gap-3 border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
                <span>Post code</span>
                <span>District</span>
                <span>Thana</span>
                <span>Sub-office</span>
                <span className="text-right">Copy</span>
              </div>
              <div className="divide-y divide-line text-sm">
                {shown.length === 0 && (
                  <div className="px-5 py-10 text-center text-sm text-fog">
                    No office matches “{query}”. Try a district name in English or Bengali.
                  </div>
                )}
                {shown.map((r) => (
                  <div
                    key={`${r.db}-${r.t}-${r.o}-${r.n}`}
                    className="grid grid-cols-[1.1fr_1.5fr_1.3fr_1fr_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-brand-soft/50"
                  >
                    <span className="font-mono font-medium text-ink">
                      {r.n} <span className="bn text-fog">{r.c}</span>
                    </span>
                    <span>
                      <span className="bn text-[15px]">{r.db}</span>{" "}
                      <span className="text-fog">{r.de}</span>
                    </span>
                    <span className="bn text-fog">{r.t}</span>
                    <span className="bn text-fog">{r.o}</span>
                    <button
                      onClick={() => copy(r)}
                      className={
                        copied === `${r.o}-${r.n}`
                          ? "justify-self-end rounded-md bg-ink px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-background"
                          : "justify-self-end rounded-md px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-fog ring-1 ring-line transition-colors hover:text-ink"
                      }
                    >
                      {copied === `${r.o}-${r.n}` ? "Copied" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-line px-5 py-4">
                <span className="font-mono text-[11px] text-fog">
                  Showing {shown.length.toLocaleString()} of {results.length.toLocaleString()}
                </span>
                {shown.length < results.length && (
                  <button
                    onClick={() => setLimit((l) => l + PAGE)}
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-brand"
                  >
                    Load more ↓
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-fog">
            PostCode.Bangla · Reference Registry
          </div>
          <div className="font-mono text-[11px] text-fog">
            Data from Bengali Wikipedia · 8 divisions · 64 districts
          </div>
        </footer>
      </div>
    </div>
  );
}
