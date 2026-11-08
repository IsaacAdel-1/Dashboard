import { useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import Card from "../components/ui/Card";
import { Field } from "../components/ui/Controls";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/States";
import { btn, cellInputClass, inputClass, tdClass, thClass } from "../components/ui/styles";
import { useApp } from "../contexts/AppContext";
import useFetch from "../hooks/useFetch";
import { api, ENDPOINTS } from "../services/api";
import { CURRENCIES } from "../utils/constants";

const THEME_OPTIONS = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
];

function SaveStatus({ status }) {
    if (status === "saved")
        return (
            <span className="inline-flex items-center gap-1 text-sm text-good-ink" role="status">
                <Check size={15} /> Saved
            </span>
        );
    if (status?.startsWith("error:")) return <span className="text-sm text-critical-ink">{status.slice(6)}</span>;
    return null;
}

// The form keeps its own copy of the settings while you type.
// It's mounted with a `key`, so it starts fresh once the real settings arrive.
function StudioSettingsForm({ initial, onSave }) {
    const [values, setValues] = useState(initial);
    const [status, setStatus] = useState("");

    const set = (name) => (e) => {
        setValues((prev) => ({ ...prev, [name]: e.target.value }));
        setStatus("");
    };

    const submit = async (e) => {
        e.preventDefault();
        setStatus("saving");
        try {
            await onSave({
                ...values,
                studioName: values.studioName.trim() || initial.studioName,
                ownerName: values.ownerName.trim() || initial.ownerName,
                taxRate: Number(values.taxRate) || 0,
                invoiceDueDays: Number(values.invoiceDueDays) || 14,
                monthlyRevenueGoal: Number(values.monthlyRevenueGoal) || 0,
            });
            setStatus("saved");
        } catch (err) {
            setStatus(`error:${err.message}`);
        }
    };

    const input = (name, label, { hint, ...props } = {}) => (
        <Field label={label} htmlFor={`settings-${name}`} hint={hint}>
            <input id={`settings-${name}`} className={inputClass} value={values[name] ?? ""} onChange={set(name)} {...props} />
        </Field>
    );

    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            <Card title="Studio profile" subtitle="Shown in the top bar and on the dashboard.">
                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    {input("studioName", "Studio name", { required: true })}
                    {input("ownerName", "Your name", { required: true, hint: "Used for the avatar initials." })}
                    {input("email", "Email", { type: "email" })}
                    {input("phone", "Phone", { type: "tel" })}
                    <div className="col-span-2 max-md:col-span-1">{input("address", "Address")}</div>
                </div>
            </Card>

            <Card title="Billing" subtitle="Used when you create a new invoice.">
                <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
                    <Field label="Currency" htmlFor="settings-currency">
                        <select id="settings-currency" className={inputClass} value={values.currency} onChange={set("currency")}>
                            {CURRENCIES.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </Field>
                    {input("taxRate", "Tax rate (%)", { type: "number", min: 0, max: 100, step: 0.5 })}
                    {input("invoiceDueDays", "Payment terms (days)", { type: "number", min: 1, max: 120 })}
                    {input("monthlyRevenueGoal", "Monthly revenue goal", { type: "number", min: 0, step: 500 })}
                </div>
            </Card>

            <div className="flex items-center justify-end gap-3">
                <SaveStatus status={status} />
                <button type="submit" className={btn.primary} disabled={status === "saving"}>
                    {status === "saving" ? "Saving…" : "Save settings"}
                </button>
            </div>
        </form>
    );
}

function ServicesPricing() {
    const { settings } = useApp();
    const { response: services, setResponse, loading, error, refetch } = useFetch({ url: ENDPOINTS.services });
    const [edits, setEdits] = useState({});
    const [status, setStatus] = useState("");

    const change = (id, field, value) => {
        setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
        setStatus("");
    };

    const changedIds = Object.keys(edits);

    const save = async () => {
        setStatus("saving");
        try {
            const saved = await Promise.all(
                changedIds.map((id) => {
                    const body = Object.fromEntries(Object.entries(edits[id]).map(([k, v]) => [k, Number(v) || 0]));
                    return api.patch(`${ENDPOINTS.services}/${id}`, body);
                })
            );
            setResponse((prev) => prev.map((s) => saved.find((x) => x.id === s.id) ?? s));
            setEdits({});
            setStatus("saved");
        } catch (err) {
            setStatus(`error:${err.message}`);
        }
    };

    if (error) return <ErrorState message={error} onRetry={refetch} />;

    return (
        <Card
            title="Services & pricing"
            subtitle="Base prices fill in the amount when you add a new project."
            bodyClassName="!px-0 !pb-0"
            actions={
                <>
                    <SaveStatus status={status} />
                    <button type="button" className={btn.secondary} onClick={() => setEdits({})} disabled={changedIds.length === 0}>
                        Reset
                    </button>
                    <button type="button" className={btn.primary} onClick={save} disabled={changedIds.length === 0 || status === "saving"}>
                        Save prices
                    </button>
                </>
            }
        >
            {loading && services.length === 0 ? (
                <LoadingState />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse">
                        <thead>
                            <tr className="border-y border-line bg-surface-2">
                                <th className={thClass}>Service</th>
                                <th className={thClass}>Base price ({settings.currency})</th>
                                <th className={thClass}>Turnaround (days)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((s) => (
                                <tr key={s.id} className={`border-b border-line last:border-0 ${edits[s.id] ? "bg-accent-soft/40" : ""}`}>
                                    <td className={`${tdClass} font-medium`}>{s.name}</td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="10"
                                            className={`${cellInputClass} max-w-[140px]`}
                                            value={edits[s.id]?.basePrice ?? s.basePrice}
                                            onChange={(e) => change(s.id, "basePrice", e.target.value)}
                                            aria-label={`${s.name} base price`}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            min="1"
                                            className={`${cellInputClass} max-w-[100px]`}
                                            value={edits[s.id]?.turnaroundDays ?? s.turnaroundDays}
                                            onChange={(e) => change(s.id, "turnaroundDays", e.target.value)}
                                            aria-label={`${s.name} turnaround days`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}

export default function Settings() {
    const { settings, settingsLoading, settingsError, saveSettings, theme, setTheme } = useApp();

    return (
        <div className="flex max-w-[1000px] flex-col gap-4">
            <PageHeader title="Settings" description="Studio details, billing defaults, pricing and appearance." />

            {settingsError ? (
                <ErrorState message={settingsError} />
            ) : settingsLoading ? (
                <LoadingState label="Loading settings…" />
            ) : (
                <StudioSettingsForm key="loaded" initial={settings} onSave={saveSettings} />
            )}

            <ServicesPricing />

            <Card title="Appearance" subtitle="Saved in this browser.">
                <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Theme">
                    {THEME_OPTIONS.map((option) => {
                        const active = theme === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => setTheme(option.value)}
                                className={`flex w-[150px] items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                                    active ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-2 hover:bg-hover"
                                }`}
                            >
                                <option.icon size={16} /> {option.label}
                                {active && <Check size={15} className="ml-auto" />}
                            </button>
                        );
                    })}
                </div>
            </Card>

            <Card title="Demo data" subtitle="Everything in this dashboard is mock data loaded from a local JSON file.">
                <ul className="flex flex-col gap-2 text-sm text-ink-2">
                    <li>Changes are kept in memory and reset when you reload the page.</li>
                    <li>
                        Regenerate the sample data (dated up to today):{" "}
                        <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">npm run seed</code>
                    </li>
                </ul>
            </Card>
        </div>
    );
}
