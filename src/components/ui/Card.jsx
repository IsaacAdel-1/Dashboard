export default function Card({ title, subtitle, actions, children, className = "", bodyClassName = "" }) {
    return (
        <section className={`flex min-w-0 flex-col rounded-xl border border-line bg-surface shadow-[var(--shadow)] ${className}`}>
            {(title || actions) && (
                <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-1">
                    <div className="min-w-0">
                        {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
                        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
                </header>
            )}
            <div className={`min-h-0 flex-1 px-5 pt-3 pb-5 ${bodyClassName}`}>{children}</div>
        </section>
    );
}
