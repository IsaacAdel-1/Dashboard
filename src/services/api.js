// Local data layer: the app reads the mock data straight from a JSON file
// instead of calling a server. It keeps the same shape a REST client would
// (api.get / post / put / patch / remove + ENDPOINTS), so hooks and components
// don't need to know the difference.
//
// - Reads and writes wait a moment so loading states still show.
// - Changes live in memory only: reloading the page brings the original data back.
// - Values are copied on the way in and out, so components can't change the
//   store by accident (same as getting fresh JSON from a server).
import seed from "../data/company_database_sample.json";

export const ENDPOINTS = {
    settings: "/settings",
    services: "/services",
    team: "/team",
    clients: "/clients",
    projects: "/projects",
    invoices: "/invoices",
    expenses: "/expenses",
};

const READ_DELAY_MS = 400;
const WRITE_DELAY_MS = 200;

const db = structuredClone(seed);
const copy = (value) => structuredClone(value);

// Waits `ms`, or stops early with an AbortError if the caller cancels
// (useFetch aborts when a component unmounts).
function wait(ms, signal) {
    return new Promise((resolve, reject) => {
        const abortError = () => new DOMException("The operation was aborted.", "AbortError");
        if (signal?.aborted) return reject(abortError());
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener(
            "abort",
            () => {
                clearTimeout(timer);
                reject(abortError());
            },
            { once: true }
        );
    });
}

// "/projects/prj_0001" -> { name: "projects", id: "prj_0001" }
function parse(path) {
    const [name, id] = path.replace(/^\/+/, "").split("/");
    if (!(name in db) || name === "$schema") throw new Error(`Unknown resource: ${name}`);
    return { name, id };
}

function findIndex(name, id, path) {
    const items = db[name];
    if (!Array.isArray(items)) throw new Error(`${name} is not a list`);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`Not found: ${path}`);
    return index;
}

const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);

async function get(path, { signal } = {}) {
    await wait(READ_DELAY_MS, signal);
    const { name, id } = parse(path);
    if (id === undefined) return copy(db[name]);
    return copy(db[name][findIndex(name, id, path)]);
}

async function post(path, body) {
    await wait(WRITE_DELAY_MS);
    const { name } = parse(path);
    if (!Array.isArray(db[name])) throw new Error(`${name} is not a list`);
    const item = { ...copy(body), id: newId() };
    db[name].push(item);
    return copy(item);
}

// PUT replaces the whole record, PATCH merges into it.
async function update(path, body, merge) {
    await wait(WRITE_DELAY_MS);
    const { name, id } = parse(path);
    if (id === undefined) {
        // single-object resources like /settings
        db[name] = merge ? { ...db[name], ...copy(body) } : copy(body);
        return copy(db[name]);
    }
    const index = findIndex(name, id, path);
    db[name][index] = merge ? { ...db[name][index], ...copy(body), id } : { ...copy(body), id };
    return copy(db[name][index]);
}

async function remove(path) {
    await wait(WRITE_DELAY_MS);
    const { name, id } = parse(path);
    const [removed] = db[name].splice(findIndex(name, id, path), 1);
    return copy(removed);
}

export const api = {
    get,
    post,
    put: (path, body) => update(path, body, false),
    patch: (path, body) => update(path, body, true),
    remove,
};
