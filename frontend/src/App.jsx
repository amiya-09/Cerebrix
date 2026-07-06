import { Routes, Route, NavLink } from "react-router-dom";
import Chat from "./pages/Chat";
import Queue from "./pages/Queue";
import KnowledgeBase from "./pages/KnowledgeBase";
import Dashboard from "./pages/Dashboard";
import Opportunities from "./pages/Opportunities";
import Conversations from "./pages/Conversations";

function App() {
  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-sm font-medium ${
      isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center gap-2 px-6 py-4 border-b bg-white">
        <span className="text-xl font-bold mr-6">Cerebrix</span>
        <NavLink to="/" className={navLinkClass}>Chat</NavLink>
        <NavLink to="/queue" className={navLinkClass}>Review Queue</NavLink>
        <NavLink to="/kb" className={navLinkClass}>Knowledge Base</NavLink>
        <NavLink to="/opportunities" className={navLinkClass}>Opportunities</NavLink>
        <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
      </nav>

      <main className="p-6">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/kb" element={<KnowledgeBase />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/conversations" element={<Conversations />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
