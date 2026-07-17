export function SetupNotice() {
  return (
    <div className="mx-4 mt-6 rounded-2xl border border-butter-dark bg-butter p-5">
      <h2 className="text-lg">One-time setup needed</h2>
      <p className="mt-2 text-sm text-latte">
        The database isn&apos;t connected yet. Create a free Postgres database
        on Neon or Supabase, then copy <code>.env.example</code> to{" "}
        <code>.env.local</code> and paste the connection string as{" "}
        <code>DATABASE_URL</code>. Finally run{" "}
        <code>npx drizzle-kit push</code> to create the tables.
      </p>
    </div>
  );
}
