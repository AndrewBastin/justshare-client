import { EventEmitter } from 'events';
import { DataConnection } from 'peerjs';
import FileTransferInfo from './FileTransferInfo';

export default class PeerFileReceive extends EventEmitter {

    received!: any
    connection!: DataConnection


    constructor(conn: DataConnection) {
        super()

        this.received = {}
        this.connection = conn

        this.handle = this.handle.bind(this)
    }

    start() {
        this.connection.on('data', this.handle)
    }

    handle(data: FileTransferInfo) {
        var file = this.received[data.id] || {}

        if (data.type === 'file:start') {

            file = data.meta
            file.id = data.id
            file.accepted = false
            file.cancelled = false
            file.data = []

            this.received[data.id] = file
            this.emit('incoming', file)
        }

        else if (data.type === 'file:chunk' && file.accepted && !file.cancelled) {
            file.data.push(data.chunk)

            var receivedBytes = file.data.length * file.chunkSize
            if (receivedBytes > file.size) {
                receivedBytes = file.size
            }

            this.received[data.id] = file
            this.emit('progress', file, receivedBytes)
        }

        else if (data.type === 'file:end' && file.accepted) {
            this.emit('progress', file, file.size)
            this.emit('complete', file)
        }

        else if (data.type === 'file:cancel') {
            file.cancelled = true
            this.received[data.id] = file
            this.emit('cancel', file)
        }
    }

    accept(file: FileTransferInfo) {
        this.received[file.id].accepted = true

        setTimeout(() => {
            this.connection.send({
                type: 'file:accept'
            })
        })

        return this
    }

    reject(file: FileTransferInfo) {
        this.received[file.id].accepted = false

        setTimeout(() => {
            this.connection.send({
                type: 'file:reject'
            })
        })

        return this
    }

    pause(file: FileTransferInfo) {
        this.connection.send({
            type: 'file:pause'
        })

        return this
    }

    resume(file: FileTransferInfo) {
        this.connection.send({
            type: 'file:resume'
        })

        return this
    }

    cancel(file: FileTransferInfo) {
        file.cancelled = true
        this.received[file.id] = file

        this.connection.send({
            type: 'file:cancel'
        })

        return this
    }

}