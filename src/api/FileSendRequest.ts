export default interface FileSendRequest {
    
    /// An ID used to define this particular request
    shareID: string

    /// Server Socket ID of the sender
    senderSocketID: string
    /// P2P Peer ID of the sender
    senderPeerID: string

    /// Server Socket ID of the intented reciever
    recieverSocketID: string

    /// File name of the content to be sent
    filename: string
    /// Size of the file (in bytes) to be sent
    filesizeBytes: number

}