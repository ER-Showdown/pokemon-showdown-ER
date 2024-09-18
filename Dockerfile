FROM cgr.dev/chainguard/node:latest-dev AS builder

ENV PORT=8000

WORKDIR /er-showdown/

COPY --chown=node:node ./ ./

RUN mkdir logs/
RUN npm install --omit=dev
RUN npm run build

RUN find ./dist/ -maxdepth 3 -type f -name "*.map" -delete

FROM cgr.dev/chainguard/node:latest

WORKDIR /er-showdown/

COPY --from=builder --chown=node:node /er-showdown/config ./config
COPY --from=builder --chown=node:node /er-showdown/dist ./dist
COPY --from=builder --chown=node:node /er-showdown/node_modules ./node_modules
COPY --from=builder --chown=node:node /er-showdown/pokemon-showdown ./

RUN mkdir ./logs
RUN touch ./logs/chatlog-access.txt
RUN touch ./logs/errors.txt
RUN touch ./logs/responder.jsonl
RUN touch ./config/chatrooms.json.NEW

EXPOSE $PORT

CMD ["/er-showdown/pokemon-showdown", "prod"]
