FROM rust:alpine AS wasm-builder
WORKDIR /app
COPY ./rust .
RUN cargo install wasm-pack
RUN wasm-pack build --target web

FROM node:24-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
COPY --from=wasm-builder /app/pkg /app/pkg
RUN npm run build



FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]