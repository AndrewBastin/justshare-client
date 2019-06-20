export default interface FileTransferInfo {
    type: 'file:start' | 'file:accept' | 'file:reject' | 'file:pause' | 'file:resume' | 'file:cancel' | 'file:chunk' | 'file:end',
    id: string,
    
    cancelled: boolean,

    chunk?: any,

    meta: {
        name: string,
        type: string,
        size: number,
        chunkSize: number,
        totalChunks: number
    }
}