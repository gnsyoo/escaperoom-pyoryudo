import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { has, itemNames, owns, prerequisitesMet, puzzles, recordStatus, viewDef } from './domain/game.ts';
import type { GameState, Puzzle, Result } from './domain/game.ts';
import { itemAsset, sceneAsset } from './content/art.ts';
import Doc, { BeamPlan } from './content/Doc.tsx';
import { Icon } from './App.tsx';

export type TimerMode = 'standard'|'relaxed'|'off';
type Props = { game:GameState; hotspot:string; perform:(id:string,answer:unknown,keepModal?:boolean)=>Result; ping:(success?:boolean)=>void; close:()=>void; timerMode:TimerMode };

// Zooms into the current background around the hotspot instead of needing a separate close-up painting.
function zoomStyle(src:string,rect:{x:number;y:number;w:number;h:number}):CSSProperties {
  const ratio=1145/1374*3/4;
  let cw=Math.min(1,Math.max(rect.w*1.5,rect.h*1.5/ratio,.36)),ch=cw*ratio;
  if(ch>1){ch=1;cw=1/ratio;}
  const cx=Math.min(1-cw/2,Math.max(cw/2,rect.x+rect.w/2)),cy=Math.min(1-ch/2,Math.max(ch/2,rect.y+rect.h/2));
  const left=cx-cw/2,top=cy-ch/2;
  return {backgroundImage:`url("${src}")`,backgroundSize:`${100/cw}% ${100/ch}%`,backgroundPosition:`${cw>=1?0:left/(1-cw)*100}% ${ch>=1?0:top/(1-ch)*100}%`};
}

export default function SeasonPanel({game,hotspot,perform,ping,close,timerMode}:Props){
  const view=viewDef(game.sceneId,game.viewId);
  const h=view?.hotspots.find(x=>x.id===hotspot);
  if(!view||!h)return <p className="body-copy">이곳에서는 더 살펴볼 것이 없다.</p>;
  const here=puzzles.filter(p=>p.location.sceneId===game.sceneId&&p.location.viewId===game.viewId&&p.location.hotspotId===hotspot);
  const active=here.find(p=>!has(game,p.id)&&prerequisitesMet(game,p));
  const blocked=here.find(p=>!has(game,p.id)&&!prerequisitesMet(game,p));
  const done=here.filter(p=>has(game,p.id));
  let caption=h.caption||'';
  for(const a of h.after||[])if(has(game,a.id))caption=a.text;
  const clueDocs=done.flatMap(p=>[...(p.effects.clues||[]),...p.effects.grantEvidence]).filter((id,i,list)=>list.indexOf(id)===i);
  function run(p:Puzzle,answer:unknown){
    const r=perform(p.id,answer,true);
    if(r.status==='success'&&(p.effects.transition||p.effects.completeChapter||r.state.dialogueQueue.length))close();
    return r;
  }
  return <>
    <div className="zoom-view" style={zoomStyle(sceneAsset(game),h.rect)} role="img" aria-label={h.name+' 확대'}/>
    {caption&&<p className="body-copy">{caption}</p>}
    {clueDocs.map(id=><Doc key={id} id={id}/>)}
    {active?<PuzzleControls key={active.id} p={active} game={game} run={run} ping={ping} timerMode={timerMode}/>:
      blocked?<p className="tip"><Icon name="lock"/>{blocked.failText}</p>:
      done.length?<p className="tip"><Icon name="check"/>{done[done.length-1].repeatText}</p>:null}
  </>;
}

