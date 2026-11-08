// One place for the json-server address. Set VITE_API_URL in a .env file locally,
// or in the hosting provider's environment variables (e.g. the Render URL on Vercel).
// Trailing slashes are trimmed so "https://x.onrender.com/" works too.
export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

export const ENDPOINTS = {
    settings: `${API_URL}/settings`,
    services: `${API_URL}/services`,
    team: `${API_URL}/team`,
    clients: `${API_URL}/clients`,
    projects: `${API_URL}/projects`,
    invoices: `${API_URL}/invoices`,
    expenses: `${API_URL}/expenses`,
};

async function request(url, { method = "GET", body, signal } = {}) {
    let response;
    try {
        response = await fetch(url, {
            method,
            signal,
            headers: { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (e) {
        if (e.name === "AbortError") throw e;
        // fetch only rejects when the server can't be reached at all.
        // The json-server hint only makes sense while developing locally.
        const message = import.meta.env.DEV
            ? `Can't reach the API at ${API_URL}. Is json-server running? (npm run server)`
            : "Couldn't reach the API.";
        throw new Error(message, { cause: e });
    }
    if (!response.ok) {
        throw new Error(`Request failed: ${method} ${url} (${response.status})`);
    }
    return response.status === 204 ? null : response.json();
}

export const api = {
    get: (url, options) => request(url, options),
    post: (url, body) => request(url, { method: "POST", body }),
    put: (url, body) => request(url, { method: "PUT", body }),
    patch: (url, body) => request(url, { method: "PATCH", body }),
    remove: (url) => request(url, { method: "DELETE" }),
};
