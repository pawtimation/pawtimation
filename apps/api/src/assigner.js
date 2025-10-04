export function dateSpan(fromISO, toISO){
  const a=[], s=new Date(fromISO), e=new Date(toISO);
  let d=new Date(s);
  while (d<=e){ a.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()+1); }
  return a;
}

function postcodeScore(ownerPC, sitterPC) {
  if (!ownerPC || !sitterPC) return 0.2;
  ownerPC = ownerPC.toString().trim().toUpperCase();
  sitterPC = sitterPC.toString().trim().toUpperCase();
  if (ownerPC === sitterPC) return 1.0;
  const out = ownerPC.match(/^[A-Z]{1,2}\d{1,2}/)?.[0];
  const sout = sitterPC.match(/^[A-Z]{1,2}\d{1,2}/)?.[0];
  if (out && sout && out === sout) return 0.85;
  const area = ownerPC.match(/^[A-Z]{1,2}/)?.[0];
  const sarea = sitterPC.match(/^[A-Z]{1,2}/)?.[0];
  if (area && sarea && area === sarea) return 0.6;
  return 0.25;
}

function cityScore(ownerCity, sitterCity){
  if (!ownerCity || !sitterCity) return 0.3;
  return ownerCity.trim().toLowerCase() === sitterCity.trim().toLowerCase() ? 0.9 : 0.4;
}

function availabilityOK(sitter, days){
  const off = new Set((sitter.availability?.unavailable)||[]);
  return days.every(d=>!off.has(d));
}

function serviceMatch(sitter, key){
  const svc = (sitter.services||[]).find(s=>s.key===key);
  return svc ? { ok:true, svc } : { ok:false, svc:null };
}

export function scoreSitter({ sitter, owner, req }) {
  const { serviceKey, fromISO, toISO, budget } = req;
  const days = dateSpan(fromISO, toISO);
  const avOK = availabilityOK(sitter, days);
  const sm = serviceMatch(sitter, serviceKey);

  if (!avOK || !sm.ok) return { total: 0, reasons: { available: avOK, service: sm.ok } };

  const rep = Math.min(1, (sitter.rating||4.5)/5) * 0.7 + Math.min(1,(sitter.reviews||0)/50)*0.3;
  const ver = sitter.verification?.pro ? 1 : (sitter.verification?.trainee ? 0.6 : 0.3);
  const price = sm.svc?.price ?? 0;
  const priceFit = budget ? Math.max(0, 1 - Math.max(0, (price - budget))/budget) : 0.7;

  const locP = postcodeScore(owner.postcode, sitter.postcode);
  const locC = cityScore(owner.city, sitter.city);
  const locality = (locP*0.7 + locC*0.3);

  const now = Date.now();
  const lastActiveRaw = sitter.lastActive || sitter.availability?.updatedAt || now;
  let lastActive = typeof lastActiveRaw === 'number' ? lastActiveRaw : new Date(lastActiveRaw).getTime();
  if (Number.isNaN(lastActive)) lastActive = now;
  const daysSinceActive = Math.max(0, (now - lastActive) / (1000*60*60*24));
  const recency = Math.max(0, 1 - (daysSinceActive / 90));

  const weights = { locality:0.35, reputation:0.25, verification:0.15, price:0.15, recency:0.10 };

  const total = locality*weights.locality
              + rep*weights.reputation
              + ver*weights.verification
              + priceFit*weights.price
              + recency*weights.recency;

  return {
    total: Number(total.toFixed(4)),
    parts: { locality, rep, ver, priceFit, recency },
    price,
    available: avOK,
    service: sm.svc
  };
}
