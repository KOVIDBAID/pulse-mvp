import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {cwd:root, stdio:['ignore','pipe','pipe']});
let serverError = '';
server.stderr.on('data', d => {serverError += d;});
const stop = () => {if(server.exitCode === null) server.kill('SIGTERM');};
process.on('SIGINT', () => {stop(); process.exit(130);});
process.on('SIGTERM', () => {stop(); process.exit(143);});
try {
 let ready=false;
 for(let i=0;i<100;i++) {
  if(server.exitCode !== null) throw new Error(`Preview exited: ${serverError}`);
  try {const r=await fetch('http://127.0.0.1:5173/'); if(r.ok) {ready=true;break;}} catch {}
  await new Promise(r=>setTimeout(r,100));
 }
 if(!ready) throw new Error('Preview did not become ready');
 for(const name of process.argv.slice(2)) {
  if(!['sweep','clicks'].includes(name)) throw new Error(`Unknown QA script: ${name}`);
  const code=await new Promise(resolve=>spawn(process.execPath,[path.join(root,`qa/${name}.mjs`)],{cwd:root,stdio:'inherit',env:{...process.env,PULSE_QA_URL:'http://127.0.0.1:5173'}}).on('exit',resolve));
  if(code !== 0) process.exitCode=1;
 }
} catch(e) {console.error(e.message);process.exitCode=1;} finally {stop();}
