import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { repo } from '../../../api/src/repo.js';

export function BusinessCalendar({ business }) {
  const [jobs, setJobs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [filterStaffId, setFilterStaffId] = useState('');
  const [filterServiceId, setFilterServiceId] = useState('');

  useEffect(() => {
    (async () => {
      if (!business) return;
      const [j, st, svc, cl] = await Promise.all([
        repo.listJobsByBusiness(business.id),
        repo.listStaffByBusiness(business.id),
        repo.listServicesByBusiness(business.id),
        repo.listClientsByBusiness(business.id),
      ]);
      setJobs(j);
      setStaff(st);
      setServices(svc);
      setClients(cl);
    })();
  }, [business]);

  const staffById = useMemo(
    () => Object.fromEntries(staff.map(s => [s.id, s])),
    [staff]
  );
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
      .filter(j => {
        if (filterStaffId && j.staffId !== filterStaffId) return false;
        if (filterServiceId && j.serviceId !== filterServiceId) return false;
        if (!j.start || !j.end) return false;
        return true;
      })
      .map(j => {
        const svc = svcById[j.serviceId];
        const staffMember = staffById[j.staffId];
        const client = clientById[j.clientId];

        const titleParts = [];
        if (svc?.name) titleParts.push(svc.name);
        if (client?.name) titleParts.push(client.name);
        if (staffMember?.name) titleParts.push(`– ${staffMember.name}`);

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
            staffName: staffMember?.name,
            clientName: client?.name,
          },
          classNames: ['rounded', 'text-xs', 'border-none', bgClass],
        };
      });
  }, [jobs, svcById, staffById, clientById, filterStaffId, filterServiceId]);

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

  if (!business) {
    return <p className="text-sm text-slate-600">No business loaded.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Team calendar</h1>
          <p className="text-xs text-slate-500">
            All staff, all services, in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="border rounded px-2 py-1 text-xs"
            value={filterStaffId}
            onChange={e => setFilterStaffId(e.target.value)}
          >
            <option value="">All staff</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={filterServiceId}
            onChange={e => setFilterServiceId(e.target.value)}
          >
            <option value="">All services</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
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
