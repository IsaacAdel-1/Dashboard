import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { btn } from "./styles";

// A centered dialog. Closes on Escape or a click on the backdrop.
export default function Modal({ title, description, onClose, children, footer, width = 460 }) {
    const panelRef = useRef(null);
    // Keep the latest onClose in a ref so the effect below runs only once.
    // (If it depended on onClose, an inline arrow from the parent would re-run it
    // on every render and steal focus back to the first field while typing.)
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onCloseRef.current();
        document.addEventListener("keydown", onKey);
        // focus the first field so you can start typing right away
        panelRef.current?.querySelector("input, select, textarea")?.focus();
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--overlay)] px-4 py-[10vh]"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="w-full rounded-xl border border-line bg-surface shadow-xl"
                style={{ maxWidth: width }}
            >
                <header className="flex items-start justify-between gap-4 px-5 pt-5">
                    <div>
                        <h2 id="modal-title" className="text-base font-semibold text-ink">
                            {title}
                        </h2>
                        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                    </div>
                    <button type="button" className={btn.icon} onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                </header>
                <div className="px-5 py-4">{children}</div>
                {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
            </div>
        </div>
    );
}
