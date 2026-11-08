import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/States";
import { btn } from "../components/ui/styles";

export default function NotFound() {
    return (
        <EmptyState
            title="Page not found"
            message="The page you're looking for doesn't exist."
            action={
                <Link to="/" className={`${btn.secondary} mt-2`}>
                    Back to dashboard
                </Link>
            }
        />
    );
}
