FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/server .

FROM alpine:3.20
RUN adduser -D -h /app dice
WORKDIR /app
COPY --from=build /out/server /app/server
USER dice
ENV PORT=8080 BUG_REPORT_DIR=/app/data/bug-reports
VOLUME ["/app/data"]
EXPOSE 8080
ENTRYPOINT ["/app/server"]
