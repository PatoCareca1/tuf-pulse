import { expect,it } from 'vitest';
import { hexToHsv,hsvToHex } from './color';
it('preserves colors across HSV conversion, including grayscale',()=>{
 for(const hex of ['000000','ffffff','808080','ff0000','00ff00','0000ff','4de8d1','dce6ff']){
  const {h,s,v}=hexToHsv(hex);expect(hsvToHex(h,s,v)).toBe(hex);
 }
});
it('handles hue wrap and color plane boundaries',()=>{
 expect(hsvToHex(360,1,1)).toBe('ff0000');expect(hsvToHex(120,0,1)).toBe('ffffff');expect(hsvToHex(120,1,0)).toBe('000000');
});
