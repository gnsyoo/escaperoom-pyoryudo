# 표류도 시즌 1 — 2~10장 구성 명세

이 문서는 2~10장의 장면·진행 단계·정답·엔딩 조건을 개발과 검수용으로 정리한다. **정답과 결말 스포일러가 있다.** 1장은 [1챕터 상세 명세](02_CHAPTER01_SPEC.md)를 따른다. 실제 기준 데이터는 [src/content/season.ts](../src/content/season.ts)이며, 이 표는 그 데이터에서 생성했다.

## 공통 규칙

- 각 장은 하나의 장면(C02~C10)과 3~4개의 시점(A~D)으로 구성된다. 시점마다 열리는 조건(`requires`)이 있다.
- 퍼즐 방식은 조사·사용·조합·번호(숫자/영문)·다이얼·순서·선택·추격·반복·이동이다. 오답은 짧은 이유를 알려 주고 아이템을 소모하지 않는다.
- 장을 마치면 그 장의 아이템은 정리된다. 조수 관측 시계(→3장), 중계 열쇠(→4장), 원본 백업 드라이브(→10장)만 다음 장으로 이어진다.
- 숫자·글자 단서는 배경 그림에 굽지 않고 UI 문서로 그린다. 확대 화면은 현재 배경을 해당 위치로 확대해 보여 준다.
- **3장 조수**: 기본 12틱 주기(썰물 4 · 밀물 2 · 만조 4 · 낙조 2, 1틱=5분). 입구에서 ‘5분 기다리기/썰물까지’로 진행한다. 썰물에만 입장할 수 있고, 입장 순간이 체크포인트다. 동굴 안 제한 시간은 표준 180초 · 여유 360초 · 끔이며 대화·메뉴·수첩·힌트·지도를 보는 동안 멈춘다. 90·45·15초에 경고하고, 초과하면 입구로 후퇴하며 동굴 안 진행을 되돌리고 만조로 바뀐다. 스스로 물러나면 진행은 유지되고 밀물로 바뀐다.
- **9장 추격**: 소리 단서 3회에 맞춰 숨을 곳을 고른다. 틀리거나 시간(표준 20초 · 여유 40초 · 끔)이 지나면 처음부터 다시 한다.
- **재방문**: 4장에서 섬 지도를 얻은 뒤 5~8장 동안 지도에서 2장·4장으로 다시 가서 선택 기록 E01·E02를 보완할 수 있다.

## 엔딩

엔딩은 10장 마지막 선택(C10_12) 직후 한 번 평가한다. 선택 화면에는 확보한 핵심 기록 수만 보여 준다.

| 엔딩 | 조건 |
| --- | --- |
| B 침묵의 섬 | 마지막 대면에서 `violence` 선택. 마지막 선택으로 돌아가 다시 고를 수 있다 |
| T 기억의 귀환 | `nonviolent` + E01~E04 모두 확보 + 8장 `acknowledged_responsibility` + 9장 `all_rescued`(협력) |
| N 표류 끝 | B가 아니고 T 조건을 하나라도 채우지 못함. 빠진 조건에 맞는 문장이 덧붙는다 |

## CH02 수면 아래 — 폐양식장 관리동

수조의 물을 빼 해안길을 연다. 시점: A 관리동 사무실 · B 양식 수조 구역 · C 펌프실. 완료 단계 C02_09 · 5~8장 사이 재방문 가능.

| ID | 구분 | 위치 | 단계 | 방식 | 선행 | 정답·조작 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C02_01 | 진행 | A:ops_ledger | 관측 일지 읽기 | 조사 | — | — | 단서 관측 일지 (8년 전 9월) |
| C02_02 | 진행 | A:desk_tray | 펌프실 열쇠 찾기 | 조사 | — | — | +pump_key |
| C02_03 | 진행 | B:pump_shed | 펌프실 열기 | 사용 | pump_key | pump_key → pump_shed | pump_room_open=true |
| C02_04 | 진행 | B:level_gauge | 수위계 확인 | 조사 | — | — | 단서 주 수조 수위계 |
| C02_05 | 진행 | C:pipe_plate | 배관도 읽기 | 조사 | — | — | 단서 펌프실 배관도 |
| C02_06 | 핵심 | C:pump_panel | 목표 수위까지 배수 | 다이얼 | — | off → open → closed → 10 | tank_drained=true |
| C02_07 | 진행 | B:level_gauge | 관측함의 시계 | 조사 | C02_06 | — | +tide_watch, 단서 조수 관측 시계 사용법 |
| C02_08 | 선택 | A:locked_drawer | 잠긴 서랍 (선택) | 번호 | — | 0914 | 증거 E01 |
| C02_09 | 진행 | B:coast_road | 해안길로 나가기 | 이동 | C02_06, C02_07 | — | 장 완료 |

