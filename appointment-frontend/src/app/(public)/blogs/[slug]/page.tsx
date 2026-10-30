"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { blogService, type Blog } from "@/services/blog.service";
import PageCtaStrip from "@/components/public/PageCtaStrip";

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    blogService
      .getBySlug(slug)
      .then(setBlog)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const sanitizedContent = useMemo(
    () =>
      DOMPurify.sanitize(blog?.content ?? "", {
        USE_PROFILES: { html: true },
      }),
    [blog?.content],
  );

  if (loading) {
    return (
      <main className="grow py-24 px-margin max-w-container-max mx-auto w-full flex justify-center items-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (notFound || !blog) {
    return (
      <main className="grow py-24 px-margin max-w-container-max mx-auto w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface-variant mb-2">
          <BookOpen size={24} />
        </div>
        <p className="font-bold text-2xl text-on-surface">Article not found</p>
        <p className="text-on-surface-variant text-sm mb-2">
          This story may have been moved or unpublished.
        </p>
        <Link
          href="/blogs"
          className="text-primary font-semibold flex items-center gap-1.5 hover:gap-2 transition-all"
        >
          <ArrowLeft size={14} /> Back to blog
        </Link>
      </main>
    );
  }

  return (
    <>
      <main className="grow pb-16">
        <section className="bg-surface-container-low border-b border-outline-variant">
          <div className="max-w-3xl mx-auto px-margin py-10 md:py-14">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary text-sm font-medium mb-6 transition-colors"
            >
              <ArrowLeft size={14} /> Back to blog
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-primary-container text-primary text-xs font-semibold uppercase tracking-wider rounded-full">
                {blog.category}
              </span>
              <span className="text-on-surface-variant text-sm">
                {blog.readMins} min read
              </span>
              {blog.publishedAt && (
                <>
                  <span className="text-on-surface-variant">·</span>
                  <span className="text-on-surface-variant text-sm">
                    {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>

            <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl text-on-surface mb-4 text-balance leading-tight">
              {blog.title}
            </h1>
            <p className="text-sm font-medium text-on-surface-variant">By {blog.author}</p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-margin pt-10">
          {blog.coverImage && (
            <div className="w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-10 border border-outline-variant shadow-sm">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <article
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </main>

      <PageCtaStrip
        title="Need care for your pet?"
        description="Browse verified veterinarians and book an online or in-clinic visit in minutes."
      />
    </>
  );
}
