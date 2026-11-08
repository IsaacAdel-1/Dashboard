import { useState } from "react";
import { api, ENDPOINTS } from "../../services/api";
import { getInitials, todayISO } from "../../utils/dataHelpers";
import { Avatar, Field } from "../ui/Controls";
import Modal from "../ui/Modal";
import { btn, inputClass } from "../ui/styles";

const EMPTY = { name: "", contact: "", email: "", phone: "", city: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Modal form to add a client.
 * onCreated(client) is called with the saved client (the data layer adds the id).
 */
const NewClientForm = ({ existingNames = [], onClose, onCreated }) => {
    const [values, setValues] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState("");

    const handleChange = (e) => {
        setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    };

    const validate = () => {
        const next = {};
        const name = values.name.trim();
        if (!name) next.name = "Client name is required.";
        else if (existingNames.some((n) => n.toLowerCase() === name.toLowerCase())) next.name = "A client with this name already exists.";
        if (!values.email.trim()) next.email = "Email is required.";
        else if (!EMAIL_PATTERN.test(values.email.trim())) next.email = "That doesn't look like an email address.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        // without this the browser reloads the page when the form is submitted
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        setServerError("");
        try {
            const client = {
                name: values.name.trim(),
                contact: values.contact.trim(),
                email: values.email.trim().toLowerCase(),
                phone: values.phone.trim(),
                city: values.city.trim(),
                joinDate: todayISO(),
            };
            // the body has to be a JSON string, not a JS object
            const created = await api.post(ENDPOINTS.clients, client);
            onCreated(created);
        } catch (err) {
            setServerError(err.message);
            setSaving(false);
        }
    };

    const field = (name, label, props = {}) => (
        <Field label={label} htmlFor={`client-${name}`} error={errors[name]}>
            <input
                id={`client-${name}`}
                name={name}
                value={values[name]}
                onChange={handleChange}
                className={`${inputClass} ${errors[name] ? "!border-[var(--critical)]" : ""}`}
                aria-invalid={Boolean(errors[name])}
                {...props}
            />
        </Field>
    );

    return (
        <Modal
            title="New client"
            description="Add a real-estate agency or individual you work with."
            onClose={onClose}
            footer={
                <>
                    <button type="button" className={btn.secondary} onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" form="new-client-form" className={btn.primary} disabled={saving}>
                        {saving ? "Saving…" : "Add client"}
                    </button>
                </>
            }
        >
            <form id="new-client-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                {field("name", "Client name", { placeholder: "e.g. Nile View Realty", autoComplete: "organization" })}
                <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                    {field("contact", "Contact person", { placeholder: "Full name", autoComplete: "name" })}
                    {field("email", "Email", { type: "email", placeholder: "name@company.com", autoComplete: "email" })}
                    {field("phone", "Phone", { type: "tel", placeholder: "+20 100 000 0000", autoComplete: "tel" })}
                    {field("city", "City", { placeholder: "Cairo" })}
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
                    <Avatar initials={getInitials(values.name || "?")} size={36} />
                    <p className="text-sm text-muted">Avatar initials are generated from the name.</p>
                </div>
                {serverError && <p className="text-sm text-critical-ink">{serverError}</p>}
            </form>
        </Modal>
    );
};

export default NewClientForm;
