import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(repo, 'art/production/v01');
const planFile=existsSync(resolve(root,'asset-plan-final.json'))?'asset-plan-final.json':'asset-plan.json';
const plan = JSON.parse(readFileSync(resolve(root, planFile), 'utf8'));
const xml = s => String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const put = (path, content) => { const p=resolve(root,path); mkdirSync(dirname(p),{recursive:true}); writeFileSync(p,content,'utf8'); };
const svg = (body,w=64,h=64) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;
mkdirSync(resolve(root,'fonts'),{recursive:true});
for(const file of ['PretendardVariable.woff2','OFL.txt'])copyFileSync(resolve(repo,'public/fonts',file),resolve(root,'fonts',file));
const ink = '#E9ECEF', accent='#D8AE62';
const strokes = body => `<g fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
const p=d=>`<path d="${d}"/>`;
const icons={
 inventory:'<rect x="14" y="19" width="36" height="35" rx="7"/><path d="M23 19v-4a9 9 0 0 1 18 0v4M14 32h36M25 32v8h14v-8"/>',
 map:p('M8 15l16-5 16 7 16-5v38l-16 5-16-7-16 5zM24 10v38M40 17v38'),
 notebook:'<rect x="17" y="8" width="36" height="48" rx="5"/>'+p('M11 16h12M11 27h12M11 38h12M11 49h12M31 22h14M31 32h14M31 42h9'),
 hint:'<path d="M23 41h18c0-8 8-9 8-20a17 17 0 0 0-34 0c0 11 8 12 8 20zM23 47h18M26 54h12M32 13v15M26 22l6 6 6-6"/>',
 menu:p('M12 17h40M12 32h40M12 47h40'),
 close:p('M17 17l30 30M47 17L17 47'),
 next:p('M24 12l20 20-20 20'),
 back:p('M40 12L20 32l20 20'),
 combine:'<circle cx="19" cy="22" r="10"/><circle cx="45" cy="22" r="10"/>'+p('M19 32v9l13 11 13-11v-9M25 51h14'),
 inspect:'<circle cx="27" cy="27" r="17"/>'+p('M40 40l14 14M27 19v16M19 27h16'),
 use:p('M12 46l13-13M15 17a13 13 0 0 0 17 17l20-20-8-8-20 20a13 13 0 0 0-17-17l9 9-8 8-9-9M8 50l6 6'),
 save:'<path d="M10 10h36l8 8v36H10zM20 10v15h24V10M20 38h24v16M36 14v7"/>',
 load:p('M13 32V10h29l10 10v34H29M42 10v12h10M6 43h30M27 34l9 9-9 9'),
 settings:'<path d="M25 8h14l2 9 8 4 8-3 5 12-7 6-1 9 5 7-10 8-8-4-9 1-5 6-12-6 2-9-5-7-9-1V27l9-2 5-8z" transform="translate(1 -3) scale(.9)"/><circle cx="32" cy="32" r="9"/>',
 volume:p('M9 25h10l14-12v38L19 39H9zM42 23a14 14 0 0 1 0 18M49 15a24 24 0 0 1 0 34'),
 muted:p('M9 25h10l14-12v38L19 39H9zM43 25l12 14M55 25L43 39'),
 lock:'<rect x="14" y="28" width="36" height="27" rx="5"/><path d="M22 28V18a10 10 0 0 1 20 0v10M32 38v7"/>',
 unlock:'<rect x="14" y="28" width="36" height="27" rx="5"/><path d="M22 28V18a10 10 0 0 1 20 0M32 38v7"/>',
 camera:'<rect x="8" y="19" width="48" height="34" rx="6"/><path d="M20 19l4-8h16l4 8"/><circle cx="32" cy="35" r="10"/>',
 speaker:'<path d="M10 26h10l22-13v38L20 38H10zM20 38l5 15h9M48 23a13 13 0 0 1 0 18"/>',
 tide:'<circle cx="32" cy="28" r="20"/><path d="M32 12v16l10 7M8 53q6-7 12 0t12 0t12 0t12 0"/>',
 wave:p('M7 24q6-8 12 0t12 0t12 0t12 0M7 35q6-8 12 0t12 0t12 0t12 0M7 46q6-8 12 0t12 0t12 0t12 0'),
 lighthouse:p('M21 54l5-33h12l5 33M18 54h28M23 21h18V11H23zM21 11l11-7 11 7M28 31h8M27 40h10M9 17l8-4M47 13l8 4'),
 boat:p('M9 37h46l-8 14H19zM32 9v28M32 12l19 18H32M28 16L15 30h13M8 56q6-5 12 0t12 0t12 0t12 0'),
 star:p('M32 7l7 16 18 2-14 12 4 18-15-9-15 9 4-18L7 25l18-2z'),
 check:p('M12 33l13 13 28-30'),
 warning:'<path d="M32 8L5 55h54zM32 24v14"/><circle cx="32" cy="46" r="1"/>',
 eye:'<path d="M5 32q27-34 54 0-27 34-54 0z"/><circle cx="32" cy="32" r="9"/>',
 clock:'<circle cx="32" cy="32" r="24"/>'+p('M32 16v16l13 8'),
 reset:p('M12 22a23 23 0 1 1-1 23M12 9v14h14'),
 document:'<path d="M16 7h24l12 12v38H16zM40 7v14h12M24 30h20M24 39h20M24 48h14"/>',
 key:'<circle cx="21" cy="22" r="13"/>'+p('M30 32l22 22M40 42l7-7M46 48l7-7'),
 power:'<path d="M32 6v24M20 12a23 23 0 1 0 24 0"/>',
 filter:p('M9 15h46M9 32h46M9 49h46')+'<circle cx="24" cy="15" r="5" fill="#202C36"/><circle cx="43" cy="32" r="5" fill="#202C36"/><circle cx="21" cy="49" r="5" fill="#202C36"/>'
};
for(const [name,body] of Object.entries(icons))put(`ui/icons/${name}.svg`,svg(strokes(body)));
const component=(w,h,fill,stroke= '#4B5C69',r=12)=>svg(`<rect x="1" y="1" width="${w-2}" height="${h-2}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,w,h);
for(const [name,fill,stroke]of [['default','#202C36','#4B5C69'],['pressed','#34434B',accent],['selected',accent,accent],['disabled','#151D25','#34404A']])put(`ui/components/button_${name}.svg`,component(320,56,fill,stroke));
for(const [name,fill,stroke]of [['default','#202C36','#4B5C69'],['selected','#34434B',accent],['empty','#151D25','#34404A']])put(`ui/components/slot_${name}.svg`,component(96,96,fill,stroke));
put('ui/components/dialogue_panel.svg',component(720,280,'#151D25','#4B5C69',20));
put('ui/components/modal_panel.svg',component(720,980,'#151D25','#4B5C69',24));
put('ui/components/header_panel.svg',component(720,80,'#151D25','#4B5C69',0));
put('ui/components/map_marker_current.svg',svg(`<circle cx="32" cy="32" r="26" fill="#202C36" stroke="${accent}" stroke-width="4"/><circle cx="32" cy="32" r="10" fill="${accent}"/>`));
put('ui/components/map_marker_locked.svg',svg('<circle cx="32" cy="32" r="26" fill="#202C36" stroke="#4B5C69" stroke-width="3"/>'+strokes(icons.lock)));
if(existsSync(resolve(repo,'public/app-icon.svg')))put('ui/components/app_icon.svg',readFileSync(resolve(repo,'public/app-icon.svg'),'utf8'));

