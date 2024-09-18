FROM node:alpine

ENV PORT=8000

WORKDIR /er-showdown/

COPY ./ ./

RUN mkdir logs/
RUN npm install
RUN npm run build

EXPOSE $PORT

CMD ["node", "/er-showdown/pokemon-showdown", "start"]