## CH03 바다가 닫히기 전에 — 해안 동굴

썰물에 동굴로 들어가 중계 열쇠를 찾는다. 시점: A 동굴 입구 · B 반사판 구역 · C 안전 대피 선반. 완료 단계 C03_08.

| ID | 구분 | 위치 | 단계 | 방식 | 선행 | 정답·조작 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C03_01 | 진행 | A:tide_gauge | 조위 표척 읽기 | 조사 | — | — | 단서 동굴 통행 안내판 |
| C03_02 | 핵심 | A:cave_mouth | 썰물에 동굴 들어가기 | 이동 | tide_watch | — | — |
| C03_03 | 진행 | B:supply_crate | 예비 반사판 찾기 | 조사 | — | — | +reflector_disk |
| C03_04 | 진행 | B:reflector_2 | 금 간 반사판 교체 | 사용 | reflector_disk | reflector_disk → reflector_2 | −reflector_disk |
| C03_05 | 핵심 | B:reflectors | 반사판으로 표적 비추기 | 다이얼 | C03_04 | se → e → n | target_lit=true |
| C03_06 | 진행 | C:evac_marks | 대피 표식 읽기 | 조사 | — | — | 단서 벽에 새겨진 대피 표식 |
| C03_07 | 핵심 | C:relay_box | 비상 연락함 열기 | 번호 | — | 2005 | +relay_key |
| C03_08 | 진행 | C:ledge_exit | 선반길로 빠져나가기 | 이동 | relay_key | — | 장 완료 |

## CH04 꺼진 등대 — 등대

중계 장치를 살리고 렌즈를 맞춘다. 시점: A 등대 입구 · B 등대 계단 · C 렌즈실 · D 기록실. 완료 단계 C04_09 · 5~8장 사이 재방문 가능.

| ID | 구분 | 위치 | 단계 | 방식 | 선행 | 정답·조작 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C04_01 | 진행 | A:maint_cabinet | 렌즈 손잡이 찾기 | 조사 | — | — | +lens_crank |
| C04_02 | 진행 | A:landmark_frame | 해도 액자 보기 | 조사 | — | — | 단서 등대 해도 액자 |
| C04_03 | 진행 | A:stair_gate | 계단 철문 열기 | 이동 | — | — | stairs_open=true |
| C04_04 | 진행 | B:relay_cabinet | 중계함 전원 넣기 | 사용 | relay_key | relay_key → relay_cabinet | −relay_key, relay_power=true |
| C04_05 | 핵심 | C:relay_terminal | 모스 신호 해독 | 번호 | C04_04 | HAK | 단서 등대 중계 기록 (출력지) |
| C04_06 | 핵심 | C:lens_collar | 렌즈 정렬 | 다이얼 | C04_05, lens_crank | tri | lighthouse_lit=true |
| C04_07 | 핵심 | D:map_board | 섬 지도 확보 | 조사 | C04_06 | — | 증거 island_map, map_full=true |
| C04_08 | 선택 | D:file_drawer | 접수 원본 서랍 (선택) | 번호 | — | 1840 | 증거 E02 |
| C04_09 | 진행 | A:outer_door | 분교로 향하기 | 이동 | C04_06, C04_07 | — | 장 완료 |

## CH05 마지막 출석 — 분교

사진과 자리표로 사물함 순서를 찾는다. 시점: A 분교 복도 · B 교실 · C 교무실 · D 자료실. 완료 단계 C05_10.

| ID | 구분 | 위치 | 단계 | 방식 | 선행 | 정답·조작 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C05_01 | 진행 | A:display_board | 학급 사진 보기 | 조사 | — | — | 단서 게시판의 학급 사진 |
| C05_02 | 진행 | B:seating_chart | 자리표 보기 | 조사 | — | — | 단서 교실 자리표 |
| C05_03 | 진행 | A:shoe_cabinet | 교무실 열쇠 찾기 | 조사 | — | — | +staff_key |
| C05_04 | 진행 | A:staff_door | 교무실 열기 | 사용 | staff_key | staff_key → staff_door | — |
| C05_05 | 진행 | C:attendance | 출석부 보기 | 조사 | — | — | 단서 출석부 |
| C05_06 | 핵심 | C:lockers | 조퇴한 아이들의 사물함 | 순서 | — | 3 → 5 → 6 | +archive_key |
| C05_07 | 진행 | C:archive_door | 자료실 열기 | 사용 | archive_key | archive_key → archive_door | hyejin_found=true |
| C05_08 | 진행 | D:photo_album | 사진첩의 기억 | 조사 | — | — | 단서 사진첩 — 조사팀 방문 |
| C05_09 | 이야기 | D:hyejin | 혜진의 증언 | 조사 | C05_08 | — | +forest_key, hyejin_rescued=true |
| C05_10 | 진행 | A:back_gate | 높은 숲길로 | 사용 | forest_key | forest_key → back_gate | 장 완료 |

