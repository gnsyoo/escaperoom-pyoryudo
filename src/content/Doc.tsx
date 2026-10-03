import { docs } from './season.ts';
import { asset } from './art.ts';
import { chapters } from '../domain/game.ts';

// Clue text is always drawn by the UI, never baked into generated art, so numbers stay legible.
export default function Doc({id,compact=false}:{id:string;compact?:boolean}){
  const d=docs[id];
  if(!d)return null;
  return <article className={'doc doc-'+(d.kind||'paper')+(compact?' compact':'')}>
    <h4>{d.title}</h4>
    {d.intro&&<p className="doc-intro">{d.intro}</p>}
    {d.special&&<Special kind={d.special}/>}
    {d.lines&&<ul>{d.lines.map(l=><li key={l}>{l}</li>)}</ul>}
    {d.table&&<div className="doc-table-wrap"><table><thead><tr>{d.table.head.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{d.table.rows.map(r=><tr key={r.join()}>{r.map((c,i)=><td key={i}>{c}</td>)}</tr>)}</tbody></table></div>}
    {d.note&&<p className="doc-note">{d.note}</p>}
  </article>;
}

function Special({kind}:{kind:string}){
  if(kind==='class_photo')return <ClassPhoto/>;
  if(kind==='seating_chart')return <SeatingChart/>;
  if(kind==='morse')return <Morse/>;
  if(kind==='island_map')return <IslandMap/>;
  if(kind==='cctv')return <Cctv/>;
  return null;
}

function Child({x,y,scale=1}:{x:number;y:number;scale?:number}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><circle cx="0" cy="-20" r="9" fill="#5d6a5c"/><path d="M-16 4c0-12 7-17 16-17s16 5 16 17z" fill="#6f7f6c"/></g>;
}
function Desk({x,y,scale=1,empty}:{x:number;y:number;scale?:number;empty?:boolean}){
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>{!empty&&<Child x={0} y={0}/>}<rect x="-24" y="2" width="48" height="12" rx="2" fill="#b28c5c"/><rect x="-20" y="14" width="3" height="12" fill="#7d6444"/><rect x="17" y="14" width="3" height="12" fill="#7d6444"/>{empty&&<text x="0" y="-6" textAnchor="middle" fontSize="9" fill="#8a7a5a">빈자리</text>}</g>;
}
// Taken from the chalkboard: windows appear on the right and left/right are mirrored against the seating chart.
function ClassPhoto(){
  return <svg className="doc-figure photo" viewBox="0 0 300 190" role="img" aria-label="교탁 앞에서 찍은 학급 사진. 뒷줄 왼쪽과 오른쪽, 앞줄 왼쪽이 비어 있다.">
    <rect width="300" height="190" fill="#e8dfc8"/><rect x="8" y="8" width="284" height="174" fill="#d9d2bd" stroke="#b7aa86"/>
    <rect x="248" y="18" width="36" height="110" fill="#cfe0e4" stroke="#9fb4b8"/><path d="M266 18v110M248 72h36" stroke="#9fb4b8"/><text x="266" y="142" textAnchor="middle" fontSize="9" fill="#6d6a55">창문</text>
    <text x="22" y="26" fontSize="9" fill="#6d6a55">뒷줄</text><text x="22" y="118" fontSize="9" fill="#6d6a55">앞줄</text>
    <Desk x={70} y={70} scale={0.8} empty/><Desk x={135} y={70} scale={0.8}/><Desk x={200} y={70} scale={0.8} empty/>
    <Desk x={70} y={150} empty/><Desk x={140} y={150}/><Desk x={210} y={150}/>
    <text x="150" y="184" textAnchor="middle" fontSize="8" fill="#7d7660">9월 17일 아침 · 칠판 앞에서</text>
  </svg>;
}
function SeatingChart(){
  const front=['최하루','김민지','한태민'],back=['박소윤','이준호','정다은'];
  return <svg className="doc-figure" viewBox="0 0 300 200" role="img" aria-label={'자리표. 칠판 쪽 앞줄 왼쪽부터 '+front.join(', ')+'. 뒷줄 왼쪽부터 '+back.join(', ')+'. 창문은 왼쪽.'}>
    <rect width="300" height="200" fill="#f1ead6"/>
    <rect x="70" y="10" width="160" height="22" fill="#4f6656"/><text x="150" y="25" textAnchor="middle" fontSize="11" fill="#eef0e2">칠판</text>
    <rect x="8" y="40" width="12" height="120" fill="#cfe0e4" stroke="#9fb4b8"/><text x="14" y="176" textAnchor="middle" fontSize="9" fill="#6d6a55">창문</text>
    {[front,back].map((row,r)=>row.map((name,i)=><g key={name}><rect x={45+i*85} y={52+r*70} width="72" height="40" rx="4" fill="#e3d5b2" stroke="#b7a57c"/><text x={81+i*85} y={77+r*70} textAnchor="middle" fontSize="12" fill="#4b4630">{name}</text></g>))}
    <text x="150" y="194" textAnchor="middle" fontSize="9" fill="#7d7660">교실 뒤 (이 자리에서 칠판을 보고 그림)</text>
  </svg>;
}
const morse:[string,string][]=[['A','·−'],['C','−·−·'],['E','·'],['G','−−·'],['H','····'],['K','−·−'],['N','−·'],['O','−−−'],['S','···'],['T','−'],['U','··−'],['Y','−·−−']];
function Morse(){
  return <div className="morse">
    <div className="morse-signal" aria-label="반복 신호: 짧게 네 번, 짧게 길게, 길게 짧게 길게"><span className="morse-lamp" aria-hidden="true"/><b>····</b><i>/</i><b>·−</b><i>/</i><b>−·−</b></div>
    <small>단말 옆 대응표</small>
    <div className="morse-table">{morse.map(([l,c])=><span key={l}><b>{l}</b>{c}</span>)}</div>
  </div>;
}
function IslandMap(){
  return <div className="doc-map"><img src={asset('island_map')} alt="연무도 지도"/>{chapters.map(c=><span key={c.id} style={{left:c.map.x+'%',top:c.map.y+'%'}}>{c.place}</span>)}</div>;
}
function Cctv(){
  return <div className="cctv">
    <div><small>2번 카메라 · 분교 앞 확성기 기둥</small><strong>화면 시각 20:17</strong><p>확성기 경광등이 켜진다.</p></div>
    <div><small>1번 카메라 · 해안길 (표준시)</small><strong>화면 시각 19:35</strong><p>해안길에 물이 넘친다.</p></div>
    <p className="cctv-note">수첩 · 등대 중계 기록: “20:05 — 수동 방송 개시”</p>
  </div>;
}

const step:Record<string,[number,number]>={n:[0,-1],ne:[1,-1],e:[1,0],se:[1,1],s:[0,1],sw:[-1,1],w:[-1,0],nw:[-1,-1]};
const mirrors:[number,number][]=[[1,1],[3,3],[5,3]], target:[number,number]=[5,0];
export function traceBeam(dirs:string[]){
  let [x,y]=[0,1],[dx,dy]=step.e;const points:[number,number][]=[[-0.5,1]];
  for(let i=0;i<40;i++){
    x+=dx;y+=dy;
    if(x<0||x>6||y<0||y>4){points.push([x-dx/2,y-dy/2]);return {points,lit:false};}
    points.push([x,y]);
    if(x===target[0]&&y===target[1])return {points,lit:true};
    const m=mirrors.findIndex(([mx,my])=>mx===x&&my===y);
    if(m>=0)[dx,dy]=step[dirs[m]]||[0,0];
    if(dx===0&&dy===0)return {points,lit:false};
  }
  return {points,lit:false};
}
// Top-down chalk plan of the cave floor: the live beam shows where each reflector sends the light.
export function BeamPlan({dirs}:{dirs:string[]}){
  const {points,lit}=traceBeam(dirs),c=(v:number)=>20+v*40;
  return <svg className="beam-plan" viewBox="0 0 280 200" role="img" aria-label={lit?'빛이 표적에 닿았다':'빛이 표적에 닿지 않는다'}>
    <rect width="280" height="200" rx="8" fill="#5b5a4f"/>
    {Array.from({length:7},(_,i)=><line key={'v'+i} x1={c(i)} x2={c(i)} y1="20" y2="180" stroke="#ffffff14"/>)}
    {Array.from({length:5},(_,i)=><line key={'h'+i} y1={c(i)} y2={c(i)} x1="20" x2="260" stroke="#ffffff14"/>)}
    <text x="3" y={c(1)+5} fontSize="13" fill="#f1d58c">해</text>
    <polyline points={points.map(([x,y])=>c(x)+','+c(y)).join(' ')} fill="none" stroke="#f6d36b" strokeWidth="3" strokeLinejoin="round" opacity=".9"/>
    <circle cx={c(target[0])} cy={c(target[1])} r="12" fill={lit?'#f6dc8d':'#5b5a4f'} stroke="#f1e6c4" strokeWidth="2"/><circle cx={c(target[0])} cy={c(target[1])} r="4" fill={lit?'#8a5a12':'#f1e6c4'}/>
    {mirrors.map(([x,y],i)=><g key={i}><rect x={c(x)-11} y={c(y)-11} width="22" height="22" rx="11" fill="#c7cfd2" stroke="#eef3f3"/><text x={c(x)} y={c(y)+4} textAnchor="middle" fontSize="11" fill="#3b4a4d">{i+1}</text></g>)}
    <text x="140" y="196" textAnchor="middle" fontSize="9" fill="#d9d4c0">분필 평면도 · 위가 북쪽 · ◎ 표적</text>
  </svg>;
}
