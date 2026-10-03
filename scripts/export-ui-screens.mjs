import { chromium } from '../tests/e2e/browser.mjs';
import { mkdirSync,readFileSync,writeFileSync } from 'node:fs';
const out='art/ui-screens/v02';mkdirSync(out,{recursive:true});
const examples=[...readFileSync('src/ui-preview.tsx','utf8').matchAll(/\{id:'([^']+)',label:'([^']+)',description:'([^']+)'/g)].map(m=>({id:m[1],label:m[2],description:m[3]}));
const errors=[],responses=[];const b=await chromium.launch({headless:true});
try{const p=await b.newPage({viewport:{width:360,height:780},deviceScaleFactor:3});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)responses.push(r.status()+' '+r.url());});
for(let i=0;i<examples.length;i++){
 const e=examples[i];await p.goto('http://127.0.0.1:5173/ui-preview.html?screen='+e.id+'&focus=1');await p.locator('.game-shell').waitFor();
 await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode()));});await p.waitForTimeout(100);await p.evaluate(()=>document.activeElement?.blur());
 if(e.id==='hint')await p.getByRole('button',{name:'첫 힌트 듣기'}).click();
 e.file=String(i+1).padStart(2,'0')+'_'+e.id+'_1080x2340_v02.png';e.width=1080;e.height=2340;
 await p.screenshot({path:out+'/'+e.file});
 console.log('SAVED',e.id);
}

writeFileSync(out+'/manifest.json',JSON.stringify({version:'v02',font:'Pretendard Variable 1.3.9',viewport:{width:360,height:780},deviceScaleFactor:3,render:'Actual React UI in Chrome',screens:examples},null,2)+'\n');
console.log('UI SCREENS OK',examples.length);
}finally{await b.close();}
