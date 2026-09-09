import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Download, Search, Share2, X } from "lucide-react";
import rawData from "@/data/postcodes.json";
import { Button } from "@/components/ui/button";

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

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function districtText(rows: Row[], english: string) {
  const bengali = rows[0]?.db ?? english;
  const lines = rows.map((row) => `${row.n} (${row.c}) — ${row.t} — ${row.o}`);
  return `${bengali} (${english}) postal codes\n${rows.length} post offices\n\n${lines.join("\n")}\n\nSource: Bengali Wikipedia · PostCode.Bangla`;
}

async function districtImage(rows: Row[], english: string) {
  await document.fonts.ready;
  const bengali = rows[0]?.db ?? english;
  const width = 1080;
  const headerHeight = 230;
  const rowHeight = 58;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = headerHeight + rows.length * rowHeight + 90;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#13263f";
  ctx.font = '700 48px "Google Sans", "Noto Sans Bengali", sans-serif';
  ctx.fillText(`${bengali} · ${english}`, 64, 78);
  ctx.fillStyle = "#53667f";
  ctx.font = '500 24px "Google Sans", "Noto Sans Bengali", sans-serif';
  ctx.fillText(`${rows.length} post offices · Bangladesh postal code list`, 64, 122);
  ctx.fillStyle = "#0877d1";
  ctx.fillRect(64, 160, 952, 4);
  ctx.fillStyle = "#53667f";
  ctx.font = '600 18px "Google Sans", "Noto Sans Bengali", sans-serif';
  ctx.fillText("POST CODE", 64, 205);
  ctx.fillText("THANA", 295, 205);
  ctx.fillText("SUB-OFFICE", 620, 205);

  rows.forEach((row, index) => {
    const y = headerHeight + index * rowHeight;
    if (index % 2 === 0) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(48, y, 984, rowHeight);
    }
    ctx.fillStyle = "#13263f";
    ctx.font = '500 21px "Google Sans", "Noto Sans Bengali", sans-serif';
    ctx.fillText(`${row.n}  ${row.c}`, 64, y + 37);
    ctx.fillText(row.t.slice(0, 24), 295, y + 37);
    ctx.fillText(row.o.slice(0, 28), 620, y + 37);
  });
  ctx.fillStyle = "#53667f";
  ctx.font = '500 17px "Google Sans", sans-serif';
  ctx.fillText("PostCode.Bangla · Data from Bengali Wikipedia", 64, canvas.height - 34);
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

