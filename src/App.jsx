import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects/Projects";
import Clients from "./components/Clients/Clients";
import ClientDetails from "./pages/ClientDetails";
import Invoices from "./pages/Invoices";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Layout renders the header + sidebar, and the page goes in its <Outlet /> */}
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="clients/:clientId" element={<ClientDetails />} />
                    <Route path="invoices" element={<Invoices />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
