# 표류도 웹과 모바일 기술 명세

사용자의 확정 요구는 **웹에서 실행한 뒤 모바일 앱으로 확장**하는 것이다. 기본 구현은 React·TypeScript·Vite의 정적 웹 앱이며, 고정 배경과 DOM 버튼으로 탐색·대화·퍼즐을 만든다. 모바일 앱은 같은 빌드 결과를 Capacitor에 포함한다. 첫 구현에 3D 엔진이나 별도 게임 프레임워크는 필요하지 않다.

그래픽 기준은 **검은방 3의 전반적인 분위기를 참고한 현대적인 고해상도 2D**다. 2D 배경·인물·조명 레이어와 반응형 UI로 구현하고 아트 원본 해상도와 표시용 CSS 좌표를 구분한다. UI 구성과 게임 규칙은 표류도의 명세를 따른다.

Capacitor는 웹 코드를 기반으로 Android·iOS 네이티브 컨테이너와 기기 API를 연결할 수 있다. [Capacitor 공식 소개](https://capacitorjs.com/docs). 실제 앱 품질은 터치·안전 여백·저장·중단 복구를 기기에서 별도로 검증해야 한다.

## 현재 구현 상태

React 19.3.0·Vite 8.3.2·TypeScript 7.0.2 기반 웹 UI와 1챕터 P01~P25가 구현됐다. 런타임은 Node 24.19.0에서 검증했다. 기존 제안 중 조수·오프라인·앱 저장 어댑터·Capacitor 패키징은 후속 작업이다. 현재 파일 구조·실행 방법·화면·검증은 [실행 UI 기록](07_UI_IMPLEMENTATION.md)을 우선한다. 폰트는 프로젝트에 포함한 Pretendard Variable이다.

## 개발 구성

| 영역 | 선택과 이유 |
| --- | --- |
| 화면 | React와 CSS, 고해상도 2D 배경·인물·효과 레이어와 정규화 핫스폿 버튼 |
| 게임 규칙 | UI와 분리된 순수 TypeScript 함수, 퍼즐 데이터를 읽는 공통 실행기 |
| 초기 구성 | Vite `react-ts` 템플릿 |
| 상태 | 순수 상태 전이 함수 + React 상태, 과도한 전역 라이브러리 추가 없음 |
| 데이터 검사 | JSON 구조 및 ID 참조 검사. Zod 또는 동일 기능의 작은 타입 검사기 |
| 단위 검증 | 현재 Node 내장 테스트, 핵심 상태 전이·소모·중복·세이브. 조수 검증은 추후 |
| 사용자 흐름 | Playwright로 새 게임·완주·새로고침·작은 화면 검증 |
| 웹 저장 | IndexedDB, 슬롯·백업·메타데이터 |
| 앱 저장 | 소형 세이브는 Capacitor Preferences 어댑터, 자산은 앱 번들 |
| 오프라인 | 웹 안정화 후 Service Worker의 버전별 전체 자산 캐시 |
| 앱 확장 | Capacitor core·cli·Android를 같은 지원 메이저 버전으로 고정 |

라이브러리 버전과 Node 요구 버전은 첫 구현에서 공식 가이드를 확인하고 `pnpm-lock.yaml`으로 고정한다. 최신 버전을 기억으로 추정해 적지 않는다. [Vite 시작 가이드](https://vite.dev/guide/). 아래 명령은 개발자가 실행할 작업 순서 예시이며 이 문서 작성 중 실행한 기록이 아니다.

```text
npm create vite@latest . -- --template react-ts
npm install
npm run dev
npm run build
```

문서와 데이터가 이미 존재하므로 생성 도구가 비어 있지 않은 폴더를 이유로 기존 파일 삭제를 요구하면 취소하고 필요한 템플릿 파일만 추가한다. 게임 루트는 이 폴더로 유지한다. 새 프로젝트를 중첩 생성해 문서와 소스가 서로 다른 루트를 보지 않게 한다.

## 제안 폴더 구조

```text
docs/                         이 명세 문서
data/ch01.puzzles.json        정답과 보상의 유일한 기준
public/assets/ch01/           배경과 근접 이미지
public/assets/portraits/       초상
public/assets/items/           아이콘
public/assets/audio/           소리
src/app/                      App, 화면 레이아웃, 오류 처리
src/domain/                   types, reducer, puzzleEngine, inventory, tide, ending
src/content/                  sceneManifest, hotspots, dialogue, clueText, itemDescriptions
src/components/               SceneView, DialogueBox, Inventory, Keypad, Notebook, Map
src/platform/                 SaveRepository, browserSave, nativeSave, lifecycle, audio
src/styles/                   tokens, layout, components
tests/unit/                   의미 있는 도메인 검증
tests/e2e/                    플레이 흐름
capacitor.config.ts           앱 확장 단계에서 생성
android/                      앱 확장 단계에서 생성
ios/                          macOS 환경 확보 후 생성
```

퍼즐 JSON은 개발 중 파일로 import해 번들에 포함한다. 파일 URL이나 외부 API로 읽지 않는다. 웹 배포는 정적 호스팅으로 충분하지만 저장 경로인 origin이 바뀌면 브라우저 저장 공간도 바뀐다. 배포 경로와 Vite `base`를 맞춰 이미지·음원이 404가 되지 않게 한다.

## 런타임 상태 계약

다음은 구현해야 할 타입 계약의 핵심이다. 필요에 따라 UI 타입을 추가하되 도메인 이름을 문서와 다르게 바꾸지 않는다.

```typescript
type SceneId = 'R01' | 'R02' | 'R03' | 'R04';
type TidePhase = 'LOW' | 'RISING' | 'HIGH' | 'FALLING';
type GameState = {
  schemaVersion: 1;
  contentVersion: string;                 // 최초 ch01.1
  chapterId: string;
  sceneId: SceneId;
  viewId: string;
  completedPuzzleIds: string[];           // 유일한 완료 사실
  inventory: Record<string, number>;
  evidenceIds: string[];
  flags: Record<string, boolean>;
  readClueIds: string[];
  seenDialogueIds: string[];
  dialogueQueue: { eventId: string; lineIndex: number }[];
  tide: { enabled: boolean; tick: number };
  danger: { enabled: boolean; remainingMs: number; checkpointId?: string };
  choices: Record<string, string>;
  playTimeMs: number;
};
type UiState = {
  selectedItemId: string | null;
  combineFirstItemId: string | null;
  modal: null | 'inventory' | 'notebook' | 'map' | 'hint' | 'menu' | 'puzzle';
  repeatProgress: Record<string, number>;
  puzzleDraft: unknown;
};
```

일시적인 키패드 입력·밸브 시험 각도·선택 강조는 `UiState`다. 저장에서 복구할 때 안전한 기본 상태로 초기화한다. P02의 3회 조작 중간 횟수는 저장할 필요가 없고, 완료 전 재실행 시 다시 0회다. 이미 완료했다면 보상을 다시 지급하지 않는다.

`flags`는 완료 정보에서 파생되는 세계 표현 보조 값이다. 문·전원·배수 같은 주요 조건은 `completedPuzzleIds`를 기준으로 검사하며 플래그와 충돌하면 저장 검사에서 발견한다. CH01 종료 플래그 `chapter_complete`는 P25와 같이 저장한다.

## 퍼즐 데이터 계약

`data/ch01.puzzles.json`의 루트는 `schemaVersion`, `chapterId`, `contentVersion`, `items`, `puzzles`다. 각 퍼즐은 아래 필드를 갖는다.

| 필드 | 의미 |
| --- | --- |
| id, title, category | 고유 ID, 제목, core 또는 action |
| mode | inspect, repeat, use, code, combine, arrange, switch, valves, move |
| location | sceneId·viewId·hotspotId. ANY는 인벤토리 작업 위치 자유 |
| requiresCompleted | 전부 완료해야 하는 ID 목록 |
| requiresItems | 보유 수량 1 이상인 아이템 목록 |
| clue | 화면에 존재해야 할 단서 요약 |
| expectedAnswer | 모드에 맞는 문자열·수치·객체·배열·boolean |
| effects | consumeItems, grantItems, grantEvidence, setFlags, 선택적 transition |
| hints | 위치·해석·정확한 조작의 세 문자열 |
| failText, repeatText | 실패와 완료 후 재조사 응답 |

`inspect`·`move`는 사용자가 해당 버튼을 눌렀다는 true를 입력한다. `repeat`는 P02의 같은 조작 누적 횟수가 3 이상이면 3으로 정규화한다. `code`는 문자열 전체 일치다. `use`는 itemId와 targetId를 함께 비교한다. `combine`만 재료 배열 순서를 무시한다. `arrange`는 배열 순서를 유지한다. `valves`는 키 sea·tank·outlet의 정확한 값으로 비교하고 객체 키 순서에 의존하지 않는다.

클라이언트 게임이므로 번들에서 정답을 찾아낼 수 있다. 첫 제품은 싱글플레이이며 서버 검증이나 정답 암호화를 추가하지 않는다. 대신 개발자 정답·디버그 버튼이 플레이 UI에 나타나지 않게 한다.

## 성공 트랜잭션과 중복 방지

처리 순서는 **현재 공간 검증 → 선행 조건 → 아이템 보유 → 정답 → 완료 여부 → 새 상태 계산**이다. 완료된 퍼즐은 성공 보상 없이 `repeatText`만 반환하도록 실제 구현에서는 빠른 반환을 먼저 둘 수 있다. UI 잠금 여부는 별도 검사하며 대화나 모달 뒤에서 새 행동을 받지 않는다.

성공 시 하나의 reducer 전이에서 재료 소모·아이템 지급·증거 추가·플래그 설정·완료 ID 추가·장면 이동·대화 큐 추가를 함께 계산한다. 적용 도중 수량이 음수가 되면 전체 전이를 거부한다. 보상 연출의 종료 이벤트에서 아이템을 추가하지 않는다. 새 상태를 저장 대기열에 넣고 화면은 성공 결과를 표현한다.

P06과 P16은 두 보상을 모두 한 전이에서 지급한다. 100ms 간격으로 두 번 탭해도 최초 전이 이후 완료 상태를 다시 읽는다. React의 오래된 클로저에 있는 인벤토리를 덮어쓰지 않고 reducer 또는 함수형 갱신을 사용한다. 부수 효과 중 대화 자동 재생은 eventId로 중복 제거한다.

## 장면과 핫스폿

핫스폿은 `id, sceneId, viewId, rect, visibleWhen, enabledWhen, puzzleId, observationText`를 갖는다. 각 rect의 값은 0~1이며 최소 터치 영역은 별도로 CSS에서 확장한다. 관찰은 필수 단서 읽음 기록을 남길 수 있으나 퍼즐 성공을 대신하지 않는다.

배경과 핫스폿을 동일한 `position:relative` 장면 콘텐츠 영역에 둔다. 배경 `contain`으로 생긴 여백을 계산하고, 실제 이미지 표시 너비·높이에만 좌표를 적용한다. 예를 들어 표시 영역 가로 360에서 이미지가 300만 차지하면 버튼은 360이 아닌 300 기준으로 배치한다.

마우스·터치·펜 입력의 공통 기준은 Pointer Events다. [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events). 성공 처리는 버튼의 `click` 한 경로로 모으고 `touchend`와 `click`을 동시에 등록하지 않는다. 모달·방향 버튼·아이템 바에는 이벤트 버블링을 차단한다. 화면 이동에 드래그가 필수인 퍼즐은 첫 버전에 없다.

아트의 실제 크기는 production manifest를 따른다. 현재 배경 원본은 1145×1374, 초상은 기본 1024×1536이며 이전 제안 1440×1720·1600×2400으로 생성됐다고 간주하지 않는다. 배포 최적화 때 원본에서 표시용 크기를 생성한다. 자산 manifest에는 원본 ID, 배포 경로, 픽셀 크기, 밀도별 대체 파일, 상태 변화 레이어를 기록한다. 작은 폰과 큰 PC 프레임에 같은 최대 크기 파일을 무조건 보내지 않는다. 장면의 0~1 좌표는 자산 크기에 관계없이 유지하며, 움직이는 물체에는 핫스폿과 시각 레이어가 같은 변환을 사용한다. 효과 레이어는 입력을 받지 않는다.

## 대화와 입력 우선순위

입력 우선순위는 위험 시스템의 일시정지 화면 → 열린 모달 → 대화 → 아이템 사용 → 일반 탐색이다. Esc와 Android 뒤로는 모달 닫기 → 선택 아이템 취소 → 메뉴 열기 순서다. 타이틀로 이동할 때 현재 게임 저장을 먼저 요청하며 저장 실패는 명확히 알린다.

대화는 완성 텍스트와 lineIndex를 저장한다. 아직 읽지 않은 줄의 큐를 복구하며 음성을 처음부터 자동 재생하지 않는다. 타자 효과 켜짐 상태에서 첫 입력은 글자 전체 표시, 다음 입력은 다음 줄이다. 대사 입력이 뒤쪽 핫스폿으로 전달되지 않는다.

## 저장과 복구

웹은 IndexedDB의 동일 트랜잭션으로 슬롯과 이전 백업을 함께 기록한다. IndexedDB는 구조화된 데이터를 저장하고 트랜잭션을 제공한다. [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). 슬롯은 자동 1개·수동 3개다. 메타데이터에는 저장 시각, 장·장소, 콘텐츠 버전, generation을 포함한다.

앱 어댑터는 JSON으로 직렬화한 소형 세이브를 Preferences에 기록한다. Preferences는 가벼운 키·값 저장용이며 모바일에서 일반 localStorage 대신 사용할 수 있다. [Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences). 저장 하나의 목표 크기는 64KiB 이하이며 이미지·음원·긴 로그 원본을 넣지 않는다. 초당 저장하는 데이터베이스처럼 쓰지 않는다.

앱에서는 A·B 두 generation 키에 번갈아 세이브를 기록한다. envelope는 `{generation,payload,checksum}`이며 기록 후 읽어 확인한다. 복구 시 형식·체크섬이 유효한 최대 generation을 선택한다. 체크섬은 손상 감지용이지 위변조 방지용이 아니다. Preferences가 원자적 다중 키 트랜잭션을 보장한다고 가정하지 않는다. 설정은 별도 키에 저장한다.

자동 저장은 퍼즐 성공·장면 이동·주요 선택·대화 큐 위치 변경 후 직렬 대기열로 처리한다. 위험 타이머는 플레이 중 메모리에서 갱신하고 5초 간격 및 앱 중단 이벤트에서 잔여 값을 저장한다. 앱 중단 이벤트가 항상 실행된다고 가정하지 않으며 마지막 확정 세이브에서 복원해 잃는 진행을 제한한다. 위험 구간 체크포인트는 별도 보관한다.

불러오기 검사는 버전·타입·존재 ID·중복·수량·공간 접근 조건을 확인한다. 손상 시 이전 백업을 제안한다. 자동으로 초기화해 덮어쓰지 않는다. 마이그레이션은 `v1→v2`처럼 함수로 작성하고 원본을 백업한다. 수동 저장 내보내기·가져오기 기능은 웹과 앱 사이의 이동 수단이며 자동 클라우드 동기화는 범위에 없다.

## 조수와 앱 중단

일반 조수는 `tick % 12`의 0~3 LOW, 4~5 RISING, 6~9 HIGH, 10~11 FALLING이다. 확정 이동 또는 기다리기만 tick을 1 증가시킨다. 조사를 여러 번 눌러 시간을 벌거나 잃지 않는다. CH01은 `enabled=false`이며 테스트 전용 장면에서 동작을 먼저 검증한다.

위험 구간은 tick을 동결하고 `remainingMs`만 active play 시간으로 감소시킨다. `performance.now()`의 프레임 간 차이를 사용하며 `Date.now()`와 현실 경과 시간으로 수위를 진행시키지 않는다. `document.visibilitychange` 및 앱의 `appStateChange`에서 일시정지·저장을 요청한다. 앱 전경·배경 이벤트는 공식 App 플러그인이 제공한다. [Capacitor App](https://capacitorjs.com/docs/apis/app).

메뉴·수첩·대화 중에는 위험 시간을 차감하지 않는다. 재개 시 ‘계속하기’를 한 번 눌러 조작 가능 상태로 돌아온다. 남은 시간이 0이면 안전 복귀를 한 번만 실행하고 체크포인트의 인벤토리·완료 상태를 같이 복구한다. 진행의 일부만 되돌려 필수 아이템을 잃게 하지 않는다.

## 웹 빌드와 오프라인

개발 초기에는 Service Worker를 등록하지 않아 오래된 캐시가 디버깅을 방해하지 않게 한다. 완주 검증 후 빌드 manifest 기반 캐시를 추가한다. 앱 코드·필수 배경·한국어 폰트·오디오를 모두 캐시한 뒤에만 ‘오프라인 준비됨’을 표시한다. 실패한 자산을 성공으로 표시하지 않는다.

새 콘텐츠 버전이 있으면 플레이 중 즉시 새로고침하지 않고 타이틀에서 업데이트를 적용한다. 기존 저장 콘텐츠 버전과 호환되는지 확인한다. 개인정보 모드·브라우저 데이터 삭제·앱 삭제에서는 저장을 잃을 수 있으므로 저장 내보내기를 제공한다. 앱에서는 번들 자산을 사용하고 웹 Service Worker 등록을 생략한다.

성능 제작 목표는 선택된 해상도 세트 기준 첫 1챕터 필수 전송량 20MB 이하, 장면 배경 1장 약 400KB~1.2MB 범위, 현재 장면과 인접 장면만 미리 로드다. 압축으로 조사 대상이나 인물 윤곽이 뭉개지면 해상도 세트와 로드 순서를 조정한다. 이는 초기 예산이며 실제 아트와 기기 측정으로 수정한다. 낮은 해상도 세트와 높은 해상도 세트를 모두 첫 로드에 중복 다운로드하지 않는다. 모든 초상과 10챕터 음원을 시작 시 로드하지 않는다. 오디오 재생은 첫 사용자 입력 이후 활성화한다.

## 모바일 앱 전환 절차

웹 빌드가 통과한 뒤 Capacitor 패키지를 설치하고 `webDir=dist`로 설정한다. 로컬 웹 빌드를 동기화해 Android 프로젝트를 생성하고 Android Studio에서 기기 실행을 검증한다. [Capacitor 개발 흐름](https://capacitorjs.com/docs/basics/workflow).

```text
npm install @capacitor/core @capacitor/android @capacitor/app @capacitor/preferences
npm install -D @capacitor/cli
npx cap init
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

설치 시 공식 지원 버전·Node·JDK·SDK 요구 조건을 다시 확인하고 선택한 버전을 기록한다. `appId`는 개발자가 소유할 실제 패키지 식별자를 확정한 뒤 정하며 출시용 식별자를 임의로 등록하지 않는다. 위 명령은 스토어 배포를 수행하지 않는다.

iOS는 macOS·Xcode·서명 환경에서 플랫폼을 추가하고 플러그인별 요구 설정을 검토한다. 이 Windows 작업 폴더에서 iOS 실기기 빌드를 검증했다고 보고하지 않는다. 웹과 Android가 정상이어도 iOS 오디오·백그라운드·안전 여백은 별도로 확인한다.

## 기술 검증 우선순위

먼저 P03·P08·P14·P21의 소모와 보상, 중복 성공 방지, P25까지 도달 가능성을 검증한다. 그다음 저장 복원과 브라우저 새로고침, 320~480px 레이아웃, 배경 교체 후 좌표를 확인한다. Service Worker·앱 패키징·스토어 설정은 웹 핵심 흐름이 검증된 뒤 수행한다.
