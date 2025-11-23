import React, { useState } from "react";

function loadUser() {
  try {
    const raw = localStorage.getItem("pt_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AdminPanel() {
  const user = loadUser();
  const businessId = user?.businessId || "demo_business";

  const [status, setStatus] = useState(null);
  const [importError, setImportError] = useState(null);

  function flash(msg) {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2500);
  }

  // -----------------------------
  // Impersonation
  // -----------------------------
  function impersonate(type) {
    localStorage.setItem(
      "pt_impersonate",
      JSON.stringify({ type, timestamp: Date.now() })
    );
    flash(`Now impersonating: ${type}`);
  }

  function stopImpersonation() {
    localStorage.removeItem("pt_impersonate");
    flash("Stopped impersonation");
  }

  // -----------------------------
  // Export / Import Tools
  // -----------------------------
  function exportData() {
    const data = {};
    Object.keys(localStorage).forEach((key) => {
      if (key.includes(businessId)) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${businessId}_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    flash("Export downloaded");
  }

  function importData(evt) {
    const file = evt.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });

        flash("Data imported successfully");
        setImportError(null);
      } catch {
        setImportError("Invalid JSON file");
      }
    };

    reader.readAsText(file);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Panel</h1>
        <p className="text-base text-slate-600">
          Advanced tools for managing your business operations
        </p>
      </div>

      {/* Status Flash */}
      {status && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{status}</span>
          </div>
        </div>
      )}

      {/* Impersonation Section */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Impersonation</h2>
          <p className="text-sm text-slate-500">
            Temporarily view the system from another user's perspective for testing and support
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:bg-teal-800 transition-colors" 
            onClick={() => impersonate("client")}
          >
            View as Client
          </button>
          <button 
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:bg-teal-800 transition-colors" 
            onClick={() => impersonate("staff")}
          >
            View as Staff
          </button>
          <button 
            className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-300" 
            onClick={stopImpersonation}
          >
            Stop Impersonation
          </button>
        </div>
      </section>

      {/* Data Export Section */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Data Export</h2>
          <p className="text-sm text-slate-500">
            Download a complete backup of your business data as a JSON file for safekeeping or migration
          </p>
        </div>

        <div>
          <button 
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 active:bg-teal-800 transition-colors" 
            onClick={exportData}
          >
            Download Data Export
          </button>
        </div>
      </section>

      {/* Data Import Section */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Data Import</h2>
          <p className="text-sm text-slate-500">
            Restore a previous data backup or migrate data from another source
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 cursor-pointer border border-slate-300 transition-colors">
              Choose File
              <input 
                type="file" 
                accept="application/json" 
                onChange={importData}
                className="hidden"
              />
            </label>
            <span className="text-xs text-slate-500">Select a JSON backup file</span>
          </div>

          {importError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{importError}</p>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Warning</p>
              <p className="text-xs">Importing data will overwrite existing records with matching keys. Make sure to export your current data first if you want to preserve it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Logs Section (Placeholder) */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-1">System Logs</h2>
          <p className="text-sm text-slate-500">
            View system activity and audit logs for troubleshooting
          </p>
        </div>

        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
          <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-slate-600 font-medium">System logs viewer coming soon</p>
          <p className="text-xs text-slate-500 mt-1">Contact support to access detailed system logs</p>
        </div>
      </section>
    </div>
  );
}