## CH06 숲의 목격자 — 높은 숲길

덫을 해제하고 다리를 보강한다. 시점: A 숲길 갈림길 · B 덫 설치 지점 · C 임시 다리. 완료 단계 C06_08.

| ID | 구분 | 위치 | 단계 | 방식 | 선행 | 정답·조작 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C06_01 | 진행 | A:signpost | 이정표와 고정핀 | 조사 | — | — | +safety_pin, 단서 이정표 |
| C06_02 | 진행 | A:fence | 울타리 끈 풀기 | 조사 | — | — | +vine_rope |
| C06_03 | 진행 | B:tension_rig | 장력 장치 살피기 | 조사 | — | — | 단서 장력 장치 표찰 |
| C06_04 | 핵심 | B:tension_rig | 덫 해제 | 순서 | C06_03, safety_pin | pin_high → lever → detach | −safety_pin, trap_disarmed=true |
| C06_05 | 진행 | C:plank_pile | 보강 판자 고르기 | 조사 | — | — | +repair_plank |
| C06_06 | 핵심 | ANY:inventory | 판자에 끈 묶기 | 조합 | C06_02, C06_05, repair_plank, vine_rope | repair_plank → vine_rope | +lashed_plank, −repair_plank, −vine_rope |
| C06_07 | 진행 | C:bridge_gap | 다리 보강 | 사용 | lashed_plank | lashed_plank → bridge_gap | −lashed_plank, bridge_fixed=true |
| C06_08 | 진행 | C:far_path | 다리를 건너 초소로 | 이동 | C06_07 | — | 장 완료 |

## CH07 응답 없는 주파수 — 군 초소

무전 기록을 복구하고 감시선을 추적한다. 시점: A 초소 입구 · B 무전실 · C 통신 자료실. 완료 단계 C07_09.

| ID | 구분 | 위치 | 단계 | 방식 | 선행 | 정답·조작 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C07_01 | 진행 | A:ammo_box | 철제 상자 열기 | 조사 | — | — | +radio_connector |
| C07_02 | 진행 | A:post_door | 초소 철문 열기 | 이동 | — | — | minseok_found=true |
| C07_03 | 진행 | B:transceiver | 무전기 수리 | 사용 | radio_connector | radio_connector → transceiver | −radio_connector, radio_fixed=true |
| C07_04 | 진행 | B:freq_chart | 주파수표 읽기 | 조사 | — | — | 단서 현장 주파수표 |
| C07_05 | 핵심 | B:transceiver | 구조 요청 송신 | 다이얼 | C07_03 | C → CG | rescue_failed=true |
| C07_06 | 진행 | C:patch_panel | 배선반 확인 | 조사 | — | — | 단서 배선반 |
| C07_07 | 핵심 | C:codebook | 그날의 녹음 열람 | 번호 | — | 7246 | 증거 E03 |
| C07_08 | 진행 | C:wall_cable | 케이블 추적 | 조사 | C07_07 | — | 단서 벽을 뚫고 나가는 케이블 |
| C07_09 | 진행 | C:wall_cable | 감시자의 집으로 | 이동 | C07_08 | — | 장 완료 |

## CH08 감시자의 방 — 감시자의 거처

감시자의 정체와 원본을 확보한다. 시점: A 거실 · B 감시 모니터실 · C 피해자 기록실 · D 원본 보관 작업실. 완료 단계 C08_12.

