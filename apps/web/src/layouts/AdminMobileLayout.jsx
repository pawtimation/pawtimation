import { Link, useLocation } from "react-router-dom";

export function AdminMobileLayout({ children }) {
  const location = useLocation();

  const nav = [
    { label: "Home", path: "/admin/m/dashboard" },
    { label: "Clients", path: "/admin/m/clients" },
    { label: "Calendar", path: "/admin/m/calendar" },
    { label: "Jobs", path: "/admin/m/jobs" },
    { label: "Menu", path: "/admin/m/menu" }
  ];

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>

      <div className="border-t bg-white h-14 flex">
        {nav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 flex items-center justify-center text-sm ${
              location.pathname === item.path
                ? "text-teal-700 font-semibold"
                : "text-slate-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
