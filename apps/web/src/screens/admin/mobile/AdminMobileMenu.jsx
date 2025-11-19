export function AdminMobileMenu() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold mb-2">Menu</h1>
      
      <div className="space-y-2">
        <a 
          href="/admin"
          className="block bg-white border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
        >
          <div className="font-medium text-slate-900">Switch to Desktop UI</div>
          <div className="text-sm text-slate-600 mt-1">
            Use full desktop interface on this device
          </div>
        </a>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="font-medium text-slate-400">Settings</div>
          <div className="text-sm text-slate-500 mt-1">
            Coming in Patch A6
          </div>
        </div>
      </div>
    </div>
  );
}
