import { customAlphabet } from 'nanoid';
export const nid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12);
export const isoNow=()=>new Date().toISOString();
export function daysBetween(s,e){return Math.ceil((new Date(e)-new Date(s))/(1000*60*60*24));}
