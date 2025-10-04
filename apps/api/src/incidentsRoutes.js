import { repo } from './repo.js'

export default async function incidentsRoutes(app){
  app.post('/incidents/report', async (req, reply)=>{
    const { 
      ownerEmail, 
      sitterId, 
      bookingId,
      violationType, 
      description, 
      evidenceUrls = [],
      incidentDate,
      petAffected
    } = req.body||{}
    
    if(!ownerEmail || !sitterId || !violationType || !description) {
      return reply.code(400).send({error:'Missing required fields: ownerEmail, sitterId, violationType, description'})
    }
    
    const sitter = await repo.getSitterById(sitterId)
    if(!sitter) return reply.code(404).send({error:'Companion not found'})
    
    const incident = await repo.createIncident({
      ownerEmail,
      sitterId,
      sitterName: sitter.name,
      bookingId,
      violationType,
      description,
      evidenceUrls,
      incidentDate: incidentDate || new Date().toISOString(),
      petAffected,
      severity: determineSeverity(violationType)
    })
    
    if(incident.severity === 'CRITICAL') {
      await repo.addStrike(sitterId, incident.id, `CRITICAL: ${violationType}`)
      await repo.updateIncidentStatus(incident.id, 'CONFIRMED_VIOLATION', 'Automatic suspension for critical duty of care violation')
    }
    
    return { 
      incident,
      message: incident.severity === 'CRITICAL' 
        ? 'Incident reported. Companion has been immediately suspended pending investigation.'
        : 'Incident reported. Our team will review and respond within 24 hours.',
      companionSuspended: incident.severity === 'CRITICAL'
    }
  })

  app.get('/incidents', async (req, reply)=>{
    const { sitterId, ownerEmail, status } = req.query||{}
    let incidents = await repo.getAllIncidents()
    
    if(sitterId) incidents = incidents.filter(i => i.sitterId === sitterId)
    if(ownerEmail) incidents = incidents.filter(i => i.ownerEmail === ownerEmail)
    if(status) incidents = incidents.filter(i => i.status === status)
    
    incidents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    return { incidents, count: incidents.length }
  })

  app.get('/incidents/:id', async (req, reply)=>{
    const { id } = req.params
    const incident = await repo.getIncident(id)
    if(!incident) return reply.code(404).send({error:'Incident not found'})
    
    return { incident }
  })

  app.put('/incidents/:id/review', async (req, reply)=>{
    const { id } = req.params
    const { status, reviewNotes } = req.body||{}
    
    if(!status || !reviewNotes) {
      return reply.code(400).send({error:'Missing required fields: status, reviewNotes'})
    }
    
    const validStatuses = ['NEW', 'UNDER_REVIEW', 'AWAITING_EVIDENCE', 'CONFIRMED_VIOLATION', 'NO_VIOLATION', 'CLOSED']
    if(!validStatuses.includes(status)) {
      return reply.code(400).send({error:'Invalid status. Must be one of: ' + validStatuses.join(', ')})
    }
    
    const incident = await repo.updateIncidentStatus(id, status, reviewNotes)
    if(!incident) return reply.code(404).send({error:'Incident not found'})
    
    if(status === 'CONFIRMED_VIOLATION') {
      const existingStrikes = await repo.getSitterStrikes(incident.sitterId)
      if(existingStrikes.length === 0) {
        await repo.addStrike(incident.sitterId, incident.id, `${incident.violationType}: ${incident.description}`)
      }
    }
    
    return { incident, message: 'Incident review updated successfully' }
  })

  app.get('/companions/:sitterId/strikes', async (req, reply)=>{
    const { sitterId } = req.params
    const strikes = await repo.getSitterStrikes(sitterId)
    const isSuspended = await repo.isSitterSuspended(sitterId)
    
    return { 
      sitterId,
      strikes,
      strikeCount: strikes.length,
      isSuspended,
      status: isSuspended ? 'SUSPENDED' : 'ACTIVE'
    }
  })
}

function determineSeverity(violationType){
  const criticalViolations = [
    'PET_INJURY',
    'PET_NEGLECT',
    'PET_ABUSE',
    'ABANDONMENT',
    'MEDICAL_NEGLIGENCE',
    'UNSAFE_CONDITIONS'
  ]
  
  const highViolations = [
    'MISSED_MEDICATION',
    'UNAUTHORIZED_ACTIVITIES',
    'POOR_HYGIENE',
    'FAILURE_TO_FOLLOW_INSTRUCTIONS'
  ]
  
  if(criticalViolations.includes(violationType)) return 'CRITICAL'
  if(highViolations.includes(violationType)) return 'HIGH'
  return 'MEDIUM'
}
