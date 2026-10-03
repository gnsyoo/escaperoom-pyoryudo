import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { advanceChapter, advanceDialogue, allDialogues, attempt, availablePuzzles, puzzles, canVisit, caveTimeout, chapterComplete, chapterIndex, chapterInfo, chapterProgress, chapters, enterCave, ending, has, inCave, isLegacyScene, itemNames, josa, leaveCave, locationChapter, moveTo, newGame, objective, owns, prerequisitesMet, readClue, recordStatus, retryFinal, revisitOpen, ticksToLow, tideNames, tidePhase, viewDef, views, waitTide } from './domain/game.ts';
import type { GameState, SceneId } from './domain/game.ts';
import { asset, descriptions, evidence, hotspotName, hotspotNames, icon, itemAsset, layers, placeName, roomNames, sceneAsset, sceneAssetId, scenes, viewName } from './content/art.ts';
import { docs, endings } from './content/season.ts';
import { getSlot, listSlots, saveSlot } from './platform/save.ts';
import type { SaveSlot } from './platform/save.ts';
import VectorArt from './content/VectorArt.tsx';
import Doc from './content/Doc.tsx';
import SeasonPanel from './SeasonPanel.tsx';
import type { TimerMode } from './SeasonPanel.tsx';

type Context = { hotspot:string; assetId?:string; puzzleId?:string };
type Modal = 'inventory'|'notebook'|'map'|'hint'|'menu'|'puzzle'|null;
type Preferences = { sound:boolean; volume:number; brightness:number; textSize:number; reduceMotion:boolean; typewriter:boolean; timer:TimerMode };
const defaults:Preferences={sound:true,volume:35,brightness:100,textSize:16,reduceMotion:false,typewriter:false,timer:'standard'};
function readPreferences():Preferences {
  try {
    const p=JSON.parse(localStorage.getItem('pyoryudo-preferences')||'{}');
    return {sound:typeof p.sound==='boolean'?p.sound:true,volume:Number.isFinite(p.volume)?Math.max(0,Math.min(100,p.volume)):35,brightness:Number.isFinite(p.brightness)?Math.max(80,Math.min(120,p.brightness)):100,textSize:[14,16,18].includes(p.textSize)?p.textSize:16,reduceMotion:typeof p.reduceMotion==='boolean'?p.reduceMotion:false,typewriter:typeof p.typewriter==='boolean'?p.typewriter:false,timer:['standard','relaxed','off'].includes(p.timer)?p.timer:'standard'};
  } catch{return defaults;}
}
function readEndings():string[] {
  try{const v=JSON.parse(localStorage.getItem('pyoryudo-endings')||'[]');return Array.isArray(v)?v.filter(x=>['T','N','B'].includes(x)):[];}catch{return [];}
}
const caveMs:Record<TimerMode,number|null>={standard:180000,relaxed:360000,off:null};
let audio:AudioContext|undefined;
function tone(volume:number,success=false){
  try{
    audio??=new AudioContext();
    void audio.resume();
    const oscillator=audio.createOscillator(),gain=audio.createGain();
    oscillator.type='sine';oscillator.frequency.setValueAtTime(success?620:390,audio.currentTime);
    if(success)oscillator.frequency.exponentialRampToValueAtTime(820,audio.currentTime+.09);
    gain.gain.setValueAtTime(0,audio.currentTime);gain.gain.linearRampToValueAtTime(volume/100*.035,audio.currentTime+.01);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.13);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.14);
  }catch{/* A browser may disallow audio; gameplay remains usable. */}
}
export function Icon({name,light=false}:{name:string;light?:boolean}){return <img className={'icon '+(light?'':'ink-icon')} src={icon(name)} alt="" aria-hidden="true"/>;}
const NoticeContext=createContext('');
function Sheet({title,subtitle,close,children}:{title:string;subtitle?:string;close:()=>void;children:ReactNode}){
  const notice=useContext(NoticeContext);
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=ref.current!;d.showModal();return ()=>d.close();},[]);
  return <dialog ref={ref} className="sheet" onCancel={e=>{e.preventDefault();close();}} aria-label={title}>
    <header className="sheet-header"><div><small>{subtitle||'표류도 · 기억의 해안'}</small><h2>{title}</h2></div><button className="icon-button" onClick={close} aria-label="닫기"><Icon name="close"/></button></header>
    <div className="sheet-scroll">{notice&&<p className="modal-notice" role="status">{notice}</p>}{children}</div>
  </dialog>;
}
const captionFor:Record<string,string>={
  binding:'손목이 단단한 끈에 묶여 있다. 의자 아래의 부서진 버팀대가 눈에 들어온다.',
  chair_brace:'왼쪽 버팀대에 금이 가 있다. 같은 쪽으로 몇 번 체중을 실으면 부러질 것 같다.',
  vent_cover:'네 모서리가 십자 나사로 고정되어 있다.',
  vent_key:'환기구 아래쪽에 작은 열쇠가 걸려 있다. 손으로는 닿지 않는다.',
  panel_cover:'배전함은 십자 나사로 고정되어 있다. 퓨즈를 넣기 전에 커버를 열자.',
  office_door:'관리실로 이어지는 문이다. 손잡이 아래에 작은 열쇠 구멍이 있다.',
  desk_plan:'책상에 회로도 아래쪽 조각이 놓여 있다. 선반에서 찾은 쪽지와 배선이 이어질 것 같다.',
  maintenance_door:'문 옆 전기 잠금장치가 켜져야 설비실에 들어갈 수 있다.',
  loading_passage:'물이 고여 있던 낮은 통로. 배수가 끝나면 적재장으로 이어진다.',
  exit_gate:'창고와 바깥을 가르는 게이트. 옆 키패드가 잠금장치에 연결되어 있다.'
};
const completion:Record<string,[string,string]>={
  CH01:['첫 번째 문이 열렸다','창고를 벗어났다.\n하지만 섬에는 아직 기억하지 못한 것이 남아 있다.'],
  CH02:['해안길이 드러났다','수조의 물이 빠지고 동굴로 가는 길이 열렸다.\n지워진 일지의 날짜가 마음에 걸린다.'],
  CH03:['바다가 닫히기 전에','중계 열쇠를 들고 동굴을 빠져나왔다.\n벽의 시각은 누군가 사람들을 데려왔다고 말한다.'],
  CH04:['등대에 불이 켜졌다','요청은 18:40에 들어왔고 19:10에 막혔다.\n섬 전체 지도가 손에 들어왔다.'],
  CH05:['마지막 출석','혜진을 구했다.\n사진 속 회색 셔츠의 남자는 나였다.'],
  CH06:['숲의 목격자','서린이 동행하기로 했다.\n원본과 수정본, 둘 다 필요하다.'],
  CH07:['응답 없는 주파수','방송 보류의 근거는 내 서명이었다.\n케이블은 감시자의 집으로 이어진다.'],
  CH08:['감시자의 방','원본을 확보했다.\n창밖에서 폭풍이 다가온다.'],
  CH09:['폭풍의 밤','발전기가 돌고 폭풍이 잦아들었다.\n새벽, 선착장으로 간다.']
};
const pad=(n:number)=>String(n).padStart(2,'0');
export type ReviewState={game:GameState;screen?:'title'|'home'|'game';modal?:Modal;context?:Context;selected?:string;combine?:string;combineSecond?:string;markers?:boolean;notebookTab?:string;evidenceDetail?:string;code?:string;valves?:{sea:string;tank:string;outlet:string}};
export default function App({review}:{review?:ReviewState}={}){
  const [game,setGame]=useState<GameState>(()=>review?.game||newGame());
  const stateRef=useRef(game);
  const [screen,setScreen]=useState<'title'|'home'|'game'>(review?.screen||'title');
  const [modal,setModal]=useState<Modal>(review?.modal||null);
  const [context,setContext]=useState<Context>(review?.context||{hotspot:''});
  const [selected,setSelected]=useState<string|null>(review?.selected||null);
  const [detail,setDetail]=useState<string|null>(review?.selected||null);
  const [combineFirst,setCombineFirst]=useState<string|null>(review?.combine||null);
  const [combineSecond,setCombineSecond]=useState<string|null>(review?.combineSecond||null);
  const [markers,setMarkers]=useState(review?.markers||false);
  const [targetList,setTargetList]=useState(false);
  const [prefs,setPrefs]=useState<Preferences>(()=>review?defaults:readPreferences());
  const [notice,setNotice]=useState('');
  const [rewards,setRewards]=useState<string[]>([]);
  const [saveStatus,setSaveStatus]=useState('');
  const [slots,setSlots]=useState<(SaveSlot|null)[]>([null,null,null,null]);
  const [autoExists,setAutoExists]=useState(!!review&&review.game.completedPuzzleIds.length>0);
  const [startupError,setStartupError]=useState('');
  const [menuTab,setMenuTab]=useState('settings');
  const [notebookTab,setNotebookTab]=useState(review?.notebookTab||'clues');
  const [evidenceDetail,setEvidenceDetail]=useState<string|null>(review?.evidenceDetail||null);
  const [code,setCode]=useState(review?.code||'');
  const [repeatCount,setRepeatCount]=useState(0);
  const [pieces,setPieces]=useState(['lower_desk','upper_a']);
  const [valves,setValves]=useState(review?.valves||{sea:'open',tank:'open',outlet:'closed'});
  const [hintId,setHintId]=useState('');
  const [hintLevel,setHintLevel]=useState(0);
  const [visibleText,setVisibleText]=useState('');
  const [confirmSlot,setConfirmSlot]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [backupSlot,setBackupSlot]=useState<string|null>(null);
  const [imageError,setImageError]=useState(false);
  const [seenEndings,setSeenEndings]=useState<string[]>(()=>review?[]:readEndings());
  const textTimer=useRef<ReturnType<typeof setInterval>|null>(null);
  const savedKey=useRef('');
  const dialogue=game.dialogueQueue[0];
  const legacy=isLegacyScene(game.sceneId);
  const chapter=chapterInfo(game.chapterId);
  const here=chapterInfo(locationChapter(game));
  const revisiting=here.id!==chapter.id;
  const endingId=ending(game);
  const showEnding=!!endingId&&!dialogue;
  const chapterDone=chapterComplete(game)&&!dialogue&&!endingId;
  const finished=chapterDone||showEnding;
  function commit(next:GameState){stateRef.current=next;setGame(next);}
  function ping(success=false){if(prefs.sound)tone(prefs.volume,success);}
  function announce(text:string){setNotice(text);setRewards([]);}
  function perform(id:string,answer:unknown,keepModal=false){
    const result=attempt(stateRef.current,id,answer);
    commit(result.state);setNotice(result.message);setRewards(result.rewards);ping(result.status==='success');
    if(result.status==='success'){
      if(selected&&!owns(result.state,selected))setSelected(null);
      if(detail&&!owns(result.state,detail))setDetail(result.rewards[0]||null);
      if(!keepModal)setModal(null);
    }
    return result;
  }
  function close(){setModal(null);setCombineFirst(null);setCombineSecond(null);setConfirmSlot(null);}
  function openModal(next:Modal){setModal(next);ping();if(next==='inventory')setDetail(selected&&owns(game,selected)?selected:Object.keys(game.inventory)[0]||null);}
  function openPuzzle(c:Context){setContext(c);setCode('');setRepeatCount(0);setPieces(['lower_desk','upper_a']);setValves({sea:'open',tank:'open',outlet:'closed'});setModal('puzzle');ping();}
  useEffect(()=>{
    if(review)return;
    getSlot('auto').then(slot=>{setAutoExists(!!slot);if(slot)commit(slot.state);}).catch(e=>setStartupError(e.message||'저장을 읽을 수 없습니다.'));
  },[review]);
  useEffect(()=>{
    if(review||screen!=='game')return;
    // The cave countdown changes every second; only real progress triggers an autosave.
    const key=JSON.stringify({...game,timer:game.timer&&{...game.timer,remainingMs:0}});
    if(key===savedKey.current)return;
    savedKey.current=key;
    setSaveStatus('저장 중');
    let active=true;
    saveSlot('auto',game).then(()=>{if(active){setSaveStatus('자동 저장됨');setAutoExists(true);}}).catch(()=>{if(active)setSaveStatus('저장 실패 · 메뉴에서 다시 저장');});
    return ()=>{active=false;};
  },[game,screen,review]);
  useEffect(()=>{
    if(review)return;
    try{localStorage.setItem('pyoryudo-preferences',JSON.stringify(prefs));}catch{announce('설정을 저장하지 못했습니다. 현재 화면에는 적용됩니다.');}
  },[prefs,review]);
  useEffect(()=>{
    if(!showEnding||review||!endingId||seenEndings.includes(endingId))return;
    const next=[...seenEndings,endingId];setSeenEndings(next);
    try{localStorage.setItem('pyoryudo-endings',JSON.stringify(next));}catch{/* the gallery is a convenience */}
  },[showEnding,endingId,review]);
  useEffect(()=>{
    setImageError(false);
    if(screen!=='game')return;
    if(legacy){
      const nearby=scenes.filter(s=>s.sceneId===game.sceneId&&s.viewId!==game.viewId);
      nearby.slice(0,2).forEach(s=>{const img=new Image();img.src=asset(s.baseAssetId);});
    } else {
      chapterInfo(locationChapter(game)).def?.views.filter(v=>v.id!==game.viewId).forEach(v=>{const img=new Image();img.src=asset(v.asset);});
    }
  },[screen,game.sceneId,game.viewId]);
  useEffect(()=>{
    if(!notice)return;
    const timeout=setTimeout(()=>{setNotice('');setRewards([]);},7000);
    return ()=>clearTimeout(timeout);
  },[notice]);
  useEffect(()=>{
    if(!dialogue){setVisibleText('');return;}
    if(!prefs.typewriter){setVisibleText(dialogue.text);return;}
    setVisibleText('');
    let n=0;
    const timer=setInterval(()=>{n++;setVisibleText(dialogue.text.slice(0,n));if(n>=dialogue.text.length)clearInterval(timer);},35);
    textTimer.current=timer;
    return ()=>{clearInterval(timer);textTimer.current=null;};
  },[dialogue?.id,prefs.typewriter]);
  useEffect(()=>{
    if(screen!=='game'||review)return;
    let last=performance.now();
    const tick=()=>{
      const now=performance.now(),elapsed=now-last;last=now;
      if(document.visibilityState==='visible')commit({...stateRef.current,playTimeMs:stateRef.current.playTimeMs+Math.min(elapsed,30000)});
    };
    const timer=setInterval(tick,30000);
    const visibility=()=>{if(document.visibilityState==='hidden')tick();else last=performance.now();};
    document.addEventListener('visibilitychange',visibility);
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visibility);};
  },[screen,review]);
  // Cave countdown: pauses while reading dialogue, menus, the notebook, hints or the map, and when the tab is hidden.
  const caveRunning=screen==='game'&&!review&&inCave(game)&&game.timer?.remainingMs!==null&&!dialogue&&!['menu','notebook','hint','map'].includes(modal||'');
  useEffect(()=>{
    if(!caveRunning)return;
    const timer=setInterval(()=>{
      if(document.visibilityState!=='visible')return;
      const s=stateRef.current;
      if(!s.timer||s.timer.remainingMs===null)return;
      const left=Math.max(0,s.timer.remainingMs-1000);
      if(left<=0){commit(caveTimeout(s));setModal(null);setSelected(null);announce('물이 차올라 입구로 물러났다. 동굴 안에서 한 일은 되돌려졌다. 썰물을 다시 기다리자.');ping();return;}
      if([90000,45000,15000].includes(left)){announce('물이 차오른다 — '+left/1000+'초 남았다.');ping();}
      commit({...s,timer:{...s.timer,remainingMs:left}});
    },1000);
    return ()=>clearInterval(timer);
  },[caveRunning]);
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(e.key!=='Escape'||modal)return;
      if(selected)setSelected(null);else if(screen==='game'){setMenuTab('settings');setModal('menu');}
    };
    window.addEventListener('keydown',onKey);return ()=>window.removeEventListener('keydown',onKey);
  },[modal,selected,screen]);
  useEffect(()=>{
    if(modal!=='menu'||review)return;
    listSlots().then(setSlots).catch(e=>announce(e.message||'저장 목록을 읽을 수 없습니다.'));
  },[modal,menuTab,review]);
  async function load(id:string){
    setBusy(true);
    try{
      const slot=await getSlot(id);
      if(!slot){announce('저장된 진행이 없습니다.');return;}
      commit(slot.state);setScreen('game');setSelected(null);setDetail(null);setBackupSlot(null);setStartupError('');close();announce('저장된 진행을 불러왔습니다.');
    }catch(e){announce(e instanceof Error?e.message:'저장을 불러오지 못했습니다.');setBackupSlot(id.replace('.backup','')+'.backup');}
    finally{setBusy(false);}
  }
  async function manualSave(id:string){
    if(review){announce('화면 검토용 진행은 저장하지 않습니다.');return;}
    setBusy(true);
    try{await saveSlot(id,stateRef.current);setSlots(await listSlots());setConfirmSlot(null);announce('진행을 저장했습니다.');}
    catch{announce('저장을 완료하지 못했습니다. 기존 진행은 유지됩니다.');}
    finally{setBusy(false);}
  }
  async function returnTitle(){
    if(!review){try{await saveSlot('auto',stateRef.current);setAutoExists(true);}catch{announce('저장하지 못했습니다. 화면을 유지합니다.');return;}}
    setScreen('title');close();
  }
  function startNew(){commit(newGame());setScreen('game');setSelected(null);setDetail(null);setStartupError('');close();ping();}
  function nextChapter(){
    const next=advanceChapter(stateRef.current);
    if(next===stateRef.current)return;
    commit(next);setSelected(null);setDetail(null);setMarkers(false);close();ping(true);
  }
  function chooseView(scene:SceneId,view:string){
    const next=moveTo(stateRef.current,scene,view);
    if(next===stateRef.current){announce('아직 그곳으로 갈 수 없다.');return;}
    commit(next);setTargetList(false);close();ping();
  }
  function rotate(direction:number){
    const options=views[game.sceneId],index=options.indexOf(game.viewId);
    for(let step=1;step<options.length;step++){
      const view=options[(index+direction*step+options.length*step)%options.length];
      if(canVisit(game,game.sceneId,view)){chooseView(game.sceneId,view);return;}
    }
    announce('아직 그곳으로 갈 수 없다.');
  }
  const otherViews=views[game.sceneId].filter(v=>v!==game.viewId&&canVisit(game,game.sceneId,v)).length;
  function tryEnterCave(){
    const r=enterCave(stateRef.current,caveMs[prefs.timer]);
    commit(r.state);announce(r.status==='success'?(prefs.timer==='off'?'썰물이다. 동굴 안으로 들어왔다.':'썰물이다. 동굴 안으로 들어왔다. 물이 차오르기 전에 나와야 한다.'):r.message);ping(r.status==='success');
  }
  function hotspot(id:string,closeup?:string|null){
    if(dialogue||finished)return;
    if(!legacy){seasonHotspot(id);return;}
    const matching=puzzlesAt(id);
    const use=matching.find(p=>p.mode==='use');
    if(selected&&use&&use.id!=='P14'&&!has(game,use.id)){perform(use.id,{itemId:selected,targetId:id});return;}
    switch(id){
      case 'binding':
        if(!has(game,'P01'))perform('P01',true,true);
        openPuzzle({hotspot:id,assetId:'ch01_restraint'});return;
      case 'chair_brace':openPuzzle({hotspot:id,puzzleId:'P02'});return;
      case 'shelf_note':perform('P04',true);return;
      case 'shelf_numbers':commit(readClue(game,id));openPuzzle({hotspot:id});return;
      case 'cabinet_inside':perform('P06',true);return;
      case 'desk_drawer':perform('P12',true);return;
      case 'workbench_battery':perform('P18',true);return;
      case 'sump_plate':perform('P22',true);return;
      case 'calendar':case 'duty_roster':
        commit(readClue(game,id));openPuzzle({hotspot:id,assetId:'ch01_calendar'});return;
      case 'valve_label':perform('P20',true,true);openPuzzle({hotspot:id});return;
      case 'loading_passage':
        if(has(game,'P21'))chooseView('R04','A');else announce('물이 차 있어 통로를 건널 수 없다.');return;
      case 'office_door':
        if(has(game,'P10')){chooseView('R02','A');return;}
        openPuzzle({hotspot:id,puzzleId:'P10'});return;
      case 'maintenance_door':
        if(has(game,'P17')){chooseView('R03','A');return;}
        openPuzzle({hotspot:id,puzzleId:'P17'});return;
      case 'exit_gate':openPuzzle({hotspot:id,puzzleId:'P25'});return;
      default:openPuzzle({hotspot:id,assetId:closeup||undefined,puzzleId:matching[0]?.id});return;
    }
  }
  function seasonHotspot(id:string){
    const h=viewDef(game.sceneId,game.viewId)?.hotspots.find(x=>x.id===id);
    if(!h)return;
    const target=h.opens||id;
    const here=puzzles.filter(p=>p.location.sceneId===game.sceneId&&p.location.viewId===game.viewId&&p.location.hotspotId===target);
    if(selected){
      const use=here.find(p=>p.mode==='use'&&!has(game,p.id))||here.find(p=>p.mode==='use');
      if(use){perform(use.id,{itemId:selected,targetId:target});return;}
      announce(josa(itemNames[selected],'은','는')+' 여기에 쓸 수 없을 것 같다.');ping();return;
    }
    if(game.sceneId==='C03'&&target==='cave_mouth'&&!has(game,'C03_08')){tryEnterCave();return;}
    const active=here.find(p=>!has(game,p.id)&&prerequisitesMet(game,p));
    if(active?.mode==='inspect'){
      const r=perform(active.id,true,true);
      // Pickups and conversations stay in the scene; documents open the close-up so they can be read.
      const papers=active.effects.clues?.length||active.effects.grantEvidence.length;
      if(r.status==='success'&&!papers)return;
    } else setNotice('');
    setContext({hotspot:target});setModal('puzzle');ping();
  }
  function puzzlesAt(id:string){return availableAndUnavailable().filter(p=>p.location.hotspotId===id);}
  function availableAndUnavailable(){return puzzles.filter(p=>p.location.sceneId==='ANY'&&p.chapter===game.chapterId||(p.location.sceneId===game.sceneId&&p.location.viewId===game.viewId));}
  function visibleHotspot(id:string){
    if(id==='binding')return !has(game,'P03');
    if(id==='chair_brace')return !has(game,'P02');
    if(id==='shelf_note')return !has(game,'P04');
    if(id==='cabinet_lock')return !has(game,'P05');
    if(id==='cabinet_inside')return has(game,'P05')&&!has(game,'P06');
    if(id==='panel_cover')return !has(game,'P13');
    if(id==='fuse_socket')return has(game,'P13')&&!has(game,'P14');
    if(id==='main_breaker')return has(game,'P13');
    if(id==='vent_cover')return !has(game,'P07');
    if(id==='vent_key')return has(game,'P07')&&!has(game,'P09');
    if(id==='workbench_battery')return !has(game,'P18');
    if(id==='sump_plate')return !has(game,'P22');
    return true;
  }
  const currentKey=game.sceneId+'_'+game.viewId;
  const sceneHotspots:{hotspotId:string;rect:{x:number;y:number;w:number;h:number};closeupAssetId?:string|null;name:string}[]=legacy?
    scenes.find(s=>s.sceneId===game.sceneId&&s.viewId===game.viewId)!.hotspots.filter(h=>visibleHotspot(h.hotspotId)).map(h=>({...h,name:hotspotNames[h.hotspotId]})):
    (viewDef(game.sceneId,game.viewId)?.hotspots||[]).map(h=>({hotspotId:h.id,rect:h.rect,name:h.name}));
  const candidateHints=availablePuzzles(game);
  const hint=candidateHints.find(p=>p.id===hintId)||candidateHints[0];
  const overlay=(name:string,style?:CSSProperties)=><VectorArt name={name} className="clue-overlay" style={style}/>;
  const progress=chapterProgress(game,here.id);
  const seasonTotal=chapters.reduce((n,c)=>n+chapterProgress(game,c.id).total,0),seasonDone=chapters.reduce((n,c)=>n+chapterProgress(game,c.id).done,0);
  const phase=tidePhase(game.tide);
  const showTide=game.sceneId==='C03'&&!has(game,'C03_08');
  function keypad(puzzleId:string){
    const length=puzzleId==='P24'?4:3;
    return <div className="keypad"><div className="code-display" aria-label={'입력 '+code}><span>{code.padEnd(length,'—').split('').join('  ')}</span><small>{length}자리 번호</small></div>
      <div className="keypad-grid">{['1','2','3','4','5','6','7','8','9','←','0','지우기'].map(n=><button key={n} onClick={()=>{setCode(v=>n==='지우기'?'':n==='←'?v.slice(0,-1):v.length<length?v+n:v);ping();}} aria-label={n==='←'?'한 자리 지우기':n}>{n}</button>)}</div>
      <button className="primary full" disabled={code.length!==length} onClick={()=>perform(puzzleId,code)}>잠금 해제 <Icon name="unlock"/></button>
    </div>;
  }
  function puzzleBody(){
    const id=context.hotspot;
    const isBreaker=['panel_cover','fuse_socket','main_breaker'].includes(id);
    const isCalendar=['calendar','duty_roster'].includes(id);
    const isCode=['cabinet_lock','toolbox_lock','exit_keypad'].includes(id);
    return <>
      {context.assetId&&<div className={'closeup '+(isCode||id==='drain_valves'?'compact-closeup ':'')+(id==='plate_detail'&&has(game,'P23')?'uv-active':'')}>
        <img className="closeup-base" src={asset(context.assetId)} alt={hotspotNames[id]||'장치 확대'} />
        {isCalendar&&<>{overlay('calendar',{left:'8%',top:'15%',width:'53%',height:'65%'})}{overlay('duty_roster',{left:'66%',top:'15%',width:'29%',height:'64%'})}</>}
        {id==='plate_detail'&&<>{overlay('plate_engraving',{left:'10%',top:'32%',width:'79%',height:'35%'})}{has(game,'P23')&&overlay('plate_uv_numbers',{left:'10%',top:'32%',width:'79%',height:'35%'})}</>}
        {isBreaker&&has(game,'P13')&&<><span className="machine-tag f1">F1</span><span className="machine-tag f2">F2</span><span className={'power-dot '+(has(game,'P15')?'on':'')}>{has(game,'P15')?'ON':'OFF'}</span>{has(game,'P14')&&<img className="installed-fuse" src={asset('fuse')} alt="F2에 설치된 퓨즈"/>}</>}
        {id==='drain_valves'&&<div className="valve-image-labels"><span>바다 유입</span><span>저수 연결</span><span>배출</span></div>}
      </div>}
      {captionFor[id]&&<p className="body-copy">{captionFor[id]}</p>}
      {id==='binding'&&<>{owns(game,'metal_shard')?<button className="primary full" onClick={()=>perform('P03',{itemId:'metal_shard',targetId:'binding'})}>금속 조각으로 결박 끊기</button>:<p className="tip"><Icon name="inspect"/>의자 버팀대를 조사해 보자.</p>}</>}
      {id==='chair_brace'&&<><div className="repeat-meter" aria-label={'체중 싣기 '+repeatCount+'회'}>{[1,2,3].map(n=><span key={n} className={repeatCount>=n?'filled':''}/>)}</div><button className="primary full" onClick={()=>{const n=repeatCount+1;setRepeatCount(n);ping();if(n>=3)perform('P02',n);}}>왼쪽으로 체중 싣기 <span>{repeatCount}/3</span></button></>}
      {id==='shelf_numbers'&&<><p className="body-copy">선반 앞에 붙은 번호를 확대해 보았다.</p><div className="shelf-numbers">{[['위쪽 선반','4'],['가운데 선반','1'],['아래쪽 선반','7']].map(([t,n])=><div key={t}><span>{t}</span><strong>{n}</strong></div>)}</div></>}
      {isCode&&<>{id==='toolbox_lock'&&<><div className="paper-note"><small>입력 규칙</small><strong>점검일 DD + 근무조 N</strong></div><button className="secondary full" onClick={()=>{commit(readClue(readClue(game,'calendar'),'duty_roster'));openPuzzle({hotspot:'calendar',assetId:'ch01_calendar'});}}>달력과 근무표 보기 <Icon name="document"/></button></>}{keypad(id==='cabinet_lock'?'P05':id==='toolbox_lock'?'P16':'P24')}</>}
      {isCalendar&&<><div className="paper-note"><strong>12일 · 기계 점검</strong><p>같은 날 근무표에는 <b>3조</b>라고 적혀 있다.</p></div><button className="secondary full" onClick={()=>{commit(readClue(readClue(game,'calendar'),'duty_roster'));openPuzzle({hotspot:'toolbox_lock',assetId:'ch01_maintenance_box',puzzleId:'P16'});}}>점검함으로 돌아가기</button></>}
      {id==='vent_cover'&&<button className="primary full" disabled={!owns(game,'screwdriver')} onClick={()=>perform('P07',{itemId:'screwdriver',targetId:'vent_cover'})}>{owns(game,'screwdriver')?'드라이버로 나사 풀기':'나사를 풀 도구가 필요하다'}</button>}
      {id==='vent_key'&&<><p className="body-copy">{captionFor.vent_key}</p><button className="primary full" disabled={!owns(game,'rope_magnet')} onClick={()=>perform('P09',{itemId:'rope_magnet',targetId:'vent_key'})}>{owns(game,'rope_magnet')?'자석 줄로 열쇠 건지기':'끈과 자석을 연결할 방법을 찾자'}</button></>}
      {id==='office_door'&&<button className="primary full" disabled={!owns(game,'office_key')} onClick={()=>perform('P10',{itemId:'office_key',targetId:'office_door'})}>관리실 열쇠로 문 열기</button>}
      {isBreaker&&<>
        {!has(game,'P13')?<button className="primary full" disabled={!owns(game,'screwdriver')} onClick={()=>{const r=perform('P13',{itemId:'screwdriver',targetId:'panel_cover'},true);if(r.status==='success')setContext({hotspot:'fuse_socket',assetId:'ch01_breaker'});}}>드라이버로 배전함 열기</button>:<>
          <div className="fuse-controls"><button className="secondary" disabled={!owns(game,'fuse')} onClick={()=>perform('P14',{itemId:'fuse',targetId:'F1'},true)}>F1에 퓨즈 넣기</button><button className="secondary" disabled={!owns(game,'fuse')} onClick={()=>perform('P14',{itemId:'fuse',targetId:'F2'},true)}>F2에 퓨즈 넣기</button></div>
          <button className="primary full" onClick={()=>perform('P15','ON')}>주차단기 {has(game,'P15')?'ON · 전원 복구됨':'ON으로 전환'} <Icon name="power"/></button>
          {game.evidenceIds.includes('circuit_plan')&&<button className="text-button" onClick={()=>{setEvidenceDetail('circuit_plan');setNotebookTab('clues');setModal('notebook');}}>수첩의 회로도 확인</button>}
        </>}
      </>}
      {id==='desk_plan'&&<>
        <div className="puzzle-paper"><img src={asset('ch01_circuit_paper')} alt="회로도 두 조각" className="puzzle-reference"/></div>
        <div className="piece-stack">{pieces.map((piece,index)=><div className={'piece '+(piece==='upper_a'?'upper-piece':'lower-piece')} key={piece}><small>{index===0?'위쪽 자리':'아래쪽 자리'}</small><b>{piece==='upper_a'?'쪽지의 조각':'책상의 조각'}</b><VectorArt name={piece==='upper_a'?'circuit_top':'circuit_bottom'} label={piece==='upper_a'?'회로도 윗부분':'회로도 아랫부분'}/></div>)}</div>
        <button className="secondary full" onClick={()=>setPieces([...pieces].reverse())}>두 조각의 위치 바꾸기 <Icon name="reset"/></button>
        <button className="primary full" disabled={!owns(game,'note_a')} onClick={()=>perform('P11',pieces)}>회로도 이어 붙이기</button>
      </>}
      {id==='maintenance_door'&&<button className="primary full" onClick={()=>perform('P17',true)}>설비실 문 열고 들어가기 <Icon name="next"/></button>}
      {id==='valve_label'&&<div className="paper-note"><small>배수 작업 표찰</small><ol><li>바다 유입 닫기</li><li>저수 연결 닫기</li><li>배출 열기</li><li>마지막에 구동</li></ol></div>}
      {id==='drain_valves'&&<>
        <p className="body-copy">{has(game,'P21')?'물이 빠지고 손잡이가 설비에 설치됐다.':owns(game,'valve_handle')?'손잡이를 사용할 준비가 됐다. 세 밸브의 연결을 맞춰 보자.':'밸브 가운데 축에 손잡이가 없다.'}</p>
        <div className="valve-controls">{([['sea','바다 유입'],['tank','저수 연결'],['outlet','배출']] as const).map(([key,label])=><button key={key} className={'valve-toggle '+(valves[key]==='open'?'open':'closed')} disabled={has(game,'P21')} onClick={()=>{setValves(v=>({...v,[key]:v[key]==='open'?'closed':'open'}));ping();}}><span className="valve-wheel" aria-hidden="true">✣</span><strong>{label}</strong><span>{valves[key]==='open'?'열림':'닫힘'}</span></button>)}</div>
        <button className="primary full" disabled={!owns(game,'valve_handle')&&!has(game,'P21')} onClick={()=>perform('P21',valves)}>배수 구동 <Icon name="power"/></button>
        {game.evidenceIds.includes('drain_procedure')&&<button className="text-button" onClick={()=>{setEvidenceDetail('drain_procedure');setModal('notebook');}}>수첩의 작업 절차 보기</button>}
      </>}
      {id==='plate_detail'&&<>
        <div className="paper-note"><strong>빛 아래에서 표식을 잇는다</strong><p>파도 → 등대 → 배 → 별</p>{has(game,'P23')&&<p className="uv-text">파도 2 · 등대 6 · 배 4 · 별 1</p>}</div>
        <button className="primary full" disabled={!owns(game,'uv_lamp_ready')} onClick={()=>perform('P23',{itemId:'uv_lamp_ready',targetId:'exit_plate'},true)}>{has(game,'P23')?'UV 표식 확인됨':'UV 램프로 비추기'} <Icon name="eye"/></button>
      </>}
      {id==='exit_gate'&&<button className="primary full" disabled={!has(game,'P24')} onClick={()=>perform('P25',true)}>밖으로 나간다 <Icon name="next"/></button>}
    </>;
  }
  const appStyle={'--text-size':prefs.textSize+'px'} as CSSProperties;
  const nextInfo=chapters[chapterIndex(chapter.id)+1];
  const recordTitle=(id:string)=>evidence[id]?.title||docs[id]?.title||id;
  const records=[...new Set([...game.readClueIds,...game.evidenceIds])];
  const missingLines=endingId==='N'?[
    ...(recordStatus(game).missing?['빠진 기록 '+recordStatus(game).missing+'건 때문에 사건의 일부는 ‘의혹’으로 남았다.']:[]),
    ...(!game.flags.acknowledged_responsibility?['도윤은 끝내 자신의 서명을 말하지 않았다.']:[]),
    ...(!game.flags.all_rescued?['혜진은 반나절 뒤 해경에 구조되었다. 태오는 폭풍 속에서 행방을 감췄다.']:[])
  ]:[];
  const speakerTag=(d:typeof dialogue)=>d.broadcast?'천장 스피커':d.radio?'무전':d.memory?'기억':d.speaker==='도윤'?'속마음':'대화';
  return <NoticeContext.Provider value={notice}><div className="game-shell" style={appStyle} data-reduced={prefs.reduceMotion}>
    {screen==='title'?<section className="title-screen">
      <img className="title-art" src={asset('title_island')} alt="등대와 폐시설이 남은 섬의 풍경"/>
      <div className="title-shade"/>
      <div className="title-top"><span className="edition">SEASON 01</span><button className="icon-button light" onClick={()=>{setMenuTab('settings');openModal('menu');}} aria-label="설정"><Icon name="settings" light/></button></div>
      <div className="wordmark"><span className="wordmark-rule"/><p>잃어버린 기억이 머무는 섬</p><h1>표류도</h1><span>PYO-RYU ISLAND</span><p className="subtitle">기억의 해안</p></div>
      <div className="title-actions">
        <p className="title-quote">“기억해 내면 보내 줄게.”</p>
        <button className="primary full" onClick={()=>autoExists?setConfirmSlot('new'):startNew()}>새로운 기억 <Icon name="next"/></button>
        <button className="title-continue full" disabled={!autoExists||busy||!!review} onClick={()=>load('auto')}>이어서 탐색 <small>{autoExists?pad(chapter.no)+'장 '+chapter.title+' · 자동 저장된 진행':'아직 저장된 진행이 없습니다'}</small></button>
        {startupError&&<><p className="title-error">{startupError}</p><button className="text-button light-text" onClick={()=>load('auto.backup')}>이전 자동 저장 복구</button></>}
        <div className="title-links"><button onClick={()=>{setScreen('home');ping();}}>게임 홈</button><span>·</span><button onClick={()=>{setMenuTab('help');openModal('menu');}}>플레이 방법</button></div>
        <span className="title-footnote">시즌 1 · 전 10장 · 엔딩 3종</span>
      </div>
    </section>:screen==='home'?<section className="home-screen">
      <header className="home-header"><button className="home-brand" onClick={()=>setScreen('title')} aria-label="타이틀로 돌아가기">표류도 <span>기억의 해안</span></button><button className="icon-button" aria-label="홈 설정" onClick={()=>{setMenuTab('settings');openModal('menu');}}><Icon name="settings"/></button></header>
      <div className="home-scroll"><div className="home-hero"><div><small>CHAPTER {pad(chapter.no)}</small><h1>{chapter.title}</h1><p>{chapter.summary}</p><span>{chapter.place}</span></div><img src={asset(chapter.thumb)} alt={chapter.place}/></div>
        <article className="resume-card"><div className="resume-heading"><span className="resume-icon"><Icon name="notebook"/></span><div><small>도윤의 탐색 기록</small><h2>{autoExists?pad(chapter.no)+' · '+placeName(game.sceneId):'아직 시작하지 않은 기억'}</h2></div><b>{Math.round(seasonDone/seasonTotal*100)}%</b></div><div className="resume-progress"><span style={{width:seasonDone/seasonTotal*100+'%'}}/></div><p>{autoExists?objective(game):'1장 · 폐창고 감금실에서 탐색을 시작하세요.'}</p><button className="primary full" disabled={busy} onClick={()=>{if(autoExists){if(review){setScreen('game');return;}void load('auto');}else startNew();}}>{autoExists?'이어서 탐색하기':'첫 탐색 시작하기'} <Icon name="next"/></button></article>
        <div className="home-shortcuts">{[['notebook','수첩','기억과 단서'],['map','지도','열린 길'],['menu','설정','나의 플레이']].map(([name,label,description])=><button key={name} onClick={()=>{if(name==='menu')setMenuTab('settings');if(name==='notebook'){setNotebookTab('clues');setEvidenceDetail(null);}openModal(name as Modal);}}><Icon name={name==='menu'?'settings':name}/><strong>{label}</strong><small>{description}</small></button>)}</div>
        <div className="journey-heading"><h2>섬을 따라, 기억을 따라</h2><small>SEASON 01</small></div><div className="chapter-cards">{chapters.map((c,i)=>{const ci=chapterIndex(game.chapterId),done=i<ci||(i===ci&&has(game,c.completeId)),open=i<=ci;return <article key={c.id} className={'chapter-card '+(open?(i===ci?'current':''):'locked')}>{open?<img src={asset(c.thumb)} alt={c.place}/>:<div className="locked-art"><Icon name="lock"/></div>}<div><small>CHAPTER {pad(c.no)}</small><h3>{open?c.title:'아직 열리지 않은 기억'}</h3><p>{open?c.place+' · '+c.summary:'이전 장을 마치면 열린다'}</p></div><span className="chapter-status">{done?'완료':open?'탐색 중':'잠김'}</span></article>;})}</div>
        {seenEndings.length>0&&<><div className="journey-heading"><h2>본 엔딩</h2><small>{seenEndings.length} / 3</small></div><div className="ending-gallery">{(['T','N','B'] as const).filter(id=>seenEndings.includes(id)).map(id=><figure key={id}><img src={asset(endings[id].image)} alt=""/><figcaption><small>{endings[id].tag}</small>{endings[id].title}</figcaption></figure>)}</div></>}
        <button className="text-button full" onClick={()=>{setMenuTab('help');openModal('menu');}}><Icon name="inspect"/>탐색이 처음이라면, 플레이 방법</button>
      </div><div className="home-footer"><Icon name="save"/><span>{autoExists?'자동 저장된 기억이 있습니다':'시즌 1 · 전 10장 · 시간제한은 설정에서 끌 수 있습니다'}</span></div>
    </section>:<>
      <header className="game-header"><div className="chapter-label"><span>{pad(here.no)}</span><div><small>{revisiting?'기록 보완 · 다시 찾은 곳':'표류도 · '+here.title}</small><strong>{placeName(game.sceneId)}</strong></div></div><div className="header-actions"><button className="icon-button light" onClick={()=>{setNotebookTab('dialogue');openModal('notebook');}} aria-label="대화 기록"><Icon name="document" light/></button><button className="icon-button light" onClick={()=>{setMenuTab('settings');openModal('menu');}} aria-label="메뉴"><Icon name="menu" light/></button></div></header>
      <div className="objective"><Icon name="inspect"/><span>{objective(game)}</span><small>{Math.round(progress.done/progress.total*100)}%</small></div>
      <div className="scene-bar"><div><b>{legacy?roomNames[game.sceneId]:here.title}</b><span>{viewName(game.sceneId,game.viewId)}</span></div>{showTide&&<span className={'tide-chip '+phase.toLowerCase()} title="조수 관측 시계"><Icon name="tide"/>{tideNames[phase]}{phase!=='LOW'&&!inCave(game)&&<small>썰물까지 {ticksToLow(game.tide)*5}분</small>}</span>}<button className={'marker-button '+(markers?'active':'')} onClick={()=>{setMarkers(!markers);ping();}} aria-label="조사 표시" aria-pressed={markers}><Icon name="eye"/></button></div>
      <main className="scene-window" aria-label={viewName(game.sceneId,game.viewId)}>
        <div className={'scene-image-space '+(markers?'show-markers':'')} style={{filter:'brightness('+prefs.brightness/100+')'}}>
          <img key={sceneAssetId(game)} className="scene-base" src={sceneAsset(game)} alt={viewName(game.sceneId,game.viewId)} onError={()=>setImageError(true)}/>
          {legacy&&layers.filter(l=>l.scene===currentKey&&(!('visibleWhen' in l)||!l.visibleWhen||(l.visibleWhen.completedAll||[]).every(id=>has(game,id))&&(!('notCompletedAny' in l.visibleWhen)||!(l.visibleWhen.notCompletedAny||[]).some(id=>has(game,id))))).map((l,i)=>{const style={left:l.rect.x*100+'%',top:l.rect.y*100+'%',width:l.rect.w*100+'%',height:l.rect.h*100+'%'};return 'assetId' in l&&l.assetId?<img key={i} className="world-layer" alt="" aria-hidden="true" src={asset(l.assetId)} style={style}/>:<VectorArt key={i} className="world-layer" name={('assetPath' in l?l.assetPath||'':'').split('/').pop()!.replace('.svg','')} style={style}/>;})}
          {sceneHotspots.map(h=><button key={h.hotspotId} className="hotspot" aria-label={h.name} disabled={!!dialogue||finished} style={{left:(h.rect.x+h.rect.w/2)*100+'%',top:(h.rect.y+h.rect.h/2)*100+'%',width:h.rect.w*100+'%',height:h.rect.h*100+'%'}} onClick={()=>hotspot(h.hotspotId,h.closeupAssetId)}><span className="target-reticle"><i/></span></button>)}
          {currentKey==='R01_B'&&<button className="hotspot" aria-label="선반 번호 조사" disabled={!!dialogue||finished} style={{left:'38%',top:'48%',width:'18%',height:'27%'}} onClick={()=>hotspot('shelf_numbers')}><span className="target-reticle"><i/></span></button>}
          {imageError&&<div className="image-error">배경을 불러오지 못했습니다.<button className="secondary" onClick={()=>location.reload()}>화면 다시 불러오기</button></div>}
        </div>
        {inCave(game)&&<div className={'cave-timer '+(game.timer!.remainingMs!==null&&game.timer!.remainingMs<=45000?'urgent':'')} role="timer"><Icon name="wave" light/><span>{game.timer!.remainingMs===null?'썰물 유지 중 · 시간제한 없음':'물이 차오르기까지'}</span>{game.timer!.remainingMs!==null&&<><b>{Math.floor(game.timer!.remainingMs/60000)}:{pad(Math.floor(game.timer!.remainingMs/1000)%60)}</b><i style={{width:Math.min(100,game.timer!.remainingMs/(caveMs[prefs.timer]||game.timer!.remainingMs||1)*100)+'%'}}/></>}</div>}
        {selected&&<div className="selected-tool"><img src={itemAsset(selected)} alt=""/><div><small>사용할 물건</small><strong>{itemNames[selected]}</strong></div><button onClick={()=>setSelected(null)} aria-label="아이템 선택 취소"><Icon name="close" light/></button></div>}
        {dialogue?.portrait&&<img key={dialogue.portrait} className={'portrait'+(dialogue.memory?' memory':'')} src={asset(dialogue.portrait)} alt=""/>}
        {dialogue&&<div className={'dialogue-card '+(dialogue.broadcast?'broadcast ':'')+(dialogue.memory?'memory ':'')+(dialogue.radio?'radio':'')}>
          <div className="speaker-line"><Icon name={dialogue.broadcast||dialogue.radio?'speaker':'notebook'} light/><b>{dialogue.speaker}</b><span>{speakerTag(dialogue)}</span></div>
          <button className="dialogue-next" onClick={()=>{if(visibleText!==dialogue.text){if(textTimer.current)clearInterval(textTimer.current);setVisibleText(dialogue.text);return;}commit(advanceDialogue(stateRef.current));ping();}} aria-label="다음 대사"><p>{visibleText}</p><span>계속 <Icon name="next" light/></span></button>
        </div>}
        {chapterDone&&<div className="chapter-complete"><small>CHAPTER {pad(chapter.no)} COMPLETE</small><Icon name="unlock" light/><h2>{completion[chapter.id]?.[0]||chapter.title}</h2><p>{(completion[chapter.id]?.[1]||'').split('\n').map((l,i)=><span key={i}>{l}<br/></span>)}</p><div className="completion-stats"><span><b>{chapterProgress(game).done}</b>완료한 단계</span><span><b>{records.length}</b>확보한 기록</span></div>{nextInfo&&<button className="primary full" onClick={nextChapter}>{pad(nextInfo.no)}장 · {nextInfo.title} <Icon name="next"/></button>}<button className="text-button light-text" onClick={returnTitle}>타이틀로 돌아가기</button><small>진행은 자동으로 저장됩니다.</small></div>}
      </main>
        {showEnding&&endingId&&<div className={'ending-screen ending-'+endingId}><img src={asset(endings[endingId].image)} alt=""/><div className="ending-copy"><small>{endings[endingId].tag}</small><h2>{endings[endingId].title}</h2>{endings[endingId].text.map(t=><p key={t}>{t}</p>)}{missingLines.map(t=><p key={t} className="ending-missing">{t}</p>)}
          <div className="completion-stats"><span><b>{recordStatus(game).found}/4</b>핵심 기록</span><span><b>{game.flags.acknowledged_responsibility?'인정':'부인'}</b>서명</span><span><b>{game.flags.all_rescued?'모두':'일부'}</b>구조</span></div>
          {endingId==='B'?<button className="primary full" onClick={()=>{commit(retryFinal(stateRef.current));ping();}}>마지막 선택으로 돌아가기 <Icon name="reset"/></button>:<button className="primary full" onClick={returnTitle}>타이틀로 돌아가기</button>}
          {endingId!=='B'&&<button className="text-button light-text" onClick={()=>{commit(retryFinal(stateRef.current));ping();}}>마지막 선택 다시 보기</button>}
          <small>본 엔딩 {seenEndings.length} / 3 · 엔딩은 게임 홈에 기록됩니다.</small></div></div>}
      <div className="view-nav"><button className="icon-button" onClick={()=>rotate(-1)} disabled={!!dialogue||finished||!otherViews} aria-label="이전 시점"><Icon name="back"/></button><div className="view-dots">{views[game.sceneId].map(v=><button key={v} className={v===game.viewId?'current':''} aria-label={viewName(game.sceneId,v)} aria-current={v===game.viewId?'true':undefined} disabled={!!dialogue||finished||!canVisit(game,game.sceneId,v)} onClick={()=>chooseView(game.sceneId,v)}><span/></button>)}</div><button className="icon-button" onClick={()=>rotate(1)} disabled={!!dialogue||finished||!otherViews} aria-label="다음 시점"><Icon name="next"/></button></div>
      <div className="context-actions"><button className="text-button" disabled={!!dialogue||finished} onClick={()=>setTargetList(!targetList)}><Icon name="inspect"/>조사 목록</button>
        {legacy&&game.sceneId!=='R01'&&<button className="text-button" disabled={!!dialogue||finished} onClick={()=>chooseView(game.sceneId==='R02'?'R01':game.sceneId==='R03'?'R02':'R03',game.sceneId==='R02'?'D':game.sceneId==='R03'?'C':'C')}><Icon name="back"/>{game.sceneId==='R02'?'감금실':game.sceneId==='R03'?'관리실':'설비실'}로 돌아가기</button>}
        {revisiting&&<button className="text-button" disabled={!!dialogue} onClick={()=>chooseView(chapter.def!.scene,chapter.def!.startView)}><Icon name="back"/>{pad(chapter.no)}장으로 돌아가기</button>}
        {showTide&&(inCave(game)?<button className="text-button" disabled={!!dialogue} onClick={()=>{commit(leaveCave(stateRef.current));announce('입구로 물러났다. 동굴에서 챙긴 것은 그대로다. 물때가 바뀌었다.');ping();}}><Icon name="back"/>입구로 물러나기</button>:
          game.viewId==='A'&&<span className="wait-actions"><button className="text-button" disabled={!!dialogue||phase==='LOW'} onClick={()=>{commit(waitTide(stateRef.current));ping();}}><Icon name="clock"/>5분 기다리기</button><button className="text-button" disabled={!!dialogue||phase==='LOW'} onClick={()=>{commit(waitTide(stateRef.current,true));announce('조수 시계 바늘이 ‘썰물’에 닿았다. 모래 길이 드러났다.');ping(true);}}>썰물까지</button></span>)}
      </div>
      {targetList&&<div className="target-list">{sceneHotspots.map(h=><button key={h.hotspotId} onClick={()=>hotspot(h.hotspotId,h.closeupAssetId)}>{h.name}</button>)}{currentKey==='R01_B'&&<button onClick={()=>hotspot('shelf_numbers')}>선반 번호 조사</button>}</div>}
      <nav className="bottom-nav" aria-label="탐색 도구">{[['inventory','inventory','보관함'],['notebook','notebook','수첩'],['map','map','지도'],['hint','hint','힌트']].map(([id,name,label])=><button key={id} disabled={!!dialogue||finished} onClick={()=>{if(id==='hint'){setHintId('');setHintLevel(0);}if(id==='notebook'){setNotebookTab('clues');setEvidenceDetail(null);}openModal(id as Modal);}}><span><Icon name={name} light/>{id==='inventory'&&Object.keys(game.inventory).length>0&&<b className="badge">{Object.keys(game.inventory).length}</b>}</span><strong>{label}</strong></button>)}</nav>
      <div className="save-status" role="status">{review?'화면 검토 · 저장하지 않음':saveStatus}</div>
    </>}
    {modal==='inventory'&&<Sheet title="보관함" subtitle={'소지품 '+Object.keys(game.inventory).length+'개'} close={close}>
      {combineFirst?<div className="combine-banner"><Icon name="combine"/><div><b>두 물건을 연결해 보자</b><span>아래에서 두 번째 재료를 선택하세요.</span></div><button className="icon-button" onClick={()=>{setCombineFirst(null);setCombineSecond(null);}} aria-label="조합 취소"><Icon name="close"/></button></div>:<p className="panel-intro">물건을 살펴보고, 필요한 곳에 사용하세요.</p>}
      <div className="inventory-grid">{Object.keys(game.inventory).map(id=><button key={id} className={'item-slot '+((detail===id||combineFirst===id||combineSecond===id)?'selected':'')} onClick={()=>{if(combineFirst){if(id!==combineFirst)setCombineSecond(id);}else setDetail(id);ping();}}><img src={itemAsset(id)} alt=""/><span>{itemNames[id]}</span>{combineFirst===id&&<b className="slot-number">1</b>}{combineSecond===id&&<b className="slot-number">2</b>}</button>)}</div>
      {!Object.keys(game.inventory).length&&<div className="empty-state"><Icon name="inventory"/><h3>아직 챙긴 물건이 없다</h3><p>주변을 조사해 탈출에 필요한 도구를 찾아보자.</p></div>}
      {combineFirst&&<><div className="combine-preview"><img src={itemAsset(combineFirst)} alt={itemNames[combineFirst]}/><span>+</span>{combineSecond?<img src={itemAsset(combineSecond)} alt={itemNames[combineSecond]}/>:<span className="empty-material">두 번째 재료</span>}</div><button className="primary full" disabled={!combineSecond} onClick={()=>{const p=puzzles.find(p=>p.mode==='combine'&&p.chapter===game.chapterId&&Array.isArray(p.expectedAnswer)&&[...p.expectedAnswer].sort().join()===([combineFirst,combineSecond].sort().join()));if(!p){announce('이 둘을 연결할 방법이 없다.');setCombineFirst(null);setCombineSecond(null);return;}const r=perform(p.id,[combineFirst,combineSecond],true);if(r.status==='success'){setDetail(r.rewards[0]||null);setCombineFirst(null);setCombineSecond(null);}}}>조합 확인 <Icon name="combine"/></button></>}
      {!combineFirst&&detail&&owns(game,detail)&&<article className="item-detail"><div className="item-showcase"><img src={itemAsset(detail)} alt={itemNames[detail]}/></div><small>발견한 물건</small><h3>{itemNames[detail]}</h3><p>{descriptions[detail]}</p>{detail==='note_a'&&<div className="paper-note"><strong>높은 칸부터 낮은 칸까지.</strong><p>앞에 적힌 숫자만.</p></div>}{detail==='tide_watch'&&game.chapterId==='CH03'&&<div className="paper-note"><small>지금 바늘이 가리키는 구간</small><strong>{tideNames[phase]}</strong>{phase!=='LOW'&&<p>썰물까지 약 {ticksToLow(game.tide)*5}분</p>}</div>}<div className="two-actions"><button className="primary" onClick={()=>{setSelected(detail);close();announce(josa(itemNames[detail],'을','를')+' 사용할 대상을 선택하세요.');}}>사용 <Icon name="use"/></button><button className="secondary" onClick={()=>{setCombineFirst(detail);setCombineSecond(null);}}>조합 <Icon name="combine"/></button></div>{detail==='exit_plate'&&<button className="secondary full" onClick={()=>openPuzzle({hotspot:'plate_detail',assetId:'ch01_brass_plate',puzzleId:'P23'})}>명판 확대 조사 <Icon name="inspect"/></button>}</article>}
    </Sheet>}
    {modal==='notebook'&&<Sheet title="수첩" subtitle="기억하지 못한 것을 기록하다" close={close}>
      <div className="tabs"><button className={notebookTab==='clues'?'active':''} onClick={()=>{setNotebookTab('clues');setEvidenceDetail(null);}}>단서 기록</button><button className={notebookTab==='dialogue'?'active':''} onClick={()=>setNotebookTab('dialogue')}>대화 기록</button></div>
      {notebookTab==='clues'?(evidenceDetail&&(evidence[evidenceDetail]||docs[evidenceDetail])?<article className="evidence-detail"><button className="text-button" onClick={()=>setEvidenceDetail(null)}><Icon name="back"/>기록 목록</button>{evidence[evidenceDetail]?<><h3>{evidence[evidenceDetail].title}</h3>{evidence[evidenceDetail].overlay&&<div className="document-page"><VectorArt name={evidence[evidenceDetail].overlay!} label={evidence[evidenceDetail].title}/></div>}<p>{evidence[evidenceDetail].text}</p></>:<Doc id={evidenceDetail}/>}</article>:<><p className="panel-intro">살펴본 단서와 복원한 기록이 여기에 남습니다. <b>E01~E04</b>는 결말에 영향을 주는 핵심 기록입니다.</p>{[...records].reverse().map(id=><button className="record-row" key={id} onClick={()=>setEvidenceDetail(id)}><span className="record-icon"><Icon name={docs[id]?.kind==='evidence'?'star':'document'}/></span><span><small>{game.evidenceIds.includes(id)?'확보한 증거':'관찰한 단서'}</small><strong>{recordTitle(id)}</strong></span><Icon name="next"/></button>)}{!records.length&&<div className="empty-state"><Icon name="notebook"/><h3>첫 기록을 기다리고 있다</h3><p>쪽지나 장치를 조사하면 단서가 저장된다.</p></div>}</>):<div className="transcript">{game.seenDialogueIds.map(id=>allDialogues.find(d=>d.id===id)).filter(d=>!!d).map(d=><article key={d.id} className={d.broadcast?'radio-entry':d.memory?'memory-entry':''}><small><Icon name={d.broadcast||d.radio?'speaker':'notebook'}/>{d.speaker}{d.broadcast?' · 방송':d.radio?' · 무전':d.memory?' · 기억':''}</small><p>{d.text}</p></article>)}{!game.seenDialogueIds.length&&<p className="panel-intro">읽은 대사가 아직 없습니다.</p>}</div>}
    </Sheet>}
    {modal==='map'&&(legacy?<Sheet title="지도" subtitle="창고의 동선" close={close}>
      <div className="map-heading"><div><small>현재 위치</small><strong>{roomNames[game.sceneId]}</strong></div><span className="pill">탐색 중</span></div>
      <div className="floor-plan"><svg viewBox="0 0 330 245" aria-hidden="true"><path d="M60 55h215v155H60zM165 55v155M60 130h215" fill="none" stroke="#a8b6a8" strokeWidth="2" strokeDasharray="5 6"/><path d="M60 55h95v65H60zM175 55h100v65H175zM175 140h100v70H175zM60 140h95v70H60z" fill="#d7ded0" stroke="#526b65" strokeWidth="2"/></svg>
        {([['R01',32,31],['R02',68,31],['R03',68,68],['R04',32,68]] as const).map(([id,x,y])=><button key={id} style={{left:x+'%',top:y+'%'}} className={'map-room '+(game.sceneId===id?'current':'')} disabled={!canVisit(game,id,'A')} onClick={()=>chooseView(id,'A')}><Icon name={canVisit(game,id,'A')?'map':'lock'}/><strong>{canVisit(game,id,'A')?roomNames[id]:'미확인 공간'}</strong><small>{game.sceneId===id?'현재 위치':canVisit(game,id,'A')?'이동 가능':'잠겨 있음'}</small></button>)}
      </div>
      <p className="map-legend"><span/>현재 위치 <i/>열린 구역 <Icon name="lock"/>잠긴 구역</p>
      <div className="island-locked"><Icon name="map"/><div><strong>섬 전체 지도</strong><p>섬의 지형을 알 수 있는 지도를 찾아야 한다.</p></div><Icon name="lock"/></div>
      <div className="chapter-route"><small>탈출 여정</small><strong>01 · 폐창고</strong><p>양식장 · 동굴 · 등대 · 분교 · 숲길…</p><span>다음 구역은 아직 확인하지 못했다.</span></div>
    </Sheet>:<Sheet title="지도" subtitle={has(game,'C04_07')?'연무도 전체 지도':'발견한 곳만 표시된다'} close={close}>
      <div className="map-heading"><div><small>현재 위치</small><strong>{placeName(game.sceneId)} · {viewName(game.sceneId,game.viewId)}</strong></div><span className="pill">{pad(chapter.no)}장</span></div>
      <div className={'island-map '+(has(game,'C04_07')?'revealed':'')}><img src={asset('island_map')} alt="연무도 지도"/>{chapters.filter((c,i)=>i<=chapterIndex(game.chapterId)||has(game,'C04_07')).map(c=>{const i=chapterIndex(c.id),ci=chapterIndex(game.chapterId);return <span key={c.id} className={'island-marker '+(c.id===here.id?'current':i<ci?'done':i>ci?'unknown':'')} style={{left:c.map.x+'%',top:c.map.y+'%'}}><b>{i>ci?'?':pad(c.no)}</b>{i<=ci&&<small>{c.place}</small>}</span>;})}{!has(game,'C04_07')&&<div className="island-fog"><Icon name="lock"/>섬 전체 지도 미확보</div>}</div>
      <small className="field-label">{here.title} · 이동할 곳</small>
      <div className="map-views">{here.def!.views.map(v=>{const ok=canVisit(game,here.def!.scene,v.id);return <button key={v.id} className={'map-room '+(game.viewId===v.id?'current':'')} disabled={!ok||!!dialogue} onClick={()=>chooseView(here.def!.scene,v.id)}><Icon name={ok?'map':'lock'}/><strong>{ok?v.name:'미확인 공간'}</strong><small>{game.viewId===v.id?'현재 위치':ok?'이동 가능':'잠겨 있음'}</small></button>;})}</div>
      {revisitOpen(game)&&<div className="chapter-route"><small>안전한 재방문 · 놓친 기록 보완</small>{chapters.filter(c=>c.def?.revisit).map(c=>{const missing=c.id==='CH02'?!game.evidenceIds.includes('E01'):!game.evidenceIds.includes('E02');return <button key={c.id} className="secondary full" disabled={!!dialogue||here.id===c.id} onClick={()=>chooseView(c.def!.scene,c.def!.startView)}>{pad(c.no)} · {c.place} 다시 가기 <small>{missing?'미확보 기록 있음':'기록 확보 완료'}</small></button>;})}{revisiting&&<button className="primary full" onClick={()=>chooseView(chapter.def!.scene,chapter.def!.startView)}>{pad(chapter.no)}장으로 돌아가기 <Icon name="next"/></button>}<span>폭풍(9장)이 오기 전까지만 다시 갈 수 있다.</span></div>}
    </Sheet>)}
    {modal==='hint'&&<Sheet title="스피커의 힌트" subtitle="필요한 만큼만 듣기" close={close}>
      <div className="radio-card"><Icon name="speaker"/><p>“기억이 막히면,<br/>주변을 다시 봐.”</p></div>
      {hint?<><label className="field-label" htmlFor="hint-target">지금 해결할 수 있는 과제</label><select id="hint-target" value={hint.id} onChange={e=>{setHintId(e.target.value);setHintLevel(0);}}>{candidateHints.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><div className="hint-stages">{[1,2,3].map(n=><article key={n} className={hintLevel>=n?'revealed':''}><small>{String(n).padStart(2,'0')} · {['주변 살피기','단서 연결하기','조작 확인하기'][n-1]}</small><p>{hintLevel>=n?hint.hints[n-1]:'아직 듣지 않은 힌트'}</p></article>)}</div><button className="primary full" disabled={hintLevel>=3} onClick={()=>{setHintLevel(v=>v+1);ping();}}>{hintLevel===0?'첫 힌트 듣기':hintLevel<3?'다음 힌트 듣기':'모든 힌트를 확인했다'} <Icon name="speaker"/></button>{showTide&&!inCave(game)&&<p className="small-note">동굴 안 과제는 썰물에 들어가야 할 수 있다. 입구에서 기다리기를 사용하세요.</p>}<p className="small-note">힌트 사용은 엔딩에 영향을 주지 않습니다.</p></>:<p className="panel-intro">{chapterComplete(game)?'이 장에서 할 일은 모두 마쳤다.':legacy?'지금은 열린 게이트를 통해 밖으로 나갈 수 있습니다.':'지금 바로 해결할 수 있는 과제가 없다. 다른 시점이나 지도를 확인해 보자.'}</p>}
    </Sheet>}
    {modal==='puzzle'&&<Sheet title={context.hotspot==='plate_detail'?'황동 명판':context.hotspot==='shelf_numbers'?'선반의 번호':hotspotName(game.sceneId,game.viewId,context.hotspot)} subtitle="확대 조사" close={close}>{legacy||context.hotspot==='plate_detail'?puzzleBody():<SeasonPanel game={game} hotspot={context.hotspot} perform={perform} ping={ping} close={close} timerMode={prefs.timer}/>}</Sheet>}
    {modal==='menu'&&<Sheet title={screen==='title'?'설정과 기록':'탐색 메뉴'} close={close}>
      <div className="tabs"><button className={menuTab==='settings'?'active':''} onClick={()=>setMenuTab('settings')}>설정</button><button className={menuTab==='save'?'active':''} onClick={()=>setMenuTab('save')}>저장 · 불러오기</button><button className={menuTab==='help'?'active':''} onClick={()=>setMenuTab('help')}>플레이 방법</button></div>
      {menuTab==='settings'&&<><div className="settings-section"><small>소리</small><label className="setting-row"><span><strong>효과음</strong><p>조사와 장치 조작에 작은 소리</p></span><input type="checkbox" checked={prefs.sound} onChange={e=>setPrefs({...prefs,sound:e.target.checked})}/></label><label className="slider-label">효과음 크기 <b>{prefs.volume}%</b><input type="range" min="0" max="100" value={prefs.volume} onChange={e=>setPrefs({...prefs,volume:Number(e.target.value)})} onPointerUp={()=>ping()}/></label></div>
        <div className="settings-section"><small>화면과 읽기</small><label className="slider-label">장면 밝기 <b>{prefs.brightness}%</b><input type="range" min="80" max="120" value={prefs.brightness} onChange={e=>setPrefs({...prefs,brightness:Number(e.target.value)})}/></label><div className="setting-row"><span><strong>대화 글자 크기</strong><p>대화와 안내 문장에 적용</p></span><div className="size-options">{[14,16,18].map(n=><button className={prefs.textSize===n?'active':''} key={n} onClick={()=>setPrefs({...prefs,textSize:n})}>{n===14?'작게':n===16?'보통':'크게'}</button>)}</div></div><label className="setting-row"><span><strong>타자 효과</strong><p>첫 탭은 전문, 다음 탭은 다음 대사</p></span><input type="checkbox" checked={prefs.typewriter} onChange={e=>setPrefs({...prefs,typewriter:e.target.checked})}/></label><label className="setting-row"><span><strong>움직임 줄이기</strong><p>전환과 강조 효과를 최소화</p></span><input type="checkbox" checked={prefs.reduceMotion} onChange={e=>setPrefs({...prefs,reduceMotion:e.target.checked})}/></label></div>
        <div className="settings-section"><small>위험 구간</small><div className="setting-row"><span><strong>제한 시간</strong><p>3장 동굴 수위와 9장 추격에 적용</p></span><div className="size-options">{([['standard','표준'],['relaxed','여유'],['off','끔']] as const).map(([id,label])=><button className={prefs.timer===id?'active':''} key={id} onClick={()=>setPrefs({...prefs,timer:id})}>{label}</button>)}</div></div></div>
        <button className="secondary full" onClick={()=>setPrefs(defaults)}>기본 설정으로 복원 <Icon name="reset"/></button>
      </>}
      {menuTab==='save'&&<><p className="panel-intro">퍼즐 성공과 이동 후 자동으로 저장됩니다. 별도로 남길 진행은 수동 슬롯에 보관하세요.</p>{confirmSlot&&confirmSlot!=='new'&&<div className="paper-note"><strong>지금 진행으로 이 기록을 갱신할까요?</strong><p>이전 기록은 백업에 남습니다.</p><div className="two-actions"><button className="secondary" onClick={()=>setConfirmSlot(null)}>취소</button><button className="primary" disabled={busy} onClick={()=>manualSave(confirmSlot)}>확인</button></div></div>}{['auto','slot1','slot2','slot3'].map((id,i)=><article className="save-slot" key={id}><div><small>{i===0?'자동 저장':'기록 '+i}</small><strong>{slots[i]?pad(chapterInfo(slots[i]!.state.chapterId).no)+'장 · '+placeName(slots[i]!.state.sceneId):'빈 기록'}</strong><span>{slots[i]?new Date(slots[i]!.savedAt).toLocaleString('ko-KR'):'아직 저장된 진행이 없습니다'}</span></div><div className="save-slot-actions">{i>0&&<button className="secondary" disabled={screen==='title'||busy||!!review} onClick={()=>slots[i]?setConfirmSlot(id):manualSave(id)}>저장</button>}<button className="secondary" disabled={!slots[i]||busy||!!review} onClick={()=>load(id)}>불러오기</button></div></article>)}{backupSlot&&<button className="secondary full" onClick={()=>load(backupSlot)}>이전 백업으로 복구</button>}</>}
      {menuTab==='help'&&<div className="help-page">{[['inspect','주변을 조사하세요','배경의 사물을 누르세요. 조사 표시를 켜거나 조사 목록으로 대상을 선택할 수도 있습니다.'],['inventory','물건을 챙기고 사용하세요','보관함에서 물건을 고르고 사용을 누른 뒤 배경의 대상을 누르세요.'],['combine','두 물건을 연결하세요','첫 물건의 조합을 누른 후 두 번째 물건을 선택하고 조합 확인을 누르세요.'],['notebook','기록을 다시 읽으세요','쪽지, 장치 설명, 방송은 수첩에 남습니다. E01~E04는 결말을 바꾸는 핵심 기록입니다.'],['map','다른 방을 탐색하세요','좌우 버튼은 같은 장소의 시점을 바꿉니다. 지도에서 열린 곳으로 바로 이동할 수 있습니다.'],['tide','물때와 위험 구간','3장 동굴은 썰물에만 들어갈 수 있고, 안에서는 물이 차오르기 전에 나와야 합니다. 설정에서 제한 시간을 늘리거나 끌 수 있습니다.'],['hint','필요한 만큼 힌트를 들으세요','힌트는 위치, 해석, 조작의 세 단계로 나뉩니다.']].map(([name,title,text])=><article key={name}><Icon name={name}/><div><h3>{title}</h3><p>{text}</p></div></article>)}<p className="small-note">대화와 메뉴를 보는 동안에는 위험 타이머가 멈춥니다.</p></div>}
      {screen==='game'&&<button className="text-button full" onClick={returnTitle}>타이틀로 돌아가기</button>}
    </Sheet>}
    {confirmSlot==='new'&&<Sheet title="새롭게 시작할까요?" close={()=>setConfirmSlot(null)}><p className="body-copy">현재 자동 저장은 이전 백업에 남고 새로운 진행으로 바뀝니다.</p><div className="two-actions"><button className="secondary" onClick={()=>setConfirmSlot(null)}>취소</button><button className="primary" onClick={startNew}>확인</button></div></Sheet>}
    {notice&&!modal&&!(screen==='game'&&showEnding)&&<div className="toast" role="status" aria-live="polite">{rewards.length>0&&<div className="reward-images">{rewards.map(id=><img key={id} src={itemAsset(id)} alt={itemNames[id]}/>)}</div>}<span>{notice}</span><button onClick={()=>setNotice('')} aria-label="안내 닫기"><Icon name="close" light/></button></div>}
  </div></NoticeContext.Provider>;
}