const paperText=(lines,w=800,h=600)=>svg(`<g font-family="Pretendard Variable, Pretendard, sans-serif" fill="#34434B" font-size="32">${lines.map((l,i)=>`<text x="45" y="${72+i*52}">${xml(l)}</text>`).join('')}</g>`,w,h);
put('overlays/ch01/note_a_text.svg',paperText(['높은 칸부터 낮은 칸까지.','앞에 적힌 숫자만.']));
for(const [i,n]of [4,1,7].entries())put(`overlays/ch01/shelf_label_${i+1}.svg`,svg(`<rect width="160" height="56" rx="4" fill="#DDD5C4"/><text x="80" y="41" text-anchor="middle" font-family="Pretendard Variable, Pretendard, sans-serif" font-weight="700" font-size="40" fill="#34434B">${n}</text>`,160,56));
const circuitBody=`<g font-family="Pretendard Variable, Pretendard, sans-serif" fill="#34434B" font-size="26"><text x="40" y="58">설비 회로도</text><text x="40" y="108">주차단기 OFF 확인 → F2 예비 퓨즈</text><text x="40" y="148">커버 정리 → 주차단기 ON</text><text x="98" y="285">F1 통신 예비</text><text x="425" y="285">F2 관리실 조명·문 잠금</text></g><g fill="none" stroke="#526B65" stroke-width="6"><path d="M360 185v40H180v120h180M360 225h230v120H360v100"/><rect x="120" y="302" width="120" height="42"/><rect x="528" y="302" width="120" height="42"/></g><path d="M35 380h730" stroke="#879286" stroke-width="2" stroke-dasharray="12 10"/>`;
put('overlays/ch01/circuit_plan.svg',svg(circuitBody,800,520));
put('overlays/ch01/circuit_top.svg',svg(`<defs><clipPath id="half"><rect width="800" height="380"/></clipPath></defs><g clip-path="url(#half)">${circuitBody}</g>`,800,520));
put('overlays/ch01/circuit_bottom.svg',svg(`<defs><clipPath id="half"><rect y="380" width="800" height="140"/></clipPath></defs><g clip-path="url(#half)">${circuitBody}</g>`,800,520));
let cal='<g font-family="Pretendard Variable, Pretendard, sans-serif" fill="#34434B">';
for(let d=1;d<=31;d++){const x=45+((d-1)%7)*88,y=100+Math.floor((d-1)/7)*82;cal+=`<rect x="${x}" y="${y-36}" width="80" height="72" fill="none" stroke="#A7AA9D"/><text x="${x+40}" y="${y}" text-anchor="middle" font-size="28">${d}</text>`;if(d===12)cal+=`<circle cx="${x+40}" cy="${y-10}" r="25" fill="none" stroke="#B6773C" stroke-width="3"/>`;}
cal+='<text x="45" y="525" font-size="32">12일 — 기계 점검</text></g>';
put('overlays/ch01/calendar.svg',svg(cal,720,600));
put('overlays/ch01/duty_roster.svg',paperText(['근무표','점검일 12일','담당 3조'],500,400));
put('overlays/ch01/maintenance_rule.svg',paperText(['점검일 DD + 근무조 N'],720,120));
put('overlays/ch01/drain_procedure.svg',paperText(['바다 유입 닫기','저수 연결 닫기','배출 열기','마지막에 구동'],650,330));
// The cipher symbols are deliberately scattered; reading order is a separate engraved clue.
const positions={wave:[170,260],lighthouse:[570,125],boat:[570,260],star:[170,125]};
const plateBase='<g font-family="Pretendard Variable, Pretendard, sans-serif" fill="#403E36" font-size="28"><text x="400" y="52" text-anchor="middle">빛 아래에서 표식을 잇는다</text><text x="400" y="372" text-anchor="middle">파도 → 등대 → 배 → 별</text></g>';
let symbols='';for(const [name,[x,y]] of Object.entries(positions))symbols+=`<g transform="translate(${x-32} ${y-32})" fill="none" stroke="#554E3D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</g>`;
put('overlays/ch01/plate_engraving.svg',svg(plateBase+symbols,800,420));
const numbers={wave:2,lighthouse:6,boat:4,star:1};
put('overlays/ch01/plate_uv_numbers.svg',svg(Object.entries(positions).map(([k,[x,y]])=>`<text x="${x+60}" y="${y+14}" font-family="Pretendard Variable, Pretendard, sans-serif" font-size="42" font-weight="700" fill="#906BCB">${numbers[k]}</text>`).join(''),800,420));
put('overlays/ch01/fuse_labels.svg',paperText(['F1 — 통신 예비','F2 — 관리실 조명·문 잠금'],800,220));
put('overlays/ch01/valve_labels.svg',paperText(['바다 유입     저수 연결     배출'],800,120));
put('overlays/general/memory_frame.svg',svg('<rect x="12" y="12" width="696" height="836" rx="16" fill="none" stroke="#D8AE62" stroke-width="3" stroke-dasharray="18 12"/>',720,860));

