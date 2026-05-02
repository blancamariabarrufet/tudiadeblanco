interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function ModuleHeader({ title, subtitle, actions }: ModuleHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1
          className="mb-1 text-2xl leading-tight sm:text-3xl"
          style={{ fontFamily: "var(--font-newsreader)", color: "var(--on-surface)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm"
            style={{
              fontFamily: "var(--font-work-sans)",
              color: "var(--on-surface)",
              opacity: 0.6,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex w-full items-center gap-3 sm:w-auto">{actions}</div>}
    </div>
  );
}
