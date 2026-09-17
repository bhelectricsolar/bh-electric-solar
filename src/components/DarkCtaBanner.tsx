import Link from "next/link";

export default function DarkCtaBanner({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl bg-navy-900 p-8 text-center sm:flex-row sm:items-center sm:justify-between sm:p-10 sm:text-left">
      <div>
        <p className="balance mx-auto max-w-xl text-xl font-bold leading-snug text-white sm:mx-0 sm:text-2xl">
          {title}
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/60 sm:mx-0">{subtitle}</p>
      </div>
      <Link
        href={ctaHref}
        className="w-full shrink-0 rounded-lg bg-gold-500 px-6 py-3.5 text-center text-sm font-semibold text-navy-950 transition-transform hover:scale-[1.03] sm:w-auto"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
