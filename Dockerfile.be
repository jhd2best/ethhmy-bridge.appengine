FROM nginx:latest

RUN mkdir -p /app /root/.aws
WORKDIR /app

ADD artifacts/dist /app/dist/
COPY env.js /app
RUN mkdir -p /app/dist/encrypted/eth-secret /app/dist/encrypted/hmy-secret

CMD node ./dist/server.js
