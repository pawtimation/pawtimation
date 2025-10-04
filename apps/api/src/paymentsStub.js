import { nid } from './utils.js'
export async function createEscrowIntent({amountCents}){return { id:'pi_'+nid(), clientSecret:'cs_'+nid(), amountCents }}
export async function releaseEscrow(){return { id:'po_'+nid(), status:'paid' }}
