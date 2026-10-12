import { describe,it,expect } from 'vitest';
import {removeProfile,upsertProfile,selectProfile} from './profiles';
import type {ProfileFile,Profile} from '../contracts/control';
const profile:Profile={id:'a',name:'Cyber',color:'4de8d1',brightness:'low',effect:'static'};
const empty:ProfileFile={schemaVersion:1,profiles:[],lastSelectedProfileId:null};
describe('profile selection',()=>{
 it('clears selection when removing the selected profile',()=>{const f=upsertProfile(empty,profile);expect(removeProfile(f,'a')).toEqual(empty);expect(f.profiles).toHaveLength(1);});
 it('renames without duplicating or losing lighting settings',()=>{const f=upsertProfile(upsertProfile(empty,profile),{...profile,name:'Work'});expect(f.profiles).toEqual([{...profile,name:'Work'}]);});
 it('selects without applying or changing stored settings',()=>{expect(selectProfile(upsertProfile(empty,profile),null).profiles).toEqual([profile]);});
});

it('keeps the chosen icon when updating and selecting a profile',()=>{
 const f=upsertProfile(empty,{...profile,icon:'game'});
 expect(selectProfile(f,'a').profiles[0].icon).toBe('game');
 expect(upsertProfile(f,{...f.profiles[0],name:'Jogar'}).profiles[0].icon).toBe('game');
});
