import { guid } from '../Crypto';
import { EventEmitter } from 'events';
import { DataConnection } from 'peerjs';
import FileTransferInfo from './FileTransferInfo';
import through from 'through';

var read = require('filereader-stream')



export default class PeerFileSend extends EventEmitter {

    id!: string
    connection!: DataConnection
    file!: File
    chunkSize = Math.pow(2, 13)
    totalChunks!: number
    stream?: any
    cancelled!: boolean

    constructor(connection: DataConnection, file: File) {
        super()

        this.id = guid()
        this.connection = connection
        this.file = file
        this.totalChunks = Math.ceil(this.file.size / this.chunkSize)
        this.stream = null
        this.cancelled = false

        this.handle = this.handle.bind(this)
    }
    
    start() {
        this.connection.on('data', this.handle)
    
        this.connection.send({
            type: 'file:start',
            id: this.id,
            meta: {
                name: this.file.name,
                type: this.file.type,
                size: this.file.size,
                chunkSize: this.chunkSize,
                totalChunks: this.totalChunks
            }
        })
    }

    handle(data: FileTransferInfo) {
        switch (data.type) {
            case 'file:accept':
                this.accept()
                break;
            case 'file:cancel':
                this.cancel()
                break;
            case 'file:pause':
                this.pause()
                break;
            case 'file:reject':
                this.reject()
                break;
            case 'file:resume':
                this.resume()
                break;
        }
    }

    pause(): PeerFileSend {
        if (this.stream && !this.stream.paused) {
            this.stream.pause()
            this.emit('pause')
        }

        return this
    }

    resume(): PeerFileSend {
        if (this.stream && this.stream.paused) {
            this.stream.resume()
            this.emit('resume')
        }

        return this
    }

    accept(): PeerFileSend {
        this.emit('accept')

        this.stream = read(this.file, {
            chunkSize: this.chunkSize
        })

        let chunksSent = 0
        this.stream.pipe(through(
            (chunk: any) => {
                this.connection.send({
                    type: 'file:chunk',
                    id: this.id,
                    chunk: chunk
                })

                chunksSent++
                this.emit('progress', Math.min(this.file.size, chunksSent * this.chunkSize))
            },

            () => {
                // Stop listening to receiver.
                this.connection.off('data', this.handle)

                if (this.cancelled) {
                    return
                }

                // Tell receiver that this is the end.
                this.connection.send({
                    type: 'file:end',
                    id: this.id
                })

                this.emit('progress', this.file.size)
                this.emit('complete')
            }
        ))

        // An error is thrown if the transfer is cancelled,
        // so we can probably just noop this.
        this.stream.on('error', function () { })

        return this
    }

    reject() {
        // In the event that an accepted transfer
        // is later rejected, kill the stream.
        this.stream ?
            this.cancel() :
            this.emit('reject')

        return this
    }

    cancel() {
        this.cancelled = true

        setTimeout(() => {
            if (this.stream) {
                this.stream.abort()
                this.stream = null
            }

            this.connection.send({
                type: 'file:cancel',
                id: this.id
            })

            this.emit('cancel')
        })

        return this
    }
}