import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = new URL('../', import.meta.url);
let failures=0;
function scan(dir) {
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
  const p=path.join(dir,entry.name);
  if(entry.isDirectory()) scan(p);
  else if(/\.(tsx?|css|json|html)$/.test(p)) {
   let allowed=false;
   fs.readFileSync(p,'utf8').split('\n').forEach((line,i)=>{
    if(line.includes('// @allow-devanagari')) allowed=true;
    if(!allowed && /[\u0900-\u097f]/u.test(line)) {console.log(`Devanagari: ${path.relative(root.pathname,p)}:${i+1}`);failures++;}
    if(line.includes('// @end-allow-devanagari')) allowed=false;
   });
   if(allowed) throw new Error(`Unclosed allowlist: ${p}`);
  }
 }
}
scan(fileURLToPath(new URL('../src',import.meta.url)));
scan(fileURLToPath(new URL('../public',import.meta.url)));
if(/[\u0900-\u097f]/u.test(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'))) failures++;
console.log(failures ? `${failures} lines outside the allowlist` : 'No Devanagari outside the allowlist');
if(failures) process.exitCode=1;
