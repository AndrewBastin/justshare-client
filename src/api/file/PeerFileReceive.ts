import { EventEmitter } from "ee-ts";
import SimplePeer from "simple-peer";
import FileSendRequest from "../FileSendRequest";
import PeerFileSend from "./PeerFileSend";
import FileStartMetadata from "./FileStartMetadata";

interface Events {

    progress(bytesCompleted: number): void,
    done(receivedFile: Blob, filename: string): void

}

export default class PeerFileReceive extends EventEmitter<Events> {

    private peer: SimplePeer.Instance;
    private req: FileSendRequest;

    private receivedData: any[];

    private fileType!: string;
    private chunkSizeBytes!: number;
    private receivedChunkCount!: number;
    private chunkCount!: number;

    constructor(peer: SimplePeer.Instance, req: FileSendRequest) {
        super();

        this.peer = peer;
        this.req = req;

        this.receivedData = [];
    }

    start() {
        this.peer.on('data', (data: Uint8Array) => {
            
            if (data[0] === PeerFileSend.HEADER_FILE_START) {

                let meta = JSON.parse(new TextDecoder().decode(data.slice(1))) as FileStartMetadata;

                console.log(data);
                this.chunkCount = meta.totalChunks;
                this.receivedChunkCount = 0;
                this.chunkSizeBytes = meta.chunkSize;
                this.fileType = meta.fileType;

                this.emit('progress', 0);
            } else if (data[0] === PeerFileSend.HEADER_FILE_CHUNK) {
                this.receivedData.push(data.slice(1));

                this.receivedChunkCount++;

                this.emit('progress', Math.min(this.chunkSizeBytes * this.receivedChunkCount, this.req.filesizeBytes));
            } else if (data[0] === PeerFileSend.HEADER_FILE_END) {
                console.log(this.receivedData);
                this.emit('done', new Blob(this.receivedData, { type: this.fileType }), this.req.filename)
            }

        })
    }

}