function PuzzleControls({p,game,run,ping,timerMode}:{p:Puzzle;game:GameState;run:(p:Puzzle,answer:unknown)=>Result;ping:(s?:boolean)=>void;timerMode:TimerMode}){
  const ui=p.ui||{};
  const [code,setCode]=useState('');
  const [dials,setDials]=useState<string[]>(()=>(ui.dials||[]).map(d=>d.initial));
  const [seq,setSeq]=useState<string[]>([]);
  const [count,setCount]=useState(0);
  const docs=(ui.docs||[]).map(id=><Doc key={id} id={id}/>);
  if(p.mode==='inspect')return <>{docs}<button className="primary full" onClick={()=>run(p,true)}>{ui.button||'조사한다'} <Icon name="inspect"/></button></>;
  if(p.mode==='move')return <>{docs}<button className="primary full" onClick={()=>run(p,true)}>{ui.button||'이동한다'} <Icon name="next"/></button></>;
  if(p.mode==='use'){
    const item=p.requiresItems[0];
    return owns(game,item)?<button className="primary full" onClick={()=>run(p,{itemId:item,targetId:p.location.hotspotId})}><img className="button-item" src={itemAsset(item)} alt=""/>{ui.button||itemNames[item]+' 사용'}</button>:
      <p className="tip"><Icon name="inventory"/>{ui.need||p.failText}</p>;
  }
  if(p.requiresItems.some(id=>!owns(game,id)))return <p className="tip"><Icon name="inventory"/>{ui.need||p.failText}</p>;
  if(p.mode==='code'){
    const length=ui.length||4,letters=ui.charset==='letters';
    const keys=letters?[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ','←','지우기']:['1','2','3','4','5','6','7','8','9','←','0','지우기'];
    return <>{docs}<div className="keypad"><div className="code-display" aria-label={'입력 '+code}><span>{code.padEnd(length,'—').split('').join('  ')}</span><small>{ui.prompt||length+'자리'}</small></div>
      <div className={'keypad-grid'+(letters?' letters':'')}>{keys.map(n=><button key={n} onClick={()=>{setCode(v=>n==='지우기'?'':n==='←'?v.slice(0,-1):v.length<length?v+n:v);ping();}} aria-label={n==='←'?'한 자리 지우기':n}>{n}</button>)}</div>
      <button className="primary full" disabled={code.length!==length} onClick={()=>{const r=run(p,code);if(r.status!=='success')setCode('');}}>{ui.button||'잠금 해제'} <Icon name="unlock"/></button></div></>;
  }
  if(p.mode==='dials')return <>{docs}
    {ui.preview==='beam'&&<BeamPlan dirs={dials}/>}
    <div className="dial-list">{(ui.dials||[]).map((d,i)=>{const idx=d.options.findIndex(o=>o.id===dials[i]);const turn=(step:number)=>{setDials(v=>v.map((x,j)=>j===i?d.options[(idx+step+d.options.length)%d.options.length].id:x));ping();};
      return <div className="dial-row" key={d.label}><span>{d.label}</span><div><button className="icon-button" onClick={()=>turn(-1)} aria-label={d.label+' 이전 값'}><Icon name="back"/></button><strong aria-live="polite">{d.options[idx]?.label}</strong><button className="icon-button" onClick={()=>turn(1)} aria-label={d.label+' 다음 값'}><Icon name="next"/></button></div></div>;})}</div>
    <button className="primary full" onClick={()=>run(p,dials)}>{ui.button||'확인'} <Icon name="check"/></button></>;
  if(p.mode==='sequence')return <>{docs}
    <div className="sequence-chosen" aria-live="polite">{seq.length?seq.map((id,i)=><span key={i}><b>{i+1}</b>{ui.actions?.find(a=>a.id===id)?.label}</span>):<small>아래 동작을 순서대로 누르세요.</small>}</div>
    <div className="sequence-actions">{(ui.actions||[]).map(a=><button key={a.id} className="secondary" disabled={seq.length>=8} onClick={()=>{setSeq(v=>[...v,a.id]);ping();}}>{a.label}</button>)}</div>
    <div className="two-actions"><button className="secondary" disabled={!seq.length} onClick={()=>setSeq(v=>v.slice(0,-1))}>되돌리기</button><button className="secondary" disabled={!seq.length} onClick={()=>setSeq([])}>처음부터</button></div>
    <button className="primary full" disabled={!seq.length} onClick={()=>{const r=run(p,seq);if(r.status!=='success')setSeq([]);}}>{ui.button||'실행'} <Icon name="check"/></button></>;
  if(p.mode==='choice'){
    const status=recordStatus(game);
    return <>{docs}
      {ui.status&&<div className="paper-note"><small>지금까지의 기록</small><strong>확보한 핵심 기록 {status.found} / 4</strong>{status.missing>0&&<p>미확보 기록 {status.missing}건</p>}</div>}
      <div className="choice-list">{(ui.options||[]).map(o=><button key={o.id} className="choice-option" onClick={()=>run(p,o.id)}><strong>{o.label}</strong>{o.detail&&<small>{o.detail}</small>}</button>)}</div></>;
  }
  if(p.mode==='repeat'){
    const need=ui.count||(p.expectedAnswer as number);
    return <><div className="repeat-meter" aria-label={ui.button+' '+count+'회'}>{Array.from({length:need},(_,i)=><span key={i} className={count>i?'filled':''}/>)}</div>
      <button className="primary full" onClick={()=>{const n=count+1;setCount(n);ping();if(n>=need)run(p,n);}}>{ui.button||'누르기'} <span>{count}/{need}</span></button></>;
  }
  if(p.mode==='chase')return <Chase p={p} run={run} ping={ping} timerMode={timerMode}/>;
  return null;
}

function Chase({p,run,ping,timerMode}:{p:Puzzle;run:(p:Puzzle,answer:unknown)=>Result;ping:(s?:boolean)=>void;timerMode:TimerMode}){
  const rounds=p.ui?.rounds||[],spots=p.ui?.spots||[],expected=p.expectedAnswer as string[];
  const limit=timerMode==='off'?null:timerMode==='relaxed'?40:20;
  const [round,setRound]=useState(-1);
  const [left,setLeft]=useState(limit||0);
  const [message,setMessage]=useState('');
  const [picks,setPicks]=useState<string[]>([]);
  function caught(text:string){setRound(-1);setPicks([]);setMessage(text);ping();}
  useEffect(()=>{
    if(round<0||limit===null)return;
    setLeft(limit);
    const timer=setInterval(()=>setLeft(v=>v-1),1000);
    return ()=>clearInterval(timer);
  },[round,limit]);
  useEffect(()=>{if(round>=0&&limit!==null&&left<=0)caught('머뭇거리는 사이 손전등 빛이 다가왔다. 통로 입구로 물러났다.');},[left]);
  function pick(id:string){
    if(id!==expected[round]){caught(p.failText);return;}
    const next=[...picks,id];setPicks(next);ping(true);
    if(next.length===rounds.length){setRound(-1);run(p,next);}else setRound(round+1);
  }
  if(round<0)return <>
    {message&&<p className="tip warning-tip"><Icon name="warning"/>{message}</p>}
    <p className="body-copy">출입구 너머로 손전등 빛이 오간다. 소리를 듣고 알맞은 곳에 숨어야 한다.{limit?` 소리마다 ${limit}초 안에 정해야 한다.`:''}</p>
    <button className="primary full" onClick={()=>{setMessage('');setPicks([]);setRound(0);ping();}}>숨을 고르고 움직인다 <Icon name="next"/></button></>;
  return <div className="chase">
    <div className="chase-head"><small>{round+1} / {rounds.length}</small>{limit!==null&&<b className={left<=5?'urgent':''}>{left}초</b>}</div>
    <p className="chase-cue"><Icon name="speaker"/>{rounds[round].cue}</p>
    <div className="choice-list">{spots.map(s=><button key={s.id} className="choice-option" onClick={()=>pick(s.id)}><strong>{s.label}</strong></button>)}</div>
  </div>;
}
