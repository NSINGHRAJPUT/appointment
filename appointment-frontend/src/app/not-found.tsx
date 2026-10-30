import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-margin py-16">
      <div className="max-w-md w-full premium-card text-center space-y-4">
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="text-2xl font-bold text-on-surface">Page not found</h1>
        <p className="text-on-surface-variant text-sm">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/" className="btn-primary px-6 py-2.5">
            Go home
          </Link>
          <Link href="/doctors" className="btn-secondary px-6 py-2.5">
            Find a vet
          </Link>
        </div>
      </div>
    </main>
  );
}
