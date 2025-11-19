import { Link } from "react-router-dom";

export function AdminMobileSettings() {
  return (
    <div className="space-y-6">

      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="space-y-3">

        <Link
          to="/admin/m/settings/business"
          className="block p-4 border rounded-md bg-white"
        >
          <p className="font-medium">Business Details</p>
          <p className="text-sm text-slate-600">Name, contact info, address</p>
        </Link>

        <Link
          to="/admin/m/settings/hours"
          className="block p-4 border rounded-md bg-white"
        >
          <p className="font-medium">Working Hours</p>
          <p className="text-sm text-slate-600">Default operating hours</p>
        </Link>

        <Link
          to="/admin/m/settings/policies"
          className="block p-4 border rounded-md bg-white"
        >
          <p className="font-medium">Policies</p>
          <p className="text-sm text-slate-600">Cancellation, payment terms</p>
        </Link>

        <Link
          to="/admin/m/settings/branding"
          className="block p-4 border rounded-md bg-white"
        >
          <p className="font-medium">Branding</p>
          <p className="text-sm text-slate-600">Primary colour, footer wording</p>
        </Link>

      </div>

    </div>
  );
}
