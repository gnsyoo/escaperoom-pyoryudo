import {chromium} from './browser.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const b=await chromium.launch({headless:true}),results=[];
try{
for(const viewport of [{width:320,height:640},{width:360,height:780},{width:390,height:844},{width:1440,height:900}]){
 const p=await b.newPage({viewport});p.setDefaultTimeout(5000);
 for(const screen of ['explore','inventory','puzzle-code','puzzle-valves','map','settings']){
 await p.goto('http://127.0.0.1:5173/ui-preview.html?screen='+screen+(viewport.width<600?'&focus=1':''));await p.locator('.game-shell').waitFor();await p.evaluate(()=>document.fonts.ready);
 const problems=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.8||r.height<43.8);}).map(e=>({text:e.textContent,rect:{w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}})),broken:[...document.images].filter(im=>im.complete&&!im.naturalWidth).map(im=>im.src)}));
 assert.equal(problems.overflow,false,viewport.width+' '+screen+' overflow');assert.deepEqual(problems.small,[],viewport.width+' '+screen+' small targets');assert.deepEqual(problems.broken,[]);
 if(screen==='explore'){const r=await p.locator('.scene-image-space').boundingBox();assert.ok(Math.abs(r.height/r.width-1.2)<.01);}
 results.push({viewport,screen,status:'passed'});
 }await p.close();
}
const p=await b.newPage({viewport:{width:360,height:780}});p.setDefaultTimeout(5000);const btn=name=>p.getByRole('button',{name,exact:true});const d=()=>p.getByRole('dialog');
await p.goto('http://127.0.0.1:5173/');await btn('새로운 기억').click();while(await btn('다음 대사').count())await btn('다음 대사').click();
await p.locator('.hotspot[aria-label="손목의 결박"]').click();await d().getByRole('button',{name:'닫기'}).click();await p.waitForFunction(()=>document.querySelector('.save-status')?.textContent==='자동 저장됨');
await btn('메뉴').click();await d().getByRole('button',{name:'저장 · 불러오기'}).click();await p.locator('.save-slot').nth(1).getByRole('button',{name:'저장',exact:true}).click();await d().getByRole('status').waitFor();
await p.locator('.save-slot').nth(1).getByRole('button',{name:'저장',exact:true}).click();await d().getByRole('button',{name:'확인',exact:true}).click();await d().getByRole('status').waitFor();await d().getByRole('button',{name:'닫기'}).click();
await p.locator('.hotspot[aria-label="의자 버팀대"]').click();for(let i=0;i<3;i++)await p.getByRole('button',{name:/왼쪽으로 체중 싣기/}).click();await p.waitForFunction(()=>document.querySelector('.objective>small')?.textContent==='8%');
await btn('메뉴').click();await d().getByRole('button',{name:'저장 · 불러오기'}).click();await p.locator('.save-slot').nth(1).getByRole('button',{name:'불러오기',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.objective>small')?.textContent==='4%');
const slots=await p.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('pyoryudo-saves',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});const get=id=>new Promise(resolve=>{const r=db.transaction('slots','readonly').objectStore('slots').get(id);r.onsuccess=()=>resolve(r.result);});const values=await Promise.all(['slot1','slot1.backup'].map(get));db.close();return values.map(v=>({id:v.id,generation:v.generation,completed:v.state.completedPuzzleIds.length}));});
assert.deepEqual(slots,[{id:'slot1',generation:2,completed:1},{id:'slot1.backup',generation:1,completed:1}]);
writeFileSync('test-results/layout-and-save.json',JSON.stringify({status:'passed',layout:results,manualSave:slots,restoredPercent:4},null,2));console.log('LAYOUT AND MANUAL SAVE OK',results.length);await p.close();
}finally{await b.close();}
