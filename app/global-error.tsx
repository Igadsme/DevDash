"use client";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
          <div>
            <h1 className="text-3xl font-extrabold">
              DevDash hit a recoverable error
            </h1>
            <p className="mt-3 text-slate-400">
              No provider credentials or response bodies were exposed.
            </p>
            <button
              onClick={reset}
              className="mt-6 rounded-md bg-cyan-400 px-4 py-2 font-bold text-slate-950"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