function Index() {
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("All");
  const [district, setDistrict] = useState("All");
  const [limit, setLimit] = useState(PAGE);
  const [copied, setCopied] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState("");

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
  const districtRows = district === "All" ? [] : data.filter((row) => row.de === district);

  const copy = (row: Row) => {
    const text = `${row.o} - ${row.c}`;
    void copyText(text);
    setCopied(`${row.o}-${row.n}`);
    window.setTimeout(() => setCopied(null), 1200);
  };

  const reset = () => {
    setLimit(PAGE);
    setShareStatus("");
  };

  const shareText = async () => {
    if (!districtRows.length) return;
    const text = districtText(districtRows, district);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${district} postal codes`, text });
        setShareStatus("Shared");
      } else {
        await copyText(text);
        setShareStatus("List copied");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyText(text);
      setShareStatus("List copied");
    }
  };

  const shareImage = async () => {
    if (!districtRows.length) return;
    const blob = await districtImage(districtRows, district);
    if (!blob) return;
    const file = new File([blob], `${district.toLowerCase()}-postal-codes.png`, {
      type: "image/png",
    });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${district} postal codes`, files: [file] });
        setShareStatus("Image shared");
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    setShareStatus("Image downloaded");
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

        <section className="pb-7 pt-8 sm:pt-10">
          <div className="max-w-[46rem] animate-[rise_0.6s_var(--ease-kinetic)_both]">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">
              (a) Lookup
            </p>
            <h1 className="mt-2 text-balance font-display text-[2rem] font-extrabold leading-[1.12] sm:text-[2.65rem]">
              Find any <span className="text-brand">postal code</span> in seconds.
            </h1>
            <p className="mt-2 max-w-[62ch] text-pretty text-sm leading-6 text-fog sm:text-[15px]">
              Search all 64 districts and {data.length.toLocaleString()}+ post offices in English or বাংলা.
            </p>
          </div>

          <div className="relative mt-5 max-w-3xl animate-[rise_0.7s_var(--ease-kinetic)_both] [animation-delay:120ms]">
            <div className="absolute -inset-1 -z-10 -skew-x-3 rounded-xl bg-glass outline-1 -outline-offset-1 outline-foreground/10 backdrop-blur-xl" />
            <div className="flex h-13 items-center gap-3 rounded-xl bg-panel px-4 outline-2 outline-transparent ring-1 ring-foreground/5 backdrop-blur-xl transition-shadow focus-within:outline-brand/60">
              <Search className="h-5 w-5 shrink-0 text-fog" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  reset();
                }}
                placeholder="Code, district, thana or office…"
                aria-label="Search postal codes"
                className="min-w-0 flex-1 bg-transparent font-body text-[15px] outline-none placeholder:text-fog/60"
              />
              {query ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    reset();
                  }}
                  className="h-8 w-8 shrink-0 text-fog hover:text-ink"
                >
                  <X />
                </Button>
              ) : (
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-fog sm:block">
                  ↵
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 animate-[rise_0.7s_var(--ease-kinetic)_both] [animation-delay:200ms] sm:flex-wrap sm:overflow-visible">
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
                    className={`shrink-0 ${
                    active
                      ? d === "All"
                        ? "rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-medium text-background"
                        : "rounded-full bg-brand-soft px-3.5 py-1.5 text-[12px] font-medium text-brand ring-1 ring-brand/20"
                        : "rounded-full bg-panel px-3.5 py-1.5 text-[12px] font-medium text-fog ring-1 ring-line transition-colors hover:text-ink"
                    }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid max-w-[25rem] grid-cols-[auto_minmax(0,20rem)] items-center gap-2 animate-[rise_0.7s_var(--ease-kinetic)_both] [animation-delay:240ms]">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.16em] text-fog">
              District
            </span>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                reset();
              }}
              aria-label="Filter by district"
              className="min-w-0 rounded-full bg-panel px-3.5 py-1.5 text-[12px] font-medium text-ink ring-1 ring-line outline-none"
            >
              <option value="All">All districts</option>
              {districts.map(([en, bn]) => (
                <option key={en} value={en}>
                  {en} — {bn}
                </option>
              ))}
            </select>
          </div>

          {district !== "All" && (
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line pt-4 sm:flex">
              <div className="min-w-0 sm:mr-auto">
                <p className="truncate text-sm font-semibold text-ink">
                  Share {districtRows[0]?.db} ({district})
                </p>
                <p className="text-xs text-fog">{districtRows.length} post offices</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={shareText}>
                  <Share2 aria-hidden="true" />
                  Text
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={shareImage}>
                  <Download aria-hidden="true" />
                  Image
                </Button>
              </div>
              {shareStatus && (
                <span className="col-span-2 flex items-center gap-1 text-xs font-medium text-brand sm:col-auto">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> {shareStatus}
                </span>
              )}
            </div>
          )}
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
              <div className="hidden grid-cols-[1.5fr_1.3fr_1fr_auto] gap-3 border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-fog sm:grid">
                <span>District</span>
                <span>Thana</span>
                <span>Sub-office</span>
                <span className="text-right">Post code · tap to copy</span>
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
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 px-4 py-4 transition-colors hover:bg-brand-soft/50 sm:grid-cols-[1.5fr_1.3fr_1fr_auto] sm:items-center sm:px-5 sm:py-3"
                  >
                    <div className="col-start-1 min-w-0">
                      <span className="mr-2 text-[10px] uppercase text-fog sm:hidden">District</span>
                      <span className="bn text-[15px] text-ink">{r.db}</span>
                    </div>
                    <div className="col-start-1 min-w-0 sm:col-auto">
                      <span className="mr-2 text-[10px] uppercase text-fog sm:hidden">Thana</span>
                      <span className="bn text-fog">{r.t}</span>
                    </div>
                    <div className="col-start-1 min-w-0 sm:col-auto">
                      <span className="mr-2 text-[10px] uppercase text-fog sm:hidden">Office</span>
                      <span className="bn text-fog">{r.o}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Copy postal code ${r.c} of ${r.o}`}
                      onClick={() => copy(r)}
                      className={`col-start-2 row-start-1 justify-self-end rounded-lg px-3 py-1.5 text-right ring-1 transition-colors sm:col-auto sm:row-auto ${
                        copied === `${r.o}-${r.n}`
                          ? "bg-ink text-background ring-ink"
                          : "bg-panel text-ink ring-line hover:ring-brand/40"
                      }`}
                    >
                      <span className="bn block font-display text-sm font-bold leading-tight">
                        {r.c}
                      </span>
                      <span className="block font-mono text-[10px] leading-tight opacity-70">
                        {copied === `${r.o}-${r.n}` ? "Copied" : r.n}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-line px-5 py-4">
                <span className="font-mono text-[11px] text-fog">
                  Showing {shown.length.toLocaleString()} of {results.length.toLocaleString()}
                </span>
                {shown.length < results.length && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLimit((l) => l + PAGE)}
                    className="font-mono text-[11px] uppercase text-brand"
                  >
                    Load more ↓
                  </Button>
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
