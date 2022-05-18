FROM alpine:3.8

WORKDIR /root

COPY ./gvite .
COPY ./node_config.json .
COPY ./genesis.json .
COPY ./ledger .

EXPOSE 8483 8484 48132 41420 8483/udp
ENTRYPOINT ["./gvite"] 
