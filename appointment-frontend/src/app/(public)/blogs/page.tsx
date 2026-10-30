"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { blogService, type Blog } from "@/services/blog.service";
import Link from "next/link";
import PublicPageHero from "@/components/public/PublicPageHero";
import PageCtaStrip from "@/components/public/PageCtaStrip";

const CATEGORIES = ["All Articles", "Health Tips", "Doctor Interviews", "Technology", "Research"];
const PAGE_SIZE = 9;

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    blogService
      .list(page, PAGE_SIZE, category || undefined)
      .then((res) => {
        setBlogs(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [page, category]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const featured = blogs[0];
  const grid = blogs.slice(1);

  function handleCategory(cat: string) {
    setCategory(cat === "All Articles" ? "" : cat);
    setPage(1);
  }

  return (
    <>
      <PublicPageHero
        badge="Pet care journal"
        title="Tips, stories, and vet insights"
        description="Practical guidance from PawCare veterinarians and pet health experts — training, nutrition, telehealth, and more."
        primaryCta={{ href: "/doctors", label: "Find a vet" }}
        secondaryCta={{ href: "/faq", label: "Browse FAQ" }}
      />

      <main className="grow py-14 md:py-20 px-margin max-w-container-max mx-auto w-full">
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => {
            const active = cat === "All Articles" ? category === "" : category === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  active
                    ? "bg-primary text-on-primary border-transparent"
                    : "bg-white text-on-surface hover:bg-surface-container-low border-outline-variant"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-outline-variant bg-white px-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
              <BookOpen size={24} />
            </div>
            <h2 className="font-bold text-xl text-on-surface mb-2">No articles found</h2>
            <p className="text-on-surface-variant mb-6">
              Try another category, or check back soon for new pet care stories.
            </p>
            <button
              type="button"
              onClick={() => handleCategory("All Articles")}
              className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90"
            >
              View all articles
            </button>
          </div>
        ) : (
          <>
            {featured && (
              <div className="mb-12">
                <Link href={`/blogs/${featured.slug}`}>
                  <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-md flex flex-col md:flex-row">
                    <div className="md:w-1/2 relative h-64 md:h-auto min-h-[16rem] overflow-hidden">
                      {featured.coverImage ? (
                        <img
                          src={featured.coverImage}
                          alt={featured.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high" />
                      )}
                    </div>
                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2.5 py-1 bg-primary-container text-primary text-xs font-semibold uppercase tracking-wider rounded-full">
                          {featured.category}
                        </span>
                        <span className="text-on-surface-variant text-sm">
                          {featured.readMins} min read
                        </span>
                      </div>
                      <h2 className="font-bold text-2xl md:text-3xl text-on-surface mb-3 group-hover:text-primary transition-colors text-balance">
                        {featured.title}
                      </h2>
                      <p className="text-on-surface-variant mb-6 leading-relaxed">
                        {featured.excerpt}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-sm font-medium text-on-surface">
                          By {featured.author}
                        </span>
                        <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read article <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grid.map((blog) => (
                <Link key={blog.id} href={`/blogs/${blog.slug}`}>
                  <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-md flex flex-col h-full">
                    <div className="relative h-48 overflow-hidden">
                      {blog.coverImage ? (
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high" />
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-2.5 py-1 bg-white/95 text-primary text-xs font-semibold uppercase tracking-wider rounded-full">
                          {blog.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col grow">
                      <div className="flex items-center gap-2 mb-3 text-on-surface-variant text-sm">
                        <span>
                          {blog.publishedAt
                            ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })
                            : "—"}
                        </span>
                        <span>•</span>
                        <span>{blog.readMins} min read</span>
                      </div>
                      <h3 className="font-bold text-lg text-on-surface mb-2 group-hover:text-primary transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-on-surface-variant mb-6 grow leading-relaxed">
                        {blog.excerpt}
                      </p>
                      <div className="mt-auto pt-4 border-t border-outline-variant flex items-center justify-between">
                        <span className="text-sm font-medium text-on-surface">
                          By {blog.author}
                        </span>
                        <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  <ArrowLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                      page === p
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <PageCtaStrip
        title="Ready to put advice into action?"
        description="Book a verified veterinarian online or in-clinic when your pet needs care."
      />
    </>
  );
}
