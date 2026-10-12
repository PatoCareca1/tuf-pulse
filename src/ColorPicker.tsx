import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { hexToHsv, hsvToHex } from './color';

const isHex = (value: string) => /^[0-9a-f]{6}$/i.test(value);


export function ColorPicker({ color, onChange, disabled = false }: { color: string; onChange: (color: string) => void; disabled?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [draft, setDraftState] = useState(color);
  const latestDraft = useRef(color);
  function setDraft(next: string) { latestDraft.current = next; setDraftState(next); }
  const [hue, setHue] = useState(0);
  const valid = isHex(draft);
  const displayed = valid ? draft : 'dce6ff';
  const { s: saturation, v: value } = hexToHsv(displayed);

  function open() {
    const initial = isHex(color) ? color : 'dce6ff';
    setDraft(initial);
    setHue(hexToHsv(initial).h);
    dialog.current?.showModal();
  }

  function pick(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setDraft(hsvToHex(hue, (event.clientX-bounds.left)/bounds.width, 1-(event.clientY-bounds.top)/bounds.height));
  }

  return <>
    <button id="color" ref={trigger} className="color-trigger" aria-label="Escolher cor personalizada" aria-haspopup="dialog" disabled={disabled} onClick={open}>
      <span style={{ background: `#${isHex(color) ? color : 'dce6ff'}` }} />
    </button>
    <dialog ref={dialog} className="preview-dialog color-dialog" aria-labelledby="custom-color-title"
      onContextMenu={event => event.preventDefault()}
      onClose={() => trigger.current?.focus()}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="dialog-header">
        <h2 id="custom-color-title">Cor personalizada</h2>
        <button aria-label="Fechar seletor de cor" onClick={() => dialog.current?.close()}>×</button>
      </div>
      <div className="color-sample" style={{ background: `#${displayed}` }} aria-label={`Cor escolhida: #${displayed}`} />
      <div className="color-plane" tabIndex={0} role="group" aria-label="Saturação e luminosidade: use as setas para ajustar" autoFocus
        style={{backgroundColor:`hsl(${hue} 100% 50%)`}}
        onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);pick(event);}}
        onPointerUp={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId)){pick(event);event.currentTarget.releasePointerCapture(event.pointerId);}}}
        onPointerCancel={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
        onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))pick(event);}}
        onKeyDown={event=>{
          const steps: Record<string,[number,number]>={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,.02],ArrowDown:[0,-.02]};
          const step=steps[event.key];if(step){event.preventDefault();setDraft(hsvToHex(hue,saturation+step[0],value+step[1]));}
        }}>
        <span className="color-cursor" style={{left:`${saturation*100}%`,top:`${(1-value)*100}%`}}/>
      </div>
      <label className="hue-control">Tonalidade
        <input type="range" min={0} max={360} value={hue} onChange={event=>{const h=Number(event.target.value);setHue(h);setDraft(hsvToHex(h,saturation,value));}}/>
      </label>
      <label className="custom-hex">Hexadecimal
        <input value={draft.toUpperCase()} maxLength={6} spellCheck={false} aria-invalid={!valid}
          aria-describedby={!valid ? 'custom-color-error' : undefined} onChange={event => {setDraft(event.target.value);if(isHex(event.target.value))setHue(hexToHsv(event.target.value).h);}} />
      </label>
      {!valid && <p id="custom-color-error" className="error">Use seis caracteres: 0–9 e A–F.</p>}
      <p className="hint">Escolha a cor aqui e aplique no teclado pelo painel.</p>
      <div className="color-actions">
        <button onClick={() => dialog.current?.close()}>Cancelar</button>
        <button className="primary" disabled={!valid} onClick={() => { const selected=latestDraft.current;if(!isHex(selected))return;onChange(selected.toLowerCase()); dialog.current?.close(); }}>Usar cor</button>
      </div>
    </dialog>
  </>;
}
