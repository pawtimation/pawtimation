import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { repo } from '../../../api/src/repo.js';

export function StaffCalendar({ business, staffUser }) {
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    (async () => {
      if (!business || !staffUser) return;
      const [allJobs, svc, cl] = await Promise.all([
        repo.listJobsByBusiness(business.id),
        repo.listServicesByBusiness(business.id),
        repo.listClientsByBusiness(business.id),
      ]);
      setJobs(allJobs.filter(j => j.staffId === staffUser.id));
      setServices(svc);
      setClients(cl);
    })();
  }, [business, staffUser]);

  const svcById = useMemo(
    () => Object.fromEntries(services.map(s => [s.id, s])),
    [services]
  );
  const clientById = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, c])),
    [clients]
  );

  const events = useMemo(() => {
    return jobs
      .filter(j => j.start && j.end)
      .map(j => {
        const svc = svcById[j.serviceId];
        const client = clientById[j.clientId];

        const titleParts = [];
        if (svc?.name) titleParts.push(svc.name);
        if (client?.name) titleParts.push(client.name);

        let bgClass = 'bg-emerald-500';
        if (j.status === 'REQUESTED') bgClass = 'bg-amber-400';
        else if (j.status === 'DECLINED' || j.status === 'CANCELLED') bgClass = 'bg-rose-400';
        else if (j.status === 'COMPLETED') bgClass = 'bg-slate-500';

        return {
          id: j.id,
          title: titleParts.join(' · ') || 'Job',
          start: j.start,
          end: j.end,
          extendedProps: {
            status: j.status,
            serviceName: svc?.name,
            clientName: client?.name,
          },
          classNames: ['rounded', 'text-xs', 'border-none', bgClass],
        };
      });
  }, [jobs, svcById, clientById]);

  function renderEventContent(arg) {
    const { event } = arg;
    const status = event.extendedProps.status;
    return (
      <div className="px-1 py-[1px] leading-tight">
        <div className="font-medium truncate">{event.title}</div>
        <div className="text-[10px] opacity-80">
          {status === 'REQUESTED'
            ? 'Requested'
            : status === 'SCHEDULED' || status === 'APPROVED'
            ? 'Confirmed'
            : status === 'COMPLETED'
            ? 'Completed'
            : status}
        </div>
      </div>
    );
  }

  if (!staffUser) {
    return (
      <p className="text-sm text-slate-600">
        No staff member selected.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          {staffUser.name}&apos;s calendar
        </h1>
        <p className="text-xs text-slate-500">
          Your upcoming walks, sits and services.
        </p>
      </div>

      <div className="card overflow-hidden">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay',
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          height="auto"
          events={events}
          eventContent={renderEventContent}
          nowIndicator
        />
      </div>
    </div>
  );
}
