### 사용법


1. node / npm 설치(홈페이지 설치파일 또는 터미널로 가능)
2. 필요 패키지 설치
~~~
npm install -g
~~~
3. src/server 폴더에 있는 .env.sample 파일명을 .env로 변경
4. .env 파일에 API 키 등 환경변수 입력(드라이브의 환경변수 docs 파일 참고)
5. 백엔드 서버(server.js) 실행(server 폴더 내에서 실행)
~~~
nodemon server.js
~~~
6. 프론트엔드 서버(index.html) 실행(해당 파일 경로에서 실행)
- vscode에서는 해당 html 파일 열고 우클릭 후 'Open in Default Browser' 클릭하면 됨
~~~
start index.html # Windows
open index.html # Mac
~~~
