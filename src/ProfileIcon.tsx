import type { ProfileIconName } from '../contracts/control';
export const profileIcons: {id: ProfileIconName; label: string}[] = [
 {id:'work',label:'Trabalho'}, {id:'code',label:'Programação'}, {id:'game',label:'Jogar'}, {id:'incognito',label:'Incógnito'},
];
export function ProfileIcon({icon}: {icon: ProfileIconName}) {
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  {icon==='work' && <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v3h4v-3"/></>}
  {icon==='code' && <><rect x="2" y="3" width="20" height="15" rx="2"/><path d="m8 7-3 3 3 3m8-6 3 3-3 3m-3-6-2 6M8 22h8m-4-4v4"/></>}
  {icon==='game' && <><path d="M7 7h10c3 0 4 4 5 10 0 3-3 4-5 1l-2-2H9l-2 2c-2 3-5 2-5-1 1-6 2-10 5-10Z"/><path d="M6 10v5m-2.5-2.5h5M16 11h.01M19 14h.01"/></>}
  {icon==='incognito' && <><path d="M3 10h18M6 10l2-7 4 2 4-2 2 7"/><circle cx="7" cy="17" r="4"/><circle cx="17" cy="17" r="4"/><path d="M11 17h2"/></>}
 </svg>;
}
