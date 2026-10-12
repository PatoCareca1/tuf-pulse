import type { Profile, ProfileFile } from '../contracts/control';
export function selectProfile(file: ProfileFile, id: string | null): ProfileFile {
 return {...file,lastSelectedProfileId:id};
}
export function removeProfile(file: ProfileFile, id: string): ProfileFile {
 return {...file,profiles:file.profiles.filter(p=>p.id!==id),lastSelectedProfileId:file.lastSelectedProfileId===id?null:file.lastSelectedProfileId};
}
export function upsertProfile(file: ProfileFile, profile: Profile): ProfileFile {
 const found=file.profiles.some(p=>p.id===profile.id);
 return {...file,profiles:found?file.profiles.map(p=>p.id===profile.id?profile:p):[...file.profiles,profile],lastSelectedProfileId:profile.id};
}
