import React, { useState } from 'react';
import { InvoicesTab } from './financial/InvoicesTab';
import { OverviewTab } from './financial/OverviewTab';
import { ForecastsTab } from './financial/ForecastsTab';
import { BreakdownsTab } from './financial/BreakdownsTab';

export function AdminFinancial({ business }) {
  const [activeTab, setActiveTab] = useState('invoices');

  const tabs = [
    { id: 'invoices', label: 'Invoices' },
    { id: 'overview', label: 'Overview' },
    { id: 'forecasts', label: 'Forecasts' },
    { id: 'breakdowns', label: 'Breakdowns' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Financial Reports</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'invoices' && <InvoicesTab business={business} />}
        {activeTab === 'overview' && <OverviewTab business={business} />}
        {activeTab === 'forecasts' && <ForecastsTab business={business} />}
        {activeTab === 'breakdowns' && <BreakdownsTab business={business} />}
      </div>
    </div>
  );
}