| ID | 구분 | 위치 | 단계 | 방식 | 선행 | 정답·조작 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C08_01 | 진행 | A:work_jacket | 작업 점퍼의 명찰 | 조사 | — | — | 단서 작업 점퍼의 명찰, taeo_identified=true |
| C08_02 | 진행 | A:key_bowl | 그릇 속 열쇠 | 조사 | — | — | +monitor_key |
| C08_03 | 진행 | A:inner_door | 안쪽 문 열기 | 사용 | monitor_key | monitor_key → inner_door | — |
| C08_04 | 진행 | B:corkboard | 메모판 읽기 | 조사 | — | — | 단서 모니터실 메모판 |
| C08_05 | 핵심 | B:playback | CCTV 시각 보정 | 다이얼 | C08_04 | -12 | 단서 동기화한 CCTV |
| C08_06 | 진행 | C:case_folders | 사건 파일 네 권 | 조사 | — | — | 단서 사건 파일 네 권 |
| C08_07 | 진행 | C:open_folder | 펼친 파일 | 조사 | — | — | 단서 펼친 파일 — 윤서희 |
| C08_08 | 핵심 | C:work_door | 작업실 번호 | 번호 | — | 0917 | — |
| C08_09 | 진행 | D:gray_case | 백업 드라이브 | 조사 | — | — | +backup_drive |
| C08_10 | 이야기 | D:photo_frame | 엎어 둔 액자 | 조사 | — | — | — |
| C08_11 | 핵심 | D:computer | 원본 백업 | 선택 | C08_05, backup_drive | ✗ edit / ✗ cam1 / ○ sync / ✗ visit (기본 sync) | 증거 E04 |
| C08_12 | 이야기 | D:computer | 서명의 무게 | 선택 | C08_11 | ○ ack / ○ deny (기본 ack) | ack:acknowledged_responsibility=true, deny:acknowledged_responsibility=false, 장 완료 |

## CH09 폭풍의 밤 — 중앙 발전실

정전된 섬에서 발전기를 살리고 동료를 구한다. 시점: A 중앙 발전실 · B 피난 대기실 · C 은신 통로. 완료 단계 C09_06.

| ID | 구분 | 위치 | 단계 | 방식 | 선행 | 정답·조작 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C09_01 | 진행 | C:cart | 수레 위의 퓨즈 | 조사 | — | — | +generator_fuse |
| C09_02 | 진행 | C:closet | 재가동 지침 | 조사 | — | — | 단서 발전기 재가동 지침 |
| C09_03 | 핵심 | C:doorway | 손전등을 피해서 | 추격 | — | column → closet → cart | — |
| C09_04 | 핵심 | A:generator | 발전기 재가동 | 순서 | C09_02, generator_fuse | all_off → fuse → fuel → start → sw3 → sw2 | −generator_fuse, power_restored=true |
| C09_05 | 이야기 | B:shelter_door | 피난실 문 앞 | 조사 | — | — | — |
| C09_06 | 이야기 | B:shelter_door | 협력 또는 강행 | 선택 | C09_05 | ○ cooperate / ○ force (기본 cooperate) | cooperate:all_rescued=true, force:all_rescued=false, 장 완료 |

## CH10 새벽의 선착장 — 선착장

보트를 고치고 안전한 출항 시각을 찾는다. 시점: A 새벽 선착장 · B 보트 정비 · C 출항 관측 구역. 완료 단계 C10_12.

| ID | 구분 | 위치 | 단계 | 방식 | 선행 | 정답·조작 | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C10_01 | 진행 | A:net_crates | 연료 호스 찾기 | 조사 | — | — | +fuel_hose |
| C10_02 | 진행 | A:pier_box | 시동 열쇠 찾기 | 조사 | — | — | +boat_key |
| C10_03 | 진행 | B:manual_holder | 정비 설명서 | 조사 | — | — | 단서 보트 정비 설명서 |
| C10_04 | 진행 | B:tool_bench | 접점 도구 찾기 | 조사 | — | — | +contact_tool |
| C10_05 | 진행 | B:fuel_port | 연료 호스 연결 | 사용 | fuel_hose | fuel_hose → fuel_port | −fuel_hose, hose_connected=true |
| C10_06 | 진행 | B:fuel_port | 프라이밍 벌브 | 반복 | C10_05 | 3 | — |
| C10_07 | 진행 | B:contact_point | 점화 접점 청소 | 사용 | contact_tool | contact_tool → contact_point | contacts_clean=true |
| C10_08 | 핵심 | B:helm | 시동 시험 | 사용 | C10_06, C10_07, boat_key | boat_key → helm | engine_ready=true |
| C10_09 | 진행 | C:tide_board | 조수표 읽기 | 조사 | — | — | 단서 조수표 — 오늘 새벽 |
| C10_10 | 진행 | C:lighthouse | 등대 신호 확인 | 조사 | — | — | 단서 등대 신호 일정 |
| C10_11 | 핵심 | C:mooring | 출항 시각 정하기 | 다이얼 | C10_08 | 0530 | departure_set=true |
| C10_12 | 이야기 | C:mooring | 마지막 대면 | 선택 | C10_11 | ○ nonviolent / ○ violence (기본 nonviolent) | nonviolent:ending_violence=false, violence:ending_violence=true, 장 완료 |

