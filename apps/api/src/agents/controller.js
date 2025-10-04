let flags={digest:true,recruiter:false,compliance:false,growth:false};export const getAgentFlags=()=>flags;export function setAgentFlag(n,v){if(n in flags)flags[n]=!!v;return flags}
