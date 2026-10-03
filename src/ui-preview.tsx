import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import type { ReviewState } from './App.tsx';
import { advanceDialogue, attempt, moveTo, newGame, puzzles, readClue, validateState } from './domain/game.ts';
import type { GameState, SceneId } from './domain/game.ts';
import './styles.css';
import './ui-preview.css';

// Review states replay the real puzzle rules. This entry never writes player saves.
function drain(s:GameState){while(s.dialogueQueue.length)s=advanceDialogue(s);return s;}
function progress(count:number):GameState {
  let s=drain(newGame());
  for(const p of puzzles.slice(0,count)){
    if(p.location.sceneId!=='ANY')s=moveTo(s,p.location.sceneId as SceneId,p.location.viewId);
    const result=attempt(s,p.id,p.expectedAnswer);
    if(result.status!=='success')throw new Error('검토 화면의 진행 오류: '+p.id);
    s=drain(result.state);
  }
  if(count>=15)for(const clue of ['calendar','duty_roster','shelf_numbers'])s=readClue(s,clue);
  return validateState(s);
}
const place=(s:GameState,scene:SceneId,view:string)=>moveTo(s,scene,view);
type Example={id:string;label:string;description:string;state:ReviewState};
const broadcast=advanceDialogue(newGame());
export const examples:Example[]=[
  {id:'title',label:'타이틀',description:'햇빛과 바다, 섬의 첫인상',state:{game:newGame(),screen:'title'}},
  {id:'home',label:'게임 홈',description:'이어하기 · 기록 · 챕터 목록',state:{game:progress(15),screen:'home'}},
  {id:'explore',label:'탐색',description:'원본 배경 · 조사 지점 · 시점 전환',state:{game:place(progress(6),'R01','B'),screen:'game',markers:true}},
  {id:'broadcast',label:'스피커 방송',description:'배경 위에 읽기 쉬운 대화 패널',state:{game:broadcast,screen:'game'}},
  {id:'inventory',label:'인벤토리',description:'투명 아이템 · 상세 설명 · 사용과 조합',state:{game:progress(18),screen:'game',modal:'inventory',selected:'uv_lamp'}},
  {id:'combine',label:'아이템 조합',description:'두 재료 선택과 확인',state:{game:place(progress(6),'R01','B'),screen:'game',modal:'inventory',combine:'rope',combineSecond:'magnet'}},
  {id:'puzzle-code',label:'확대 퍼즐 · 잠금함',description:'장치 그림과 실제 숫자 입력',state:{game:place(progress(4),'R01','B'),screen:'game',modal:'puzzle',context:{hotspot:'cabinet_lock',assetId:'ch01_cabinet_lock'},code:'41'}},
  {id:'puzzle-circuit',label:'확대 퍼즐 · 회로도',description:'조각 위치를 바꿔 이어 붙이기',state:{game:place(progress(10),'R02','A'),screen:'game',modal:'puzzle',context:{hotspot:'desk_plan'}}},
  {id:'puzzle-breaker',label:'확대 퍼즐 · 배전함',description:'F1/F2 선택과 전원 복구',state:{game:place(progress(13),'R01','C'),screen:'game',modal:'puzzle',context:{hotspot:'fuse_socket',assetId:'ch01_breaker'}}},
  {id:'puzzle-calendar',label:'확대 퍼즐 · 달력',description:'읽을 수 있는 달력과 근무표',state:{game:place(progress(15),'R02','B'),screen:'game',modal:'puzzle',context:{hotspot:'calendar',assetId:'ch01_calendar'}}},
  {id:'puzzle-valves',label:'확대 퍼즐 · 밸브',description:'열림/닫힘이 보이는 장치 조작',state:{game:place(progress(20),'R03','B'),screen:'game',modal:'puzzle',context:{hotspot:'drain_valves',assetId:'ch01_valves'},valves:{sea:'closed',tank:'closed',outlet:'open'}}},
  {id:'puzzle-uv',label:'확대 퍼즐 · UV 명판',description:'문양 순서와 빛으로 나타난 숫자',state:{game:progress(23),screen:'game',modal:'puzzle',context:{hotspot:'plate_detail',assetId:'ch01_brass_plate'}}},
  {id:'notebook',label:'수첩',description:'관찰한 단서와 확보한 증거 목록',state:{game:progress(23),screen:'game',modal:'notebook'}},
  {id:'notebook-detail',label:'수첩 · 증거 상세',description:'배수 작업 절차를 다시 읽기',state:{game:progress(23),screen:'game',modal:'notebook',evidenceDetail:'drain_procedure'}},
  {id:'transcript',label:'수첩 · 대화 기록',description:'대사와 방송을 구분한 기록',state:{game:progress(15),screen:'game',modal:'notebook',notebookTab:'dialogue'}},
  {id:'map',label:'지도',description:'현재 위치 · 열린 방 · 잠긴 구역',state:{game:progress(21),screen:'game',modal:'map'}},
  {id:'settings',label:'설정',description:'소리 · 밝기 · 글자 · 움직임',state:{game:progress(15),screen:'game',modal:'menu'}},
  {id:'hint',label:'단계별 힌트',description:'방향부터 정답까지 세 단계',state:{game:progress(15),screen:'game',modal:'hint'}},
  {id:'complete',label:'챕터 완료',description:'첫 문을 연 뒤의 완료 화면',state:{game:progress(25),screen:'game'}}
];
const params=new URLSearchParams(location.search),focus=params.get('focus')==='1';
const chosen=examples.find(e=>e.id===params.get('screen'))||examples[1];
document.body.classList.toggle('review-focus',focus);
createRoot(document.getElementById('root')!).render(focus?<App review={chosen.state}/>:<div className="review-workspace"><aside className="review-sidebar"><small>표류도 · 화면 디자인</small><h1>기억의 해안</h1><p>현대적인 2D 미스터리<br/>완성 화면 19종</p><nav>{examples.map(e=><a key={e.id} href={'?screen='+e.id} aria-current={e===chosen?'page':undefined}>{e.label}</a>)}</nav><a className="play-link" href="./">게임 실행 →</a><small className="review-warning">진행 상황은 저장되지 않습니다.<br/>퍼즐 정답이 포함된 제작용 화면입니다.</small></aside><main className="review-main"><div className="review-caption"><small>SCREEN DESIGN · {chosen.id}</small><h2>{chosen.label}</h2><p>{chosen.description}</p></div><App key={chosen.id} review={chosen.state}/></main></div>);
