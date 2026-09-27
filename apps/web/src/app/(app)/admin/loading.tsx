export default function Loading() {
  return (
    <main
      className="mx-auto min-h-screen max-w-6xl px-6 py-32"
      aria-busy="true"
    >
      <p role="status" className="text-muted-foreground">
        Loading portfolio…
      </p>
      <div className="mt-8 h-48 rounded-xl bg-muted/30 motion-safe:animate-pulse" />
    </main>
  );
}
