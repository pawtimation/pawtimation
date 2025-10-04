import React from 'react';

function ymd(date){ return date.toISOString().slice(0,10); }
function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }

export default function MonthCalendar({ year, month, selected=[], onToggle }){
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay()+6)%7;
  const total = daysInMonth(year, month);
  const cells = [];
  for (let i=0;i<startWeekday;i++) cells.push(null);
  for (let d=1; d<=total; d++) cells.push(new Date(year, month, d));

  const selectedSet = new Set(selected);

  return (
    <div className="border rounded-xl p-3">
      <div className="grid grid-cols-7 gap-1 text-xs text-slate-500 mb-1">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=><div key={x} className="text-center">{x}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dt, i)=>{
          if (!dt) return <div key={'e'+i} />;
          const key = ymd(dt);
          const isSel = selectedSet.has(key);
          return (
            <button
              key={key}
              onClick={()=>onToggle?.(key, !isSel)}
              className={
                'h-9 rounded text-sm ' +
                (isSel ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200')
              }>
              {dt.getDate()}
            </button>
          );
        })}
      </div>
      <div className="text-xs text-slate-500 mt-2">
        Tap a date to toggle <strong>unavailable</strong>. Selected dates show in red.
      </div>
    </div>
  );
}
