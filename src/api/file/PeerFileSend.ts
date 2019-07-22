import { EventEmitter } from "ee-ts";
import SimplePeer from "simple-peer";
import FileTransferInfo from "./FileTransferInfo";
import { guid } from "../Crypto";
import FileSendRequest from "../FileSendRequest";
import through from "through";

var read = require('filereader-stream');

interface Events {

    progress(bytesSent: number): void,
    done(): void

}

export default class PeerFileSend extends EventEmitter<Events> {

    private peer: SimplePeer.Instance;
    private file: File;
    private chunkSize = Math.pow(2, 13);
    private totalChunks: number;
    private req: FileSendRequest;

    constructor(peer: SimplePeer.Instance, file: File, req: FileSendRequest) {
        super();

        this.peer = peer;
        this.file = file;
        this.totalChunks = Math.ceil(this.file.size / this.chunkSize);
        this.req = req;
    }

    start() {
        // Start

        let request: FileTransferInfo = {
            type: 'file:start',
            meta: {
                totalChunks: this.totalChunks,
                fileType: this.file.type,
                chunkSize: this.chunkSize
            }
        }

        this.peer.send(JSON.stringify(request));
        this.emit('progress', 0);

        // Chunk sending
        let stream = read(this.file, {
            chunkSize: this.chunkSize
        });

        let chunksSent = 0;
        stream.pipe(through(
            (chunk: any) => {
                this.peer.send(JSON.stringify({
                    type: 'file:chunk',
                    chunk: chunk
                } as FileTransferInfo))

                chunksSent++;
                this.emit('progress', Math.min(this.file.size, chunksSent * this.chunkSize));
            },
            () => {
                // TODO : disconnect from peer
                this.peer.send(JSON.stringify({
                    type: 'file:end'
                } as FileTransferInfo));

                this.emit('progress', this.file.size);
                this.emit('done');
            }
        ))
    }

}