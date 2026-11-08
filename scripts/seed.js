// Generates realistic mock data for the dashboard and writes it to the json-server database.
//
//   npm run seed                       -> data ends today
//   npm run seed -- --today=2026-11-08 -> data ends on a fixed date
//
// The output is deterministic for a given "today" (seeded random), so re-running it
// resets the database to a clean state after you've been editing records in the UI.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "company_database_sample.json");

const todayArg = process.argv.find((a) => a.startsWith("--today="));
const TODAY = todayArg ? new Date(`${todayArg.split("=")[1]}T00:00:00Z`) : startOfDayUTC(new Date());
const MONTHS_OF_HISTORY = 24;

// ---------- helpers ----------
function startOfDayUTC(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rand = mulberry32(20260508);
const between = (min, max) => min + rand() * (max - min);
const int = (min, max) => Math.floor(between(min, max + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const weightedPick = (items, weightOf) => {
    const total = items.reduce((s, it) => s + weightOf(it), 0);
    let r = rand() * total;
    for (const it of items) {
        r -= weightOf(it);
        if (r <= 0) return it;
    }
    return items[items.length - 1];
};
const DAY = 24 * 60 * 60 * 1000;
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const iso = (d) => d.toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((b - a) / DAY);
const roundTo = (n, step) => Math.round(n / step) * step;
const pad = (n, len) => String(n).padStart(len, "0");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

// ---------- static collections ----------
const settings = {
    studioName: "Avaris Studio",
    ownerName: "Samy Adel",
    email: "hello@avaris.studio",
    phone: "+20 100 555 0182",
    address: "26 Road 9, Maadi, Cairo",
    currency: "USD",
    taxRate: 14,
    invoiceDueDays: 14,
    monthlyRevenueGoal: 12000,
};

const services = [
    { id: "svc_01", name: "Photo Editing", basePrice: 180, turnaroundDays: 2, weight: 26 },
    { id: "svc_02", name: "Virtual Staging", basePrice: 260, turnaroundDays: 3, weight: 12 },
    { id: "svc_03", name: "Listing Reel", basePrice: 420, turnaroundDays: 4, weight: 22 },
    { id: "svc_04", name: "Drone Edit", basePrice: 520, turnaroundDays: 5, weight: 16 },
    { id: "svc_05", name: "Property Tour", basePrice: 780, turnaroundDays: 7, weight: 15 },
    { id: "svc_06", name: "Branding Video", basePrice: 1250, turnaroundDays: 12, weight: 9 },
];

const team = [
    { id: "tm_01", name: "Tarek Mansour", role: "Lead Video Editor", skills: ["Property Tour", "Branding Video", "Listing Reel"], joinDate: "2021-03-15", status: "Active" },
    { id: "tm_02", name: "Yasmine Ali", role: "Senior Editor", skills: ["Listing Reel", "Property Tour", "Branding Video"], joinDate: "2022-06-01", status: "Active" },
    { id: "tm_03", name: "Ahmed Samy", role: "Drone Pilot & Editor", skills: ["Drone Edit", "Property Tour"], joinDate: "2023-01-10", status: "Active" },
    { id: "tm_04", name: "Nour Kamil", role: "Photo Retoucher", skills: ["Photo Editing", "Virtual Staging"], joinDate: "2022-01-20", status: "Active" },
    { id: "tm_05", name: "Omar Hegazi", role: "Colorist", skills: ["Branding Video", "Drone Edit", "Listing Reel"], joinDate: "2023-09-04", status: "Active" },
    { id: "tm_06", name: "Salma Nabil", role: "Motion Designer", skills: ["Branding Video", "Listing Reel"], joinDate: "2024-02-12", status: "On Leave" },
    { id: "tm_07", name: "Karim Fathy", role: "Junior Editor", skills: ["Photo Editing", "Listing Reel", "Virtual Staging"], joinDate: "2025-07-01", status: "Active" },
    { id: "tm_08", name: "Mariam Fahmy", role: "Project Manager", skills: [], joinDate: "2022-09-11", status: "Active" },
].map((m) => ({ ...m, email: `${slug(m.name.split(" ")[0])}@avaris.studio` }));

const clientSeeds = [
    ["Pacific Homes", "Alexandria", 14],
    ["Garden City Realty", "Cairo", 11],
    ["Heritage Estates", "Giza", 10],
    ["Coastal Properties", "North Coast", 9],
    ["Elite Realty", "New Cairo", 8],
    ["Sunset Realty", "Hurghada", 7],
    ["Premier Homes", "Sheikh Zayed", 6],
    ["Crown Properties", "Cairo", 5],
    ["Skyline Realty", "New Capital", 5],
    ["Bluewater Properties", "El Gouna", 4],
    ["Mountain View Realty", "6th of October", 4],
    ["Diamond Estates", "Maadi", 3],
    ["Urban Living", "Zamalek", 3],
    ["Oak Tree Homes", "Mansoura", 2],
    ["Riverside Properties", "Luxor", 2],
    ["Harbor Point Realty", "Port Said", 3],
    ["Golden Gate Homes", "Ain Sokhna", 2],
    ["Maple Leaf Estates", "Tanta", 1],
    ["Lakeside Living", "Fayoum", 1.5],
    ["Summit Property Group", "New Cairo", 4],
];
const contactFirst = ["Omar", "Sarah", "Mostafa", "Laila", "Hassan", "Dina", "Youssef", "Rana", "Khaled", "Mona", "Ali", "Hana", "Sherif", "Nada", "Amr", "Farida", "Tamer", "Reem", "Ziad", "Aya"];
const contactLast = ["Hegazi", "Fouad", "Gad", "Sabry", "Mahmoud", "Rashad", "Wahba", "Zaki", "Saleh", "Lotfy", "Hamdy", "Shawky", "Ezzat", "Nasser", "Kamal", "Badr", "Ragab", "Fawzy", "Helmy", "Morsy"];

// ---------- projects ----------
const historyStart = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth() - MONTHS_OF_HISTORY + 1, 1));
const totalDays = daysBetween(historyStart, TODAY);

// Clients join gradually; the bigger accounts joined earlier.
const clients = clientSeeds.map(([name, city, weight], i) => {
    const joinOffset = Math.floor((i / clientSeeds.length) * totalDays * 0.85) + int(0, 20);
    const first = contactFirst[i % contactFirst.length];
    const last = contactLast[(i * 7) % contactLast.length];
    return {
        id: `cl_${pad(i + 1, 3)}`,
        name,
        contact: `${first} ${last}`,
        email: `${slug(first)}@${slug(name).replace(/\./g, "")}.com`,
        phone: `+20 1${int(0, 2)}${int(0, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
        city,
        joinDate: iso(addDays(historyStart, Math.max(0, joinOffset - int(5, 30)))),
        _weight: weight,
        _joinOffset: joinOffset,
    };
});

const projects = [];
for (let dayOffset = 0; dayOffset <= totalDays; dayOffset++) {
    const date = addDays(historyStart, dayOffset);
    const weekday = date.getUTCDay(); // Fri/Sat are the Egyptian weekend
    const progress = dayOffset / totalDays; // business grows over time
    const seasonal = 1 + 0.18 * Math.sin(((date.getUTCMonth() + 2) / 12) * Math.PI * 2);
    let expected = (0.45 + 0.6 * progress) * seasonal;
    if (weekday === 5 || weekday === 6) expected *= 0.25;
    let count = Math.floor(expected) + (chance(expected % 1) ? 1 : 0);

    while (count-- > 0) {
        const eligible = clients.filter((c) => c._joinOffset <= dayOffset);
        if (eligible.length === 0) break;
        const client = weightedPick(eligible, (c) => c._weight);
        const service = weightedPick(services, (s) => s.weight);
        const editors = team.filter((m) => m.skills.includes(service.name));
        const editor = pick(editors.length ? editors : team);
        const amount = roundTo(service.basePrice * between(0.85, 1.55), 5);
        const due = addDays(date, service.turnaroundDays + int(0, 3));
        const age = daysBetween(date, TODAY);

        let status;
        if (age > 30) status = chance(0.995) ? "Completed" : "Review";
        else if (due < TODAY) status = chance(0.55) ? "Completed" : chance(0.5) ? "Review" : "In Progress";
        else if (age <= 2) status = chance(0.5) ? "Pending" : "In Progress";
        else status = pick(["Pending", "In Progress", "In Progress", "In Progress", "In Progress", "Review"]);

        projects.push({
            id: "",
            client: client.name,
            type: service.name,
            editor: editor.name,
            status,
            date: iso(date),
            dueDate: iso(due),
            amount,
        });
    }
}
projects.forEach((p, i) => (p.id = `prj_${pad(i + 1, 4)}`));

// ---------- invoices ----------
const invoices = [];
const methods = ["Bank Transfer", "Bank Transfer", "InstaPay", "Credit Card", "Cash"];
for (const p of projects) {
    if (p.status !== "Completed") continue;
    const issue = addDays(new Date(`${p.dueDate}T00:00:00Z`), int(0, 2));
    if (issue > TODAY) continue;
    // work finished in the last few days hasn't been billed yet (shows up under "New invoice")
    if (daysBetween(issue, TODAY) <= 8) continue;
    const due = addDays(issue, settings.invoiceDueDays);
    const age = daysBetween(issue, TODAY);

    let paidDate = null;
    const payDelay = int(1, 26);
    const paysLate = chance(0.08);
    if (!paysLate && age >= payDelay && chance(age > 45 ? 0.995 : 0.75)) {
        paidDate = iso(addDays(issue, payDelay));
    } else if (paysLate && age > 60) {
        paidDate = iso(addDays(issue, int(30, 55)));
    }

    const tax = Math.round(p.amount * (settings.taxRate / 100));
    invoices.push({
        id: "",
        number: "",
        projectId: p.id,
        client: p.client,
        service: p.type,
        issueDate: iso(issue),
        dueDate: iso(due),
        amount: p.amount,
        tax,
        total: p.amount + tax,
        paidDate,
        method: paidDate ? pick(methods) : null,
    });
}
invoices.sort((a, b) => a.issueDate.localeCompare(b.issueDate));
const perYearCounter = {};
invoices.forEach((inv, i) => {
    const year = inv.issueDate.slice(0, 4);
    perYearCounter[year] = (perYearCounter[year] ?? 0) + 1;
    inv.id = `inv_${pad(i + 1, 4)}`;
    inv.number = `INV-${year}-${pad(perYearCounter[year], 4)}`;
});

// ---------- expenses ----------
const expenses = [];
const monthRevenue = {};
projects.forEach((p) => {
    const key = p.date.slice(0, 7);
    monthRevenue[key] = (monthRevenue[key] ?? 0) + p.amount;
});
const gear = [
    ["DJI Mavic 3 Pro drone", 2900],
    ["Sony A7 IV body", 2500],
    ["Wide-angle lens (16-35mm)", 1350],
    ["Gimbal stabilizer", 650],
    ["Editing workstation upgrade (GPU)", 1800],
    ["NAS storage expansion", 980],
    ["Calibrated reference monitor", 1450],
    ["Drone batteries & ND filters", 420],
];
for (let m = 0; m < MONTHS_OF_HISTORY; m++) {
    const monthStart = new Date(Date.UTC(historyStart.getUTCFullYear(), historyStart.getUTCMonth() + m, 1));
    if (monthStart > TODAY) break;
    const key = iso(monthStart).slice(0, 7);
    const lastDay = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
    const isCurrentMonth = key === iso(TODAY).slice(0, 7);
    const maxDay = isCurrentMonth ? TODAY.getUTCDate() : lastDay;
    const on = (day) => iso(new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), Math.min(day, maxDay))));
    const revenue = monthRevenue[key] ?? 0;

    const items = [
        { date: on(1), category: "Office & Utilities", description: "Studio rent & utilities", amount: 650 + int(0, 4) * 15 },
        { date: on(3), category: "Software", description: "Adobe CC, Frame.io & Dropbox", amount: m < 12 ? 365 : 410 },
    ];
    if (maxDay >= 12) items.push({ date: on(int(8, 14)), category: "Marketing", description: pick(["Meta ads campaign", "LinkedIn sponsored posts", "Portfolio site & SEO", "Google ads campaign"]), amount: roundTo(between(250, 850), 5) });
    if (maxDay >= 20 && revenue > 0) items.push({ date: on(int(18, 26)), category: "Freelancers", description: "Freelance editors & voice-over", amount: roundTo(revenue * between(0.12, 0.22), 5) });
    if (maxDay >= 6) items.push({ date: on(int(5, 27)), category: "Travel", description: "On-site shoots (fuel & transport)", amount: roundTo(between(90, 420), 5) });
    if (chance(0.3) && maxDay >= 10) {
        const [description, price] = pick(gear);
        items.push({ date: on(int(10, 28)), category: "Equipment", description, amount: roundTo(price * between(0.92, 1.08), 5) });
    }
    expenses.push(...items);
}
expenses.sort((a, b) => a.date.localeCompare(b.date));
expenses.forEach((e, i) => (e.id = `exp_${pad(i + 1, 4)}`));

// ---------- write ----------
const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
const db = {
    settings,
    services: services.map((s) => omit(s, ["weight"])),
    team,
    clients: clients.map((c) => omit(c, ["_weight", "_joinOffset"])),
    projects: projects.sort((a, b) => b.date.localeCompare(a.date)),
    invoices: invoices.reverse(),
    expenses: expenses.reverse().map(({ id, ...e }) => ({ id, ...e })),
};
writeFileSync(OUTPUT, JSON.stringify(db, null, 2) + "\n");

const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
console.log(`Seeded ${OUTPUT}`);
console.log(`  data range : ${iso(historyStart)} -> ${iso(TODAY)}`);
console.log(`  clients    : ${db.clients.length}`);
console.log(`  projects   : ${db.projects.length} ($${sum(db.projects, (p) => p.amount).toLocaleString()})`);
console.log(`  invoices   : ${db.invoices.length} (${db.invoices.filter((i) => !i.paidDate).length} unpaid)`);
console.log(`  expenses   : ${db.expenses.length} ($${sum(db.expenses, (e) => e.amount).toLocaleString()})`);
