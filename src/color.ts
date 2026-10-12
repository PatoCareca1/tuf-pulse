export function hexToHsv(hex: string) {
  const [r,g,b] = [0,2,4].map(i => parseInt(hex.slice(i,i+2),16)/255);
  const max=Math.max(r,g,b), min=Math.min(r,g,b), delta=max-min;
  let h=0;
  if(delta) h=(max===r ? (g-b)/delta : max===g ? (b-r)/delta+2 : (r-g)/delta+4)*60;
  return {h:(h+360)%360,s:max ? delta/max : 0,v:max};
}
export function hsvToHex(h: number,s: number,v: number) {
  h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));v=Math.max(0,Math.min(1,v));
  const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
  const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('');
}
