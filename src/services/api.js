// One place for the json-server address. Override it with VITE_API_URL in a .env file.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

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
        // fetch only rejects when the server can't be reached at all
        throw new Error(`Can't reach the API at ${API_URL}. Is json-server running? (npm run server)`, { cause: e });
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
