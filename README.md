# 서휘 기록보관소

빌드 과정이 없는 정적 위키입니다. 파일을 그대로 GitHub에 올리면 됩니다.

## 구조
```
index.html            껍데기 (건드릴 일 거의 없음)
assets/style.css      디자인
assets/app.js         화면·검색·링크 처리
assets/img/           캐릭터 이미지 넣는 곳
content/index.json    문서 목록 + 사이트 제목 + 인물 인포박스
content/pages/*.md    문서 본문 (마크다운)
```

## GitHub Pages로 공개하기
1. GitHub에서 새 저장소 만들기 (Public)
2. 이 폴더 안의 파일 전부 업로드
3. 저장소 Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `/ (root)` → Save
4. 1~2분 뒤 `https://아이디.github.io/저장소이름/` 에서 열림

## 문서 쓰는 법
- 링크: `[[slug]]` 또는 `[[slug|보이는 글자]]` (예: `[[lee-sol|이솔]]`)
- 가림막: `[[■5]]` → 5글자 폭 검은 막대
- 열람 제한 상자:
  ```
  :::sealed 개인 기록 · 열람 제한
  여기 쓰는 건 '암시'만. 진짜 비밀은 쓰지 말 것.
  :::
  ```

> ⚠ 공개 사이트는 누구나 소스를 볼 수 있습니다. 가림막 안에 진짜 내용을 숨겨 둘 수 없으니, 비밀은 처음부터 적지 마세요.

## 이미지 넣기
1. `assets/img/` 에 파일 넣기 (예: `lee-sol.webp`, 세로 3:4 권장)
2. `content/index.json` 에서 해당 인물에 `"img": "assets/img/lee-sol.webp"` 추가

## 새 문서 추가
1. `content/pages/새slug.md` 작성
2. `content/index.json` 의 `pages` 에 한 줄 추가 (`slug`, `cat`, `title`, `summary` 필수)
   - 인물이면 `"cat": "people"`, `"group"`, `"info"` 로 인포박스 구성

## 내 컴퓨터에서 미리보기
파일을 더블클릭하면 목록을 못 불러옵니다. 폴더에서 `python -m http.server` 실행 후 `http://localhost:8000` 접속.
