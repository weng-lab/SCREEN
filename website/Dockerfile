# multi-stage build

FROM node:14-alpine

RUN gcloud auth login

RUN mkdir -p /app/
COPY ui /app
COPY gcp.json /app/config.json
COPY gcp.json /app/src/config.json

WORKDIR /app/

RUN yarn
ARG publicurl
RUN PUBLIC_URL=$publicurl yarn build

# for final image

FROM nginx:1.13-alpine

RUN mkdir -p /app/
COPY  --from=0 /app/build /usr/share/nginx/html
COPY assets /usr/share/nginx/html/assets
COPY --from=0 /app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD [ "nginx", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;" ]
