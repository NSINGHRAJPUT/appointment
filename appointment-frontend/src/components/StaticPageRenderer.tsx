"use client";

import { useEffect, useState } from "react";
import { staticPageService } from "@/services/static-page.service";

interface Props {
  slug: string;
  fallback: React.ReactNode;
}

export function StaticPageRenderer({ slug, fallback }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staticPageService.getBySlug(slug).then((page) => {
      if (page) {
        setTitle(page.title);
        setContent(page.content);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!content) return <>{fallback}</>;

  return (
    <main className="grow pt-24 pb-10 px-margin max-w-3xl mx-auto w-full">
      {title && <h1 className="font-display text-display text-on-surface mb-6">{title}</h1>}
      <article
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </main>
  );
}
