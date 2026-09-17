export type TocItem = { id: string; label: string };

export default function LegalPageLayout({
  title,
  updated,
  toc,
  children,
}: {
  title: string;
  updated: string;
  toc?: TocItem[];
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white px-4 py-16 sm:py-20">
      <div
        className={
          toc
            ? "mx-auto grid max-w-6xl gap-10 lg:grid-cols-[220px_1fr]"
            : "mx-auto max-w-3xl"
        }
      >
        {toc && (
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-xs font-bold uppercase tracking-wide text-body">
                En esta página
              </p>
              <nav className="mt-4 flex flex-col gap-3 border-l border-ink/10 pl-4 text-sm">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="text-body transition-colors hover:text-ink"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        <div>
          <h1 className="balance text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-body">
            Última actualización: {updated}
          </p>

          <div className="prose-legal mt-10 flex flex-col gap-8">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
