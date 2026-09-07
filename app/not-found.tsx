import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-6 text-center text-inkText">
      <div>
        <p className="font-mono text-sm text-teal">404</p>
        <h1 className="mt-3 text-4xl font-extrabold">Page not found</h1>
        <p className="mt-3 text-muted">
          The route you requested does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-teal px-4 py-2 text-sm font-bold text-navy"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
