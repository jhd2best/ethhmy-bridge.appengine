FROM nginx:latest

RUN mkdir -p /app /root/.aws
WORKDIR /app

ADD artifacts/dist /app/dist/
COPY env.js /app
RUN mkdir -p /app/encrypted/eth-secret /app/encrypted/hmy-secret /app/keys

CMD node ./dist/server.js
