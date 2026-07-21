export default function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-800/40 bg-amber-950/30 p-6 text-amber-200">
      <h2 className="mb-2 text-lg font-semibold">Falta configurar Supabase</h2>
      <p className="mb-3 text-sm leading-relaxed text-amber-100/80">
        Copia <code className="rounded bg-black/30 px-1">.env.example</code> a{" "}
        <code className="rounded bg-black/30 px-1">.env.local</code>, crea un
        proyecto gratuito en{" "}
        <a
          className="underline"
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
        >
          supabase.com
        </a>
        , rellena las claves, ejecuta la migración de{" "}
        <code className="rounded bg-black/30 px-1">
          supabase/migrations/0001_init.sql
        </code>{" "}
        en el SQL editor y corre <code className="rounded bg-black/30 px-1">npm run db:seed</code>.
        Detalles completos en el README.
      </p>
    </div>
  );
}
