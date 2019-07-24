import { EventEmitter } from "ee-ts";
import SimplePeer from "simple-peer";
import { guid } from "../Crypto";
import FileSendRequest from "../FileSendRequest";
import through from "through";
import FileStartMetadata from "./FileStartMetadata";
import PeerFileReceive from "./PeerFileReceive";

var read = require('filereader-stream');

interface Events {

    progress(bytesSent: number): void,
    done(): void
    // Called when the sender (this) has requested a cancel
    cancel(): void

    // Called when the receiver has requested a cancel
    cancelled(): void
}

export default class PeerFileSend extends EventEmitter<Events> {

    // The first byte in every data sent will be what kind of data it is
    static HEADER_FILE_START = 0;
    static HEADER_FILE_CHUNK = 1;
    static HEADER_FILE_END = 2;

    static HEADER_SEND_CANCEL = 10;


    private peer: SimplePeer.Instance;
    private file: File;
    private chunkSize = Math.pow(2, 13);
    private totalChunks: number;
    private req: FileSendRequest;
    private cancelled: boolean = false;

    constructor(peer: SimplePeer.Instance, file: File, req: FileSendRequest) {
        super();

        this.peer = peer;
        this.file = file;
        this.totalChunks = Math.ceil(this.file.size / this.chunkSize);
        this.req = req;
    }

    // Structure of File Start Data
    // 1st byte -> Type of data sent (will be set to HEADER_FILE_START)
    // Rest of the data will be assigned to the uint8array merge of JSON string the file metadata
    // TODO : Much more compressed binary representation plz
    private prepareFileStartData(): Uint8Array {
        let meta: FileStartMetadata = {
            totalChunks: this.totalChunks,
            fileType: this.file.type,
            chunkSize: this.chunkSize
        }

        let metaString = JSON.stringify(meta);

        let metaByteArray = new TextEncoder().encode(metaString);

        // + 1 for storing the header byte
        let resp = new Uint8Array(metaByteArray.length + 1);
        
        // Header byte
        resp[0] = PeerFileSend.HEADER_FILE_START;
        resp.set(metaByteArray, 1);

        return resp;
    }

    // Structure for chunk data
    // 1st byte -> Data type header (HEADER_FILE_CHUNK)
    // Rest of the bytes will be the chunk data with length the length specified in the chunk size
    private prepareChunkData(chunk: Uint8Array): Uint8Array {
        // + 1 for the header
        let resp = new Uint8Array(this.chunkSize + 1);

        resp[0] = PeerFileSend.HEADER_FILE_CHUNK;
        resp.set(chunk, 1);

        return resp;
    }

    // Structure for end data
    // 1st byte -> Data type header (HEADER_FILE_END)
    private prepareFileEndData(): Uint8Array {
        let resp = new Uint8Array(1);

        resp[0] = PeerFileSend.HEADER_FILE_END;

        return resp;
    }

    // Structure for delete data
    // 1st byte -> Data type header (HEADER_SEND_CANCEL)
    private prepareCancelData(): Uint8Array {
        let resp = new Uint8Array(1);

        resp[0] = PeerFileSend.HEADER_SEND_CANCEL;

        return resp;
    }

    start() {
        // Listen for cancel requests
        this.peer.on('data', (data: Uint8Array) => {

            if (data[0] === PeerFileReceive.HEADER_REC_CANCEL) {
                this.cancelled = true;
                this.peer.destroy();
                
                this.emit('cancelled');
            }

        });

        // Start
        let startHeader = this.prepareFileStartData();

        this.peer.send(startHeader);
        this.emit('progress', 0);

        // Chunk sending
        let stream = read(this.file, {
            chunkSize: this.chunkSize
        });

        let chunksSent = 0;
        stream.pipe(through(
            (chunk: any) => {
                // TODO : Some way to actually stop this function on cancel
                if (!this.cancelled) {
                    this.peer.send(this.prepareChunkData(chunk))
    
                    chunksSent++;
                    this.emit('progress', Math.min(this.file.size, chunksSent * this.chunkSize));
                }

            },
            () => {
                this.peer.send(this.prepareFileEndData());

                this.emit('progress', this.file.size);
                this.emit('done');

                // Destroy peer
                this.peer.destroy();
            }
        ))
    }

    cancel() {
        this.cancelled = true;
        this.peer.send(this.prepareCancelData());
        this.emit('cancel');
    }

}