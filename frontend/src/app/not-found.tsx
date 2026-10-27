import Link from "next/link";
import "./[locale]/globals.css";

// Catches URLs outside the [locale] segment (e.g. a missing /uploads file).
// The root layout only passes children through, so this page renders its own <html>/<body>.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-golden-deep">404</p>
          <h1 className="text-2xl font-bold text-slate-900">Page or file not found</h1>
          <p className="max-w-md text-slate-600">
            The page or file you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90"
          >
            Go to the home page
          </Link>
        </main>
      </body>
    </html>
  );
}
