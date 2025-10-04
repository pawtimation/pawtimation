import React, { useState } from 'react'
import { API_BASE } from '../config'

export function ReportIncident({ bookingId, sitterId, sitterName, ownerEmail, onBack, onReported }){
  const [violationType, setViolationType] = useState('')
  const [description, setDescription] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [petAffected, setPetAffected] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [response, setResponse] = useState(null)

  const violationTypes = [
    { value: 'PET_INJURY', label: '🩹 Pet Injury', severity: 'CRITICAL' },
    { value: 'PET_NEGLECT', label: '⚠️ Pet Neglect', severity: 'CRITICAL' },
    { value: 'PET_ABUSE', label: '🚨 Pet Abuse', severity: 'CRITICAL' },
    { value: 'ABANDONMENT', label: '❌ Abandonment', severity: 'CRITICAL' },
    { value: 'MEDICAL_NEGLIGENCE', label: '💊 Medical Negligence', severity: 'CRITICAL' },
    { value: 'UNSAFE_CONDITIONS', label: '⚡ Unsafe Conditions', severity: 'CRITICAL' },
    { value: 'MISSED_MEDICATION', label: '💉 Missed Medication', severity: 'HIGH' },
    { value: 'UNAUTHORIZED_ACTIVITIES', label: '🚫 Unauthorized Activities', severity: 'HIGH' },
    { value: 'POOR_HYGIENE', label: '🧼 Poor Hygiene', severity: 'HIGH' },
    { value: 'FAILURE_TO_FOLLOW_INSTRUCTIONS', label: '📋 Failure to Follow Instructions', severity: 'MEDIUM' }
  ]

  async function submitReport(){
    if(!violationType || !description || !incidentDate) return

    setLoading(true)
    const r = await fetch(`${API_BASE}/incidents/report`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        ownerEmail,
        sitterId,
        bookingId,
        violationType,
        description,
        evidenceUrls: evidenceUrls.split(',').map(u => u.trim()).filter(Boolean),
        incidentDate,
        petAffected
      })
    })

    if(r.ok){
      const data = await r.json()
      setResponse(data)
      setSubmitted(true)
      if(onReported) onReported(data.incident)
    }
    setLoading(false)
  }

  if(submitted && response){
    return (
      <div className="max-w-2xl mx-auto mt-6 space-y-4">
        <div className={`p-6 rounded-xl ${response.companionSuspended ? 'bg-red-50 border-2 border-red-300' : 'bg-blue-50 border-2 border-blue-300'}`}>
          <div className="text-2xl mb-3">{response.companionSuspended ? '🚨' : '✓'}</div>
          <h2 className="text-xl font-bold mb-2">Incident Report Submitted</h2>
          <p className="text-sm mb-4">{response.message}</p>
          
          {response.companionSuspended && (
            <div className="bg-white border border-red-200 rounded p-4 text-sm">
              <div className="font-semibold text-red-800 mb-2">⚠️ Immediate Action Taken</div>
              <div className="text-slate-700">
                Due to the critical nature of this violation, <strong>{sitterName}</strong> has been immediately suspended from the platform pending full investigation. They will not be able to accept any new bookings.
              </div>
            </div>
          )}

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>Incident ID: <span className="font-mono font-medium">{response.incident.id}</span></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>Our team has been notified and will review your report</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>You will receive updates via email at <strong>{ownerEmail}</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600">✓</span>
              <span>All evidence has been preserved</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            className="px-4 py-2 bg-slate-200 rounded-lg"
            onClick={onBack}
          >
            ← Back to Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Report Duty of Care Violation</h2>
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm">
        <div className="font-semibold text-amber-900 mb-2">⚖️ Legal Notice</div>
        <div className="text-amber-800">
          This form is for reporting serious duty of care violations under the Animal Welfare Act 2006. 
          False or malicious reports may result in account suspension. Critical violations result in <strong>immediate permanent suspension</strong> of the companion.
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Violation Type *</label>
          <select 
            value={violationType} 
            onChange={e=>setViolationType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Select violation type...</option>
            {violationTypes.map(vt => (
              <option key={vt.value} value={vt.value}>
                {vt.label} {vt.severity === 'CRITICAL' ? '(CRITICAL - Immediate Suspension)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Pet Affected</label>
          <input 
            type="text"
            placeholder="Pet name"
            value={petAffected}
            onChange={e=>setPetAffected(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Incident Date & Time *</label>
          <input 
            type="datetime-local"
            value={incidentDate}
            onChange={e=>setIncidentDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Detailed Description *</label>
          <textarea 
            placeholder="Provide a detailed account of what happened, including specific actions or failures that constitute a duty of care violation..."
            value={description}
            onChange={e=>setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-3 h-32"
          />
          <div className="text-xs text-slate-500 mt-1">Be specific: dates, times, witnesses, actions taken</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Evidence URLs</label>
          <input 
            type="text"
            placeholder="Comma-separated URLs to photos, videos, vet reports, etc."
            value={evidenceUrls}
            onChange={e=>setEvidenceUrls(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
          <div className="text-xs text-slate-500 mt-1">Upload evidence to a file host and paste URLs here (separated by commas)</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800">
          <div className="font-semibold mb-1">⚠️ Critical Violations = Immediate Permanent Suspension</div>
          <div>Pet injury, neglect, abuse, abandonment, medical negligence, or unsafe conditions will result in the companion being immediately and permanently removed from Pawtimation.</div>
        </div>

        <button 
          onClick={submitReport}
          disabled={loading || !violationType || !description || !incidentDate}
          className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition"
        >
          {loading ? 'Submitting Report...' : 'Submit Incident Report'}
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs text-slate-600">
        <div className="font-medium mb-2">What happens after you submit:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Your report is immediately reviewed by our team</li>
          <li>Critical violations trigger automatic companion suspension</li>
          <li>We preserve all evidence and investigate thoroughly</li>
          <li>You receive email updates on the investigation status</li>
          <li>Confirmed violations result in permanent removal (one strike policy)</li>
          <li>We cooperate with authorities if law enforcement involvement is required</li>
        </ul>
      </div>
    </div>
  )
}
