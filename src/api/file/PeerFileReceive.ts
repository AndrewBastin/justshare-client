import { EventEmitter } from "ee-ts";
import SimplePeer from "simple-peer";
import FileSendRequest from "../FileSendRequest";
import FileTransferInfo from "./FileTransferInfo";

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
        this.peer.on('data', (receivedDataString: string) => {
            let data = JSON.parse(receivedDataString) as FileTransferInfo;
            
            
            if (data.type === 'file:start') {
                console.log(data);
                this.chunkCount = data.meta.totalChunks;
                this.receivedChunkCount = 0;
                this.chunkSizeBytes = data.meta.chunkSize;
                this.fileType = data.meta.fileType;

                this.emit('progress', 0);
            } else if (data.type === 'file:chunk') {
                this.receivedData.push(Uint8Array.from(data.chunk.data));

                this.receivedChunkCount++;

                this.emit('progress', Math.min(this.chunkSizeBytes * this.receivedChunkCount, this.req.filesizeBytes));
            } else if (data.type === 'file:end') {
                console.log(this.receivedData);
                this.emit('done', new Blob(this.receivedData, { type: this.fileType }), this.req.filename)
            }

        })
    }

}