const require=createRequire(import.meta.url);
let PNG;
try{PNG=require('pngjs').PNG;}catch{try{PNG=require('C:/Users/gnsyo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs').PNG;}catch{PNG=null;}}
function pngInfo(path,checkAlpha=false){
 const bytes=readFileSync(path);if(bytes.subarray(1,4).toString()!=='PNG')throw new Error(`Not PNG: ${path}`);
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),colorType=bytes[25];
 const out={width,height,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),colorType};
 if(checkAlpha&&PNG){const img=PNG.sync.read(bytes);let zero=0,partial=0,minX=width,minY=height,maxX=-1,maxY=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const alpha=img.data[(y*width+x)*4+3];if(alpha===0)zero++;else{if(alpha<255)partial++;if(alpha>=8){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}}
  out.alpha={verified:zero/(width*height)>.005&&maxX>=0,transparentPixels:zero,partialPixels:partial,contentRect:maxX<0?null:{x:minX/width,y:minY/height,w:(maxX-minX+1)/width,h:(maxY-minY+1)/height}};
 }else if(checkAlpha)out.alpha={verified:false,reason:'PNG decoder not available; verify separately'};
 return out;
}
const assets=plan.assets.map(a=>{const full=resolve(root,a.path);return {...a,prompt:undefined,exists:existsSync(full),...(existsSync(full)?pngInfo(full,a.transparent):{}),promptRef:`${planFile}#${a.id}`};});
const vectors=[];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const full=resolve(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.svg')){const path=relative(root,full).replaceAll('\\','/');vectors.push({id:path.replace(/\.svg$/,'').replaceAll('/','_'),path,label:entry.name,category:path.startsWith('ui/')?'ui':'overlay',chapter:'ALL',exists:true,format:'svg',bytes:statSync(full).size});}}}
walk(resolve(root,'ui'));walk(resolve(root,'overlays'));
const generated=assets.filter(a=>a.exists);const missing=assets.filter(a=>!a.exists).map(a=>a.id);
const alphaFailures=assets.filter(a=>a.exists&&a.transparent&&!a.alpha?.verified).map(a=>a.id);
const manifest={schemaVersion:1,version:'v01',toolMode:'built-in image_gen; original hand-authored SVG UI and exact clue overlays',sourcePolicy:'PNG originals preserved, actual dimensions recorded; use contain, never invent source resolution',counts:{plannedRaster:assets.length,generatedRaster:generated.length,svg:vectors.length},missing,alphaFailures,assets:[...assets,...vectors]};
put('manifest.json',JSON.stringify(manifest,null,2)+'\n');
put('ASSET_INDEX.md','# 표류도 그래픽 리소스 목록\n\n이미지 생성: 내장 image_gen. SVG: 직접 제작한 UI와 정확한 단서 레이어. 원본은 변환 없이 보존했다.\n\n'+`PNG ${generated.length}/${assets.length}장, SVG ${vectors.length}개.\n\n`+'| ID | 용도 | 파일 | 실제 크기 | 연결 검토 |\n| --- | --- | --- | --- | --- |\n'+manifest.assets.filter(a=>a.exists).map(a=>`| ${a.id} | ${a.label} | [파일](${a.path}) | ${a.width?`${a.width}×${a.height}`:'SVG'} | ${a.status||'vector-ready'} |`).join('\n')+'\n');
const safeJson=JSON.stringify(manifest.assets.filter(a=>a.exists)).replaceAll('<','\\u003c');
put('gallery.html',`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>표류도 그래픽 라이브러리</title><style>
@font-face{font-family:"Pretendard Variable";font-weight:45 920;src:url("fonts/PretendardVariable.woff2") format("woff2")}*{box-sizing:border-box}body{margin:0;background:#E8E5DC;color:#293B40;font:16px/1.6 "Pretendard Variable",Pretendard,system-ui,sans-serif}header{padding:36px 5vw;background:#24383D;color:#F0EFE6}h1{margin:0;font-size:30px}header p{margin:6px 0;max-width:900px}.bar{position:sticky;top:0;z-index:2;background:#F4F1E9;padding:14px 5vw;display:flex;flex-wrap:wrap;gap:10px;border-bottom:1px solid #BCC4BA}input,select,button{min-height:44px;border:1px solid #A7B4AC;border-radius:8px;padding:8px 12px;font:inherit;background:#fff;color:#24383D}input{flex:1;min-width:180px}main{padding:24px 5vw;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:22px}.card{background:#F8F7F1;border:1px solid #CAD0C5;border-radius:14px;overflow:hidden;box-shadow:0 3px 12px #24383D0D}.visual{height:280px;background:repeating-conic-gradient(#D1D5CF 0 25%,#E6E7E0 0 50%) 0/20px 20px;display:grid;place-items:center;padding:10px}.visual.dark{background:#24383D}.visual img{max-width:100%;max-height:100%;object-fit:contain}.card .info{padding:14px}.card h2{font-size:17px;margin:0 0 5px}.meta{font-size:12px;color:#536B68;overflow-wrap:anywhere}.card button{margin-top:10px;width:100%}dialog{width:min(95vw,1100px);max-height:94vh;border:0;border-radius:16px;padding:22px;background:#F8F7F1;color:#24383D}dialog::backdrop{background:#17282ADD}.viewer{height:min(70vh,820px);display:flex;justify-content:center;background:repeating-conic-gradient(#D1D5CF 0 25%,#E6E7E0 0 50%) 0/24px 24px}.viewer img{max-width:100%;max-height:100%;object-fit:contain}dialog h2{font-size:20px;margin:0 0 8px}.details{font:13px/1.6 "Pretendard Variable",Pretendard,system-ui;white-space:pre-wrap;overflow-wrap:anywhere}.dialogbar{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}a{color:#42675B}footer{padding:20px 5vw}#counter{align-self:center;font-size:14px}.empty{grid-column:1/-1}
</style><header><h1>표류도 · 그래픽 라이브러리</h1><p>승인된 낮빛과 적당한 사용 흔적. 배경, 투명 아이템, 인물 표정, 퍼즐 확대 화면과 UI.</p><p>클릭하면 원본을 확인할 수 있습니다. 미래 챕터와 엔딩 이미지에는 제작용 스포일러가 있습니다.</p></header><section class="bar"><input id="search" aria-label="이미지 검색" placeholder="이름 또는 ID 검색"><select id="category" aria-label="종류"><option value="">모든 종류</option>${[...new Set(manifest.assets.map(a=>a.category))].map(c=>`<option>${c}</option>`).join('')}</select><select id="chapter" aria-label="챕터"><option value="">모든 챕터</option>${[...new Set(manifest.assets.map(a=>a.chapter))].map(c=>`<option>${c}</option>`).join('')}</select><span id="counter"></span></section><main id="grid"></main><footer>PNG 원본과 SVG 개별 파일은 이 HTML과 같은 폴더 아래에 저장되어 있습니다.</footer><dialog id="detail"><h2 id="heading"></h2><div class="viewer"><img id="full" alt=""></div><div class="dialogbar"><a id="link" target="_blank" rel="noopener">원본 파일 열기</a><button id="copy">경로 복사</button><button id="dismiss">닫기</button></div><div class="details" id="details"></div></dialog><script>
const assets=${safeJson};const grid=document.getElementById('grid'),search=document.getElementById('search'),cat=document.getElementById('category'),chapter=document.getElementById('chapter'),detail=document.getElementById('detail');let current;
function render(){const q=search.value.toLowerCase();const shown=assets.filter(a=>(!cat.value||a.category===cat.value)&&(!chapter.value||a.chapter===chapter.value)&&(a.label+' '+a.id).toLowerCase().includes(q));grid.replaceChildren();document.getElementById('counter').textContent=shown.length+'개';for(const a of shown){const card=document.createElement('article');card.className='card';const v=document.createElement('div');v.className='visual'+(a.category==='ui'?' dark':'');const img=new Image();img.loading='lazy';img.src=a.path;img.alt=a.label;v.append(img);const info=document.createElement('div');info.className='info';const h=document.createElement('h2');h.textContent=a.label;const m=document.createElement('div');m.className='meta';m.textContent=a.id+' · '+a.chapter+' · '+(a.width?a.width+'×'+a.height:'SVG');const b=document.createElement('button');b.textContent='상세 보기';b.onclick=()=>openAsset(a);info.append(h,m,b);card.append(v,info);grid.append(card);}}
function openAsset(a){current=a;document.getElementById('heading').textContent=a.label;const img=document.getElementById('full');img.src=a.path;img.alt=a.label;document.getElementById('link').href=a.path;document.getElementById('details').textContent='ID: '+a.id+'\\n파일: '+a.path+'\\n크기: '+(a.width?a.width+'×'+a.height:'SVG')+'\\n용량: '+(a.bytes/1024).toFixed(1)+' KiB'+(a.alpha?'\\n투명 배경 검증: '+a.alpha.verified:'')+'\\n연결 상태: '+(a.status||'vector-ready');detail.showModal();}
for(const el of [search,cat,chapter])el.addEventListener('input',render);document.getElementById('dismiss').onclick=()=>detail.close();document.getElementById('copy').onclick=async()=>{try{await navigator.clipboard.writeText(current.path);document.getElementById('copy').textContent='복사됨';}catch{document.getElementById('copy').textContent=current.path;}};detail.addEventListener('close',()=>{document.getElementById('full').removeAttribute('src');document.getElementById('copy').textContent='경로 복사';});render();
</script></html>`);
console.log(JSON.stringify({counts:manifest.counts,missing:missing.length,alphaFailures},null,2));
if(process.argv.includes('--verify-complete')&&(missing.length||alphaFailures.length))process.exitCode=1;
