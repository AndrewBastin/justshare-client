import io from 'socket.io-client';
import Peer from 'peerjs';
import PeerInfo from './PeerInfo';
import { EventEmitter } from 'ee-ts';
import FileSendRequest from './FileSendRequest';
import PeerFileSend from './file/PeerFileSend';
import PeerFileReceive from './file/PeerFileReceive';
import { guid } from './Crypto';

interface Events {

	// Emitted on socket connection
	sockConnected(sock: SocketIOClient.Socket): void

	// Emitted on change of peers
	peerUpdate(peerlist: PeerInfo[]): void
	
	// Emitted when a file send request is received, expects a promise describing whether the request should be denied or accepted
	fileSendRequest(request: FileSendRequest): Promise<boolean>

	// Emitted when the recepient accepts the file transfer request
	fileSenderSession(session: PeerFileSend): void

	// Emitted when the file send request was accepted by the user
	fileReceiverSession(session: PeerFileReceive): void
}

export default class PeerService extends EventEmitter<Events> {

	private nickname!: string;

	private socket!: SocketIOClient.Socket;

	private peers!: PeerInfo[];

	constructor(url: string, nickname: string) {
		super();

		this.nickname = nickname;
		this.socket = io(url);

		this.peers = [];

		
		this.socket.on('connect', () => {

			this.socket.emit("declare nickname", this.nickname);

			// Called when a new peer joins the room
			this.socket.on('peer joined', (peerID: string) => {
				this.peers.push({ peerID: peerID });

				this.emit("peerUpdate", this.peers);
			});

			// Called when a peer has left the room
			this.socket.on('peer left', (peerID: string) => {
				this.peers = this.peers.filter(p => p.peerID !== peerID);

				this.emit("peerUpdate", this.peers);
			});

			// Called when you join the room, contains existing peer data
			this.socket.on('peer list', (peers: PeerInfo[]) => {
				this.peers = peers;

				this.emit("peerUpdate", this.peers);
			});

			// Called when a peer sends a file send request to you
			this.socket.on('file share', (req: FileSendRequest) => {
				// TODO : Handle auto denial when no listeners attached

				let peer = new Peer();
				peer.on('open', (id) => {

					(this.emit('fileSendRequest', req) as Promise<boolean>)
						.then((accept) => {
							if (accept) {
								
								let conn = peer.connect(req.senderPeerID);

								conn.on("open", () => {

									// NOTE : Don't forget to call the start function to start the transfer!
									this.emit("fileReceiverSession", new PeerFileReceive(conn));

								});

							} else {
								// TODO : Implement denial
							}
						})
				});
			});

			// Called when a peer announces a nickname
			this.socket.on('shout nickname', (peer: PeerInfo) => {
				this.peers = [...this.peers.filter(p => p.peerID !== peer.peerID), peer]

				this.emit('peerUpdate', this.peers);
			});

			this.emit('sockConnected', this.socket);
		});
	}

	getSockID() : string {
		return this.socket.id;
	}

	getNickname(): string {
		return this.nickname;
	}

	sendFileSendRequest(recipientID: string, file: File): Promise<FileSendRequest> {

		return new Promise((resolve, reject) => {

			let peer = new Peer();

			peer.on("connection", (conn) => {


				conn.on("open", () => {

					// NOTE : Don't forget to call the start function to start the transfer!
					this.emit('fileSenderSession', new PeerFileSend(conn, file));
				
				});

			});

			peer.on('open', (peerID: string) => {
				let request = {
					shareID: guid(),
					senderSocketID: this.socket.id,
					senderPeerID: peerID,
					recieverSocketID: recipientID,
					filename: file.name,
					filesizeBytes: file.size
				}

				this.socket.emit('req file share', request);

				resolve(request);
			});


		});

	}

}