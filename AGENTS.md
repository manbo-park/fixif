# AGENTS.md

이 문서는 AI 에이전트가 fixif 프로젝트에서 작업할 때 참조하는 가이드입니다.

## 프로젝트 개요

**fixif** — Easy EXIF Edit (https://fixif.vercel.app/)

필름 카메라로 촬영 후 스캔한 JPEG 이미지의 EXIF 메타데이터를 일괄 편집하는 PC 웹 앱입니다. 자매 앱인 **filo**(프레임별 촬영 정보 기록 앱)와 클립보드를 통해 연동되어, filo에 기록한 롤 전체 정보를 스캔 이미지에 일괄 주입하는 것이 핵심 사용 시나리오입니다. 수동 편집도 전 필드에서 지원합니다.

**아키텍처 원칙**: 완전 클라이언트 사이드. 서버 없음. 이미지는 브라우저 밖으로 나가지 않습니다. 원본 파일은 끝까지 읽기 전용이며, 편집 결과는 메모리상의 "편집된 메타데이터" 레이어로 관리되고 내보내기 시점에만 새 파일로 기록됩니다.

## 기술 스택

- **프레임워크**: React 18 + TypeScript
- **번들러**: Vite 6
- **스타일**: Tailwind CSS v3
- **상태 관리**: Zustand (자체 히스토리 스택으로 Undo/Redo 구현, 최근 50개 상태 유지)
- **EXIF 읽기**: `exifr`
- **EXIF 쓰기**: `piexifjs`
- **드래그 앤 드롭 업로드**: `react-dropzone`
- **리스트 재정렬**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **ZIP 압축**: `jszip`
- **코드 품질**: ESLint + Prettier (`eslint-config-prettier`로 충돌 방지)
- **배포**: Vercel (정적 호스팅)

## 명령어

```bash
npm run dev      # 개발 서버 실행 (Vite)
npm run build    # tsc 타입 체크 후 프로덕션 빌드
npm run lint     # ESLint 검사
npm run preview  # 빌드 결과 미리보기
npm run format   # Prettier 포맷팅
```

## 디렉토리 구조

```
src/
├── App.tsx                 # 최상위 컴포넌트, 전역 단축키 핸들링
├── main.tsx                # 엔트리포인트
├── components/             # UI 컴포넌트
│   ├── Dropzone.tsx            # 파일 업로드 드롭존
│   ├── FrameTable.tsx          # 프레임 리스트 테이블 (행 = 프레임)
│   ├── FrameToolbar.tsx        # 상단 툴바 (Undo/Redo, 일괄 편집 등)
│   ├── SidePanel.tsx           # 단일 프레임 편집 사이드 패널
│   ├── BulkEditBar.tsx         # 다중 선택 시 액션 바
│   ├── BulkEditPanel.tsx       # 일괄 편집 패널
│   ├── ClipboardImportModal.tsx# filo 데이터 매칭 미리보기 모달
│   ├── ComboboxField.tsx       # 프리셋 + 자유입력 콤보박스
│   ├── ImagePreviewModal.tsx   # 이미지 미리보기/회전 모달
│   ├── ExportBar.tsx           # 내보내기 바
│   ├── SettingsPanel.tsx       # 설정 패널
│   └── Toast.tsx               # 토스트 알림
├── lib/                    # 도메인 로직 (UI 비의존)
│   ├── exif.ts                 # EXIF 읽기
│   ├── exifWriter.ts           # EXIF 쓰기 (piexifjs 래핑)
│   ├── export.ts               # 단일/ZIP 내보내기
│   ├── clipboard.ts            # filo 페이로드 디코딩
│   ├── matching.ts             # 프레임 번호 ↔ 파일 매칭
│   ├── filename.ts             # 파일명에서 프레임 번호 추출
│   ├── validation.ts           # 필드 입력 검증
│   ├── presets.ts              # 조리개/셔터/ISO 프리셋 값
│   └── thumbnail.ts            # 썸네일 생성
├── store/                  # Zustand 스토어
│   ├── useFrameStore.ts        # 프레임 상태 + Undo/Redo 히스토리
│   ├── useSettingsStore.ts     # 설정 (localStorage 영속화)
│   └── useToastStore.ts        # 토스트 상태
└── types/                  # 타입 정의
    ├── frame.ts                # FrameItem, FrameMeta
    └── filo.ts                 # FiloPayload
```

## 핵심 기능

### 1. 파일 업로드
- JPEG(`.jpg`/`.jpeg`)만 허용. 중복 파일명 자동 건너뜀.
- 파일명에서 **마지막 연속 숫자 시퀀스**를 추출해 프레임 번호 자동 할당 (`filename.ts`).

### 2. 편집 경로 (세 경로 모두 동일 상태 모델 수정)
- **단일 편집**: 행 클릭 → 사이드 패널에서 전 필드 수정.
- **일괄 편집**: 다중 선택 후 값 입력한 필드만 선택 프레임 전체에 적용.
- **클립보드 주입**: filo에서 복사한 롤 데이터 붙여넣기 → 매칭 미리보기 → 적용.

### 3. 입력 검증 (`validation.ts`)
- 촬영시간: 유효 형식, 1900년~현재+1년.
- Aperture: 0.5~100 양수. Shutter: `1/N`(N≥1) / `N"`(N≥1) / `B`. ISO: 1~409600 양의 정수.
- 빈 값은 에러가 아님 (해당 EXIF 필드를 쓰지 않음).
- 검증 실패 행이 하나라도 있으면 내보내기 비활성화.

### 4. Undo/Redo
- 대상: 모든 필드 편집, 일괄 편집, 클립보드 주입, 프레임 순서 변경.
- 제외: 파일 업로드/제거.
- 단축키: `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`.

### 5. 내보내기 (`export.ts`)
- 1개: `{원본명}{suffix}.jpg` 단일 다운로드. 2개 이상: `fixif-export-{YYYYMMDD-HHmmss}.zip`.
- suffix 기본값 `_fixif`, 설정에서 변경 가능.
- 수정된 필드만 덮어쓰고 나머지 EXIF는 보존. **이미지 픽셀 데이터는 원본과 100% 동일해야 함.**

## filo 클립보드 연동 스펙

**페이로드 인코딩**: JSON → gzip(`CompressionStream`) → base64 → `FILO1:` prefix
- `FILO1:`의 `1`은 스펙 버전. 스펙 변경 시 `FILO2:` 등으로 구분.

**EXIF 필드 매핑**:

| filo 데이터 | EXIF 태그 | 변환 규칙 |
| --- | --- | --- |
| `t` (UTC ISO) | `DateTimeOriginal` + `OffsetTimeOriginal` | 로컬 타임존 변환, 오프셋 별도 기록 |
| `camera.make` | `Make` | 빈 값이면 쓰지 않음 |
| `camera.model` | `Model` | - |
| `lens` | `LensModel` | - |
| `aperture` | `FNumber` | rational 변환 |
| `shutter` | `ExposureTime` | "1/125" → rational |
| `film.iso` | `ISOSpeedRatings` | - |
| `memo` | `UserComment` | UTF-8 인코딩 |
| `lat`, `lng` | `GPSLatitude`/`Ref` + `GPSLongitude`/`Ref` | 십진수 → 도/분/초 rational. 둘 중 하나라도 없으면 GPS IFD 전체 생략 |

## 코딩 컨벤션

- Prettier 설정: `semi: true`, `singleQuote: true`, `tabWidth: 4`, `trailingComma: all`, `printWidth: 100`.
- 커밋 메시지는 **Conventional Commits** 규칙을 따르고 한국어로 작성합니다.
- 도메인 로직은 `lib/`에 UI 비의존으로 유지하고, 컴포넌트는 표현에 집중합니다.

## 작업 시 주의사항

- **이미지 무결성**: EXIF 수정 후 이미지 픽셀 데이터가 원본과 100% 동일해야 합니다. `piexif.insert()` 사용 시 이론상 보장되나, 관련 로직 변경 시 회귀에 유의하세요.
- **원본 불변**: 원본 File 객체는 절대 변형하지 않습니다. 모든 편집은 메모리 상태 레이어에서만 이루어집니다.
- **클립보드 버전 호환**: `FILO1:` 외 prefix 처리 시 버전 분기를 고려하세요.
- 상세 개발 플랜과 열린 이슈는 [.claude/plans/PLAN.md](.claude/plans/PLAN.md)를 참조하세요.
