export default interface FileTransferInfo {
    type: 'file:start' | 'file:chunk' | 'file:end',

    chunk?: any,

    meta: {
        fileType: string,
        chunkSize: number,
        totalChunks: number
    }
}