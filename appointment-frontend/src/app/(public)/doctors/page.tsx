"use client";

import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  SlidersHorizontal,
  X,
  Loader2,
} from "lucide-react";
import { doctorService } from "@/services/doctor.service";
import { BookingWizard } from "@/components/booking/BookingWizard";
import {
  DoctorCard,
  type DoctorCardModel,
} from "@/components/doctors/DoctorCard";
import { EmptyState } from "@/components/ui/empty-state";

const SPECIALTIES = [
  "General Practice",
  "Surgery",
  "Dermatology",
  "Dentistry",
  "Emergency Care",
  "Nutrition",
  "Behavior",
  "Exotic Pets",
  "Cardiology",
  "Neurology",
  "Ophthalmology",
  "Orthopedics",
];
const ITEMS_PER_PAGE = 12;

function matchSpecialtyFromQuery(query: string): string | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  return SPECIALTIES.find((s) => s.toLowerCase() === normalized) ?? null;
}

function filtersFromQuery(query: string | null): {
  search: string;
  selectedSpecs: string[];
} {
  const q = query?.trim() ?? "";
  if (!q) return { search: "", selectedSpecs: [] };
  const specialty = matchSpecialtyFromQuery(q);
  if (specialty) return { search: "", selectedSpecs: [specialty] };
  return { search: q, selectedSpecs: [] };
}

function queryFromFilters(search: string, selectedSpecs: string[]): string {
  const text = search.trim();
  if (text) return text;
  if (selectedSpecs.length === 1) return selectedSpecs[0];
  return "";
}

function DoctorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialFilters = useMemo(() => {
    const q = searchParams.get("q")?.trim() ?? "";
    return { q, ...filtersFromQuery(q || null) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastUrlQRef = useRef(initialFilters.q);
  const skipUrlSyncRef = useRef(true);

  const [doctors, setDoctors] = useState<DoctorCardModel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState(initialFilters.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    initialFilters.selectedSpecs,
  );
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"next" | "rating">("next");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState<DoctorCardModel | null>(
    null,
  );

  useEffect(() => {
    const q = searchParams.get("q")?.trim() ?? "";
    if (lastUrlQRef.current === q) return;
    lastUrlQRef.current = q;
    skipUrlSyncRef.current = true;
    const { search: urlSearch, selectedSpecs: urlSpecs } = filtersFromQuery(
      q || null,
    );
    setSearch(urlSearch);
    setDebouncedSearch(urlSearch);
    setSelectedSpecs(urlSpecs);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }
    const nextQ = queryFromFilters(debouncedSearch, selectedSpecs);
    if (lastUrlQRef.current === nextQ) return;
    lastUrlQRef.current = nextQ;
    skipUrlSyncRef.current = true;
    router.replace(
      nextQ ? `/doctors?q=${encodeURIComponent(nextQ)}` : "/doctors",
      { scroll: false },
    );
  }, [debouncedSearch, selectedSpecs, router]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(ITEMS_PER_PAGE),
        sortBy,
        ...(availableOnly ? { availableOnly: "true" } : {}),
      });
      if (debouncedSearch) {
        params.set("q", debouncedSearch);
      } else if (selectedSpecs.length > 0) {
        params.set("specialties", selectedSpecs.join(","));
      }
      const data: any = await doctorService.list(params);
      setDoctors(data.items ?? []);
      setTotal(data.total ?? data.items?.length ?? 0);
    } catch {
      setDoctors([]);
      setTotal(0);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedSpecs, availableOnly, sortBy]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const toggleSpec = (spec: string) => {
    setPage(1);
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec],
    );
  };

  const clearAll = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedSpecs([]);
    setAvailableOnly(false);
    setSortBy("next");
    setPage(1);
    lastUrlQRef.current = "";
    skipUrlSyncRef.current = true;
    router.replace("/doctors", { scroll: false });
  };

  const hasFilters =
    selectedSpecs.length > 0 || availableOnly || debouncedSearch;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const rangeStart = total === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(page * ITEMS_PER_PAGE, total);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-on-surface">Filters</h2>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      <div className="border-b border-outline-variant pb-5">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Specialization
        </h3>
        <div className="space-y-2.5">
          {SPECIALTIES.map((spec) => {
            const checked = selectedSpecs.includes(spec);
            return (
              <label
                key={spec}
                className="group flex cursor-pointer items-center gap-3"
              >
                <div
                  onClick={() => toggleSpec(spec)}
                  className={`flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors ${
                    checked
                      ? "border-primary bg-primary"
                      : "border-outline-variant group-hover:border-primary"
                  }`}
                >
                  {checked && (
                    <Check size={10} className="text-on-primary" strokeWidth={3} />
                  )}
                </div>
                <span className="text-sm text-on-surface transition-colors group-hover:text-primary">
                  {spec}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="border-b border-outline-variant pb-5">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Availability
        </h3>
        <label className="group flex cursor-pointer items-center gap-3">
          <div
            onClick={() => {
              setAvailableOnly((v) => !v);
              setPage(1);
            }}
            className={`flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors ${
              availableOnly
                ? "border-primary bg-primary"
                : "border-outline-variant group-hover:border-primary"
            }`}
          >
            {availableOnly && (
              <Check size={10} className="text-on-primary" strokeWidth={3} />
            )}
          </div>
          <span className="text-sm text-on-surface group-hover:text-primary">
            Available now
          </span>
        </label>
      </div>

      <div>
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Sort by
        </h3>
        <div className="flex gap-2">
          {(["next", "rating"] as const).map((val) => (
            <button
              key={val}
              onClick={() => {
                setSortBy(val);
                setPage(1);
              }}
              className={`flex-1 rounded-full border py-1.5 text-xs font-medium transition-colors ${
                sortBy === val
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {val === "next" ? "Soonest" : "Top rated"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <BookingWizard
        open={Boolean(bookingDoctor)}
        onClose={() => setBookingDoctor(null)}
        doctor={
          bookingDoctor
            ? {
                id: bookingDoctor.id,
                fullName: bookingDoctor.user.fullName,
                specialization: bookingDoctor.specialization,
                priceCents: bookingDoctor.priceCents,
              }
            : null
        }
      />

      <main className="mx-auto flex w-full max-w-container-max flex-col gap-8 px-margin py-10 md:flex-row">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-24 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
            <FilterPanel />
          </div>
        </aside>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-brand-ink/40"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-surface-container-lowest p-5 shadow-xl">
              <FilterPanel />
            </div>
          </div>
        )}

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
                Demo veterinarians
              </p>
              <h1 className="font-display text-2xl font-bold leading-tight text-on-surface">
                {selectedSpecs.length === 1
                  ? `${selectedSpecs[0]} veterinarians`
                  : "Find a veterinarian"}
              </h1>
              <p className="mt-0.5 text-sm text-on-surface-variant">
                {loading
                  ? "Loading…"
                  : fetchError
                    ? "Could not load veterinarians"
                    : total === 0
                      ? "No veterinarians found"
                      : totalPages > 1
                        ? `Showing ${rangeStart}–${rangeEnd} of ${total}`
                        : `${total} veterinarian${total !== 1 ? "s" : ""} available`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 rounded-full border border-outline-variant px-3 py-2 text-sm text-on-surface transition hover:bg-surface-container md:hidden"
              >
                <SlidersHorizontal size={14} /> Filters
              </button>
              <div className="relative flex-1 sm:w-56 sm:flex-none">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vets, specialty, city…"
                  className="w-full rounded-full border border-outline-variant bg-surface-container-lowest py-2 pl-8 pr-8 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {hasFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedSpecs.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {s}
                  <button onClick={() => toggleSpec(s)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              {availableOnly && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Available now
                  <button onClick={() => setAvailableOnly(false)}>
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex flex-1 items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : fetchError ? (
            <EmptyState
              icon={<Search size={24} />}
              title="Unable to load veterinarians"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={fetchDoctors}
            />
          ) : doctors.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {doctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doc={doc}
                  onBook={setBookingDoctor}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Search size={24} />}
              title="No veterinarians found"
              description="Try adjusting your filters or search for a different specialty."
              actionLabel="Clear filters"
              onAction={clearAll}
            />
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from(
                { length: Math.min(totalPages, 7) },
                (_, i) => i + 1,
              ).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    page === n
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      }
    >
      <DoctorsPageContent />
    </Suspense>
  );
}
