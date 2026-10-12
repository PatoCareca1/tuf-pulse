import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke } from '@tauri-apps/api/core';
import type { ApplyResult, Brightness, Capabilities, LightingState, ProfileFile, Profile, ProfileIconName } from '../contracts/control';
import './style.css';
import { ProfileIcon, profileIcons } from './ProfileIcon';
import { ColorPicker } from './ColorPicker';
import {removeProfile,upsertProfile,selectProfile} from './profiles';
const levels: Brightness[] = ['off','low','med','high'];
const labels = {off:'Desligado',low:'Baixo',med:'Médio',high:'Alto'};
const rows = ['Esc F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 Del','~ 1 2 3 4 5 6 7 8 9 0 − = ⌫','Tab Q W E R T Y U I O P [ ]','Caps A S D F G H J K L ; ↵','Shift Z X C V B N M , . ↑ Shift','Ctrl Fn Super Alt Espaço Alt Ctrl ← ↓ →'];
const presets = [['Branco frio','dce6ff'],['Grafite','a0a0a0'],['Cyber','4de8d1'],['Neon','b29aff']];
function App() {
 const [caps,setCaps] = useState<(Capabilities & {message:string}) | null>(null);
 const [color,setColor] = useState('dce6ff'); const [brightness,setBrightness] = useState<Brightness>('high');
 const [confirmed,setConfirmed] = useState<LightingState>({color:null,brightness:null,effect:null});
 const [busy,setBusy] = useState(false); const [message,setMessage] = useState('');
 const [requested,setRequested] = useState<string | null>(null);
 const [profiles,setProfiles] = useState<ProfileFile>({schemaVersion:1,profiles:[],lastSelectedProfileId:null});
 const [profileName,setProfileName] = useState(''); const [profileError,setProfileError] = useState('');
 const editorDialog = useRef<HTMLDialogElement>(null);
 const editorTrigger = useRef<HTMLButtonElement>(null);
 const panel = useRef<HTMLElement>(null);
 const [editingProfileId,setEditingProfileId] = useState<string | null>(null);
 const [profileIcon,setProfileIcon] = useState<ProfileIconName | null>(null);
 const [profilePage,setProfilePage] = useState(0);
 const [profileReady,setProfileReady] = useState(false);
 const persistProfiles = async (file: ProfileFile) => {
  setBusy(true);
  try {await invoke('save_profiles',{file});setProfiles(file);setProfileError('');return true;}
  catch(e) {setProfileError(String(e));return false;} finally {setBusy(false);}
 };
 const chooseProfile = async (p: Profile) => {
  if(busy) return;
  if(await persistProfiles(selectProfile(profiles,p.id))) {
   setColor(p.color);setBrightness(p.brightness);setProfileName(p.name);
   await apply(p.color, p.brightness);
  }
 };
 useEffect(()=>{void invoke<ProfileFile>('load_profiles').then(f=>{
  setProfiles(f);setProfileReady(true);
  const p=f.profiles.find(p=>p.id===f.lastSelectedProfileId);
  if(p) {setColor(p.color);setBrightness(p.brightness);setProfileName(p.name);}
 }).catch(e=>setProfileError(String(e)));},[]);
 const saveProfile = async (existing: boolean) => {
  const id=existing ? editingProfileId : crypto.randomUUID();
  if(!id)return;
  if(await persistProfiles(upsertProfile(profiles,{id,name:profileName.trim(),color,brightness,effect:'static',icon:profileIcon}))) setEditingProfileId(id);
 };
 const openEditor = () => {
  const p=profiles.profiles.find(p=>p.id===profiles.lastSelectedProfileId);
  setEditingProfileId(p?.id ?? null);setProfileName(p?.name ?? '');setProfileIcon(p?.icon ?? null);
  editorDialog.current?.showModal();
 };
 useEffect(()=>{
  const observer=new ResizeObserver(()=>{
   if(panel.current) void invoke('fit_window',{height:Math.ceil(panel.current.getBoundingClientRect().height)+2}).catch(()=>{});
  });
  if(panel.current) observer.observe(panel.current);
  return ()=>observer.disconnect();
 },[]);
 const valid = /^[\da-f]{6}$/i.test(color);
 const refresh = async () => {
  setBusy(true); setConfirmed({color:null,brightness:null,effect:null});
  try { const c = await invoke<Capabilities & {message:string}>('diagnose'); setCaps(c); setMessage(c.connection === 'ready' ? '' : c.message); const s = await invoke<LightingState>('get_state'); setConfirmed(s); }
  catch(e) { setMessage(String(e)); setCaps(null); } finally {setBusy(false);}
 };
 useEffect(()=>{void refresh();},[]);
 const apply = async (requestedColor = color, requestedBrightness = brightness) => {
  setBusy(true); setRequested(`#${requestedColor.toUpperCase()} · ${labels[requestedBrightness]}`); setMessage('');
  try {const r = await invoke<ApplyResult & {message:string}>('apply_lighting',{color:requestedColor,brightness:requestedBrightness}); setConfirmed(r.confirmedState); setMessage(r.status === 'applied' ? '' : `${r.status === 'partial' ? 'Aplicação parcial' : 'Falha'}: ${r.message}`);}
  catch(e) {setMessage(String(e));} finally {setBusy(false);}
 };
 const close = () => { if(!busy) void invoke('close_window').catch(e=>setMessage(String(e))); };
 useEffect(()=>{
  const handleKey=(event: KeyboardEvent)=>{
   if(event.key==='Escape' && !document.querySelector('dialog[open]') && !busy) {
    event.preventDefault();void invoke('close_window').catch(e=>setMessage(String(e)));
   }
  };
  document.addEventListener('keydown',handleKey);
  return ()=>document.removeEventListener('keydown',handleKey);
 },[busy]);
 const previewTrigger = useRef<HTMLButtonElement>(null);
 const previewDialog = useRef<HTMLDialogElement>(null);
 const ready = caps?.connection === 'ready' && caps.effects.static === 'confirmed';
 return <main ref={panel} className="quick-panel">
  <header className="app-header">
   <h1><span aria-hidden="true">ϟ</span> TUF Pulse</h1>
   <div className="header-actions">{confirmed.color === color.toLowerCase() && confirmed.brightness === brightness && !busy && !message && <span className="success-mark" role="status" aria-label="Comando concluído" title="Comando concluído">✓</span>}<button className="close-app" disabled={busy} aria-label="Fechar aplicativo (Escape)" title="Fechar (Esc)" onClick={close}>×</button></div>
  </header>



  <section className="profiles" aria-label="Perfis locais">
   <div className="profile-heading"><h2>Perfis salvos</h2><button ref={editorTrigger} className="edit-profiles" aria-label="Editar perfis" title="Editar perfis" aria-haspopup="dialog" onClick={openEditor}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m13 6 5 5"/></svg></button></div>
   <div className="saved">{profiles.profiles.length ? profiles.profiles.slice(Math.min(profilePage, Math.max(0,Math.ceil(profiles.profiles.length/6)-1))*6, (Math.min(profilePage, Math.max(0,Math.ceil(profiles.profiles.length/6)-1))+1)*6).map(p=><button key={p.id} className={p.icon ? 'icon-profile' : 'named-profile'} aria-label={p.name} disabled={busy} aria-pressed={profiles.lastSelectedProfileId===p.id} onClick={()=>void chooseProfile(p)} title={`${p.name} · #${p.color.toUpperCase()} · ${labels[p.brightness]}`}><span className="profile-dot" style={{background:`#${p.color}`}}/>{p.icon ? <ProfileIcon icon={p.icon}/> : p.name}</button>) : <p className="empty">Nenhum perfil salvo</p>}</div>
   {message && <p className="error" role="alert">{message}</p>}
   {profiles.profiles.length>6 && <div className="profile-pages"><button aria-label="Perfis anteriores" disabled={profilePage===0} onClick={()=>setProfilePage(Math.max(0,profilePage-1))}>‹</button><button aria-label="Próximos perfis" disabled={(profilePage+1)*6>=profiles.profiles.length} onClick={()=>setProfilePage(profilePage+1)}>›</button></div>}

   {profileError && <p className="error" role="alert">{profileError}</p>}
  </section>

  <section className="controls" aria-label="Iluminação">
   <div className="color-row"><label htmlFor="color">Cores:</label><ColorPicker color={color} onChange={setColor}/>
    <div className="presets" aria-label="Cores favoritas">{presets.map(([name,c])=><button key={name} aria-label={name} title={name} aria-pressed={color.toLowerCase()===c} onClick={()=>setColor(c)}><span className="swatch" style={{background:`#${c}`}}/></button>)}</div>
   </div>
   <div className="brightness-row"><label htmlFor="brightness-slider">Brilho:</label>
    <div className="brightness-slider"><input id="brightness-slider" type="range" min={0} max={3} step={1} value={levels.indexOf(brightness)} aria-valuetext={labels[brightness]} disabled={busy || !caps?.brightness.length} onChange={e=>{const level=levels[Number(e.target.value)];if(caps?.brightness.includes(level))setBrightness(level);}}/>
     <div className="brightness-ticks" aria-hidden="true">{levels.map(level=><span key={level}/>)}</div>
    </div><output htmlFor="brightness-slider">{labels[brightness]}</output>
   </div>
  </section>



  <div className="apply-area"><div className="actions"><button ref={previewTrigger} className="preview-button" disabled={!valid} onClick={()=>previewDialog.current?.showModal()}>Prévia</button><button className="primary" disabled={busy || !valid || !ready || !caps?.brightness.includes(brightness)} onClick={()=>void apply()}>{busy ? 'Aguarde…' : 'Aplicar'}</button></div></div>

  <details className="diagnostic"><summary>Dispositivo e estado</summary><div className="diagnostic-body">
   <p>{caps?.model ?? 'Modelo desconhecido'} · asusctl {caps?.adapterVersion ?? '—'}</p>
   <p>{caps?.message}</p><p>Brilho anunciado: {caps?.brightness.map(b=>labels[b]).join(', ') || 'desconhecido'}. Zonas independentes: {caps?.independentZoneCount ?? 'desconhecidas'}.</p>
   <p>Solicitado: {requested ?? 'nenhuma aplicação nesta sessão'}<br/>Cor aceita pelo comando: {confirmed.color ? `#${confirmed.color.toUpperCase()}` : 'desconhecida'}<br/>Brilho lido: {confirmed.brightness ? labels[confirmed.brightness] : 'desconhecido'}</p>
   <p>A prévia é ilustrativa. A cor não possui leitura de confirmação; confira os LEDs. Efeitos extras não estão habilitados.</p>
   <button disabled={busy} onClick={()=>void refresh()}>Atualizar diagnóstico</button>
  </div></details>
  <dialog ref={editorDialog} className="preview-dialog editor-dialog" aria-labelledby="editor-title" onClose={()=>editorTrigger.current?.focus()} onClick={e=>{if(e.target===e.currentTarget)editorDialog.current?.close();}}>
   <div className="dialog-header"><h2 id="editor-title">Editar perfis</h2><button autoFocus aria-label="Fechar edição" onClick={()=>editorDialog.current?.close()}>×</button></div>
<select aria-label="Perfil para editar" value={editingProfileId ?? ''} onChange={e=>{
     const p=profiles.profiles.find(p=>p.id===e.target.value);setEditingProfileId(p?.id ?? null);setProfileName(p?.name ?? '');setProfileIcon(p?.icon ?? null);if(p){setColor(p.color);setBrightness(p.brightness);}
    }}><option value="">Novo perfil</option>{profiles.profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <div className="icon-options" role="group" aria-label="Aparência do perfil"><button aria-pressed={!profileIcon} onClick={()=>setProfileIcon(null)}>Nome</button>{profileIcons.map(i=><button key={i.id} aria-label={i.label} title={i.label} aria-pressed={profileIcon===i.id} onClick={()=>setProfileIcon(i.id)}><ProfileIcon icon={i.id}/></button>)}</div>
    <form className="save" onSubmit={e=>{e.preventDefault();void saveProfile(false);}}>
    <input aria-label="Nome do perfil" placeholder="Nome do perfil" maxLength={32} value={profileName} onChange={e=>setProfileName(e.target.value)} required/>
    <button disabled={busy || !profileReady || !valid || !profileName.trim() || profiles.profiles.length>=20}>Salvar novo</button>
    <button type="button" disabled={busy || !profileReady || !valid || !profileName.trim() || !editingProfileId} onClick={()=>void saveProfile(true)}>Atualizar selecionado</button>
    <button className="delete" type="button" disabled={busy || !editingProfileId} onClick={()=>editingProfileId && void persistProfiles(removeProfile(profiles,editingProfileId)).then(ok=>{if(ok){setEditingProfileId(null);setProfileName('');setProfileIcon(null);}})}>Excluir selecionado</button>
   </form>
   {profileError && <p className="error" role="alert">{profileError}</p>}
  </dialog>
  <dialog ref={previewDialog} onClose={()=>previewTrigger.current?.focus()} className="preview-dialog" aria-labelledby="preview-title" onClick={e=>{if(e.target===e.currentTarget)previewDialog.current?.close();}}>
   <div className="dialog-header"><h2 id="preview-title">Prévia do teclado</h2><button autoFocus aria-label="Fechar prévia" onClick={()=>previewDialog.current?.close()}>×</button></div>
  <section className="preview" style={{'--led':brightness === 'off' ? '#657380' : valid ? `#${color}` : '#dce6ff','--intensity':{off:.3,low:.45,med:.7,high:1}[brightness]} as React.CSSProperties}>
   <div className="keyboard" role="img" aria-label="Prévia esquemática de teclado com uma cor uniforme">{rows.map((row,i)=><div className="keyrow" key={i}>{row.split(' ').map((key,j)=><span className={`key ${key==='Espaço'?'space':''}`} key={j}>{key==='Espaço'?'':key}</span>)}</div>)}</div>
   <div className="preview-caption"><span>Prévia · zona única</span><span>{labels[brightness]}</span></div>
  </section>
   <p className="hint">#{color.toUpperCase()} · {labels[brightness]}. Ilustração de zona única; abrir a prévia não altera o teclado.</p>
  </dialog>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
