### 사용법


1. node / npm 설치(홈페이지 설치파일 또는 터미널로 가능)
2. 필요 패키지 설치
~~~
npm install -g
~~~
3. .env.sample 파일명을 .env로 변경
4. .env 파일에 API 키 등 환경변수 입력(드라이브의 환경변수 docs 파일 참고)
5. 백엔드 서버(server.js) 실행(해당 파일 경로에서 실행)
~~~
nohup nodemon server.js > server_log.log
~~~
6. 프론트엔드 서버(index.html) 실행(해당 파일 경로에서 실행)
~~~
http-server .
~~~