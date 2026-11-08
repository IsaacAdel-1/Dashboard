import "./ClientCard.css";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { formatDate, getInitials } from "../../utils/dataHelpers";
import { Avatar } from "../ui/Controls";
import StatusBadge from "../ui/StatusBadge";
import { CLIENT_STATUS_COLORS } from "./clientStats";

const ClientCard = ({ client }) => {
    const { money } = useApp();

    return (
        <Link
            to={`/clients/${client.id}`}
            className="client-card flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow)] transition-colors hover:border-line-strong hover:bg-hover"
        >
            <div className="flex items-start gap-3">
                <Avatar initials={getInitials(client.name)} size={44} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-semibold text-ink">{client.name}</p>
                        <StatusBadge label={client.status} color={CLIENT_STATUS_COLORS[client.status]} />
                    </div>
                    <p className="truncate text-sm text-muted">{client.email}</p>
                    {client.city && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                            <MapPin size={12} aria-hidden="true" /> {client.city}
                        </p>
                    )}
                </div>
            </div>

            <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-sm">
                <div className="min-w-0">
                    <dt className="text-xs text-muted">Projects</dt>
                    <dd className="tabular font-semibold text-ink">{client.projects}</dd>
                </div>
                <div className="min-w-0">
                    <dt className="text-xs text-muted">Revenue</dt>
                    <dd className="tabular truncate font-semibold text-ink">{money(client.revenue, { compact: client.revenue >= 100000 })}</dd>
                </div>
                <div className="min-w-0">
                    <dt className="text-xs text-muted">Last project</dt>
                    <dd className="tabular truncate text-ink-2">{client.lastProjectDate ? formatDate(client.lastProjectDate) : "—"}</dd>
                </div>
            </dl>
            {client.overdue > 0 && (
                <p className="-mt-2 text-xs font-medium text-critical-ink">{money(client.overdue)} overdue</p>
            )}
        </Link>
    );
};

export default ClientCard;
