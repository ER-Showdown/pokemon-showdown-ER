FROM cgr.dev/chainguard/node:latest-dev AS builder

ENV PORT=8000

WORKDIR /er-showdown/

COPY --chown=node:node ./ ./

RUN mkdir logs/ \
	&& npm install --omit=dev \
	&& npm run build \
	&& find ./dist/ -maxdepth 3 -type f -name "*.map" -delete

FROM cgr.dev/chainguard/node:latest

WORKDIR /er-showdown/

COPY --from=builder --chown=node:node /er-showdown/config ./config
COPY --from=builder --chown=node:node /er-showdown/dist ./dist
COPY --from=builder --chown=node:node /er-showdown/node_modules ./node_modules
COPY --from=builder --chown=node:node /er-showdown/pokemon-showdown ./

RUN mkdir ./logs \
	&& touch ./logs/chatlog-access.txt \
	&& touch ./logs/errors.txt \
	&& touch ./logs/responder.jsonl \
	&& touch ./config/chatrooms.json.NEW \

EXPOSE $PORT

CMD ["/er-showdown/pokemon-showdown", "prod"]
