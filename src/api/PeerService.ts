import io from 'socket.io-client';
import PeerInfo from './PeerInfo';
import { EventEmitter } from 'ee-ts';
import FileSendRequest from './FileSendRequest';
import PeerFileSend from './file/PeerFileSend';
import PeerFileReceive from './file/PeerFileReceive';
import { guid } from './Crypto';
import JobInfo from './JobInfo';
import Peer from 'simple-peer';

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
	
	// Called when a new job is added or removed
	jobsUpdate(jobs: JobInfo[]): void
}


export default class PeerService extends EventEmitter<Events> {
	
	// Singleton stuff
	private static instance: PeerService;
	
	static createInstance(url: string, nickname: string): PeerService {
		PeerService.instance = new PeerService(url, nickname);
		
		return PeerService.instance;
	}
	
	static getInstance(): PeerService {
		return PeerService.instance;
	}
	
	
	
	
	
	private nickname!: string;
	
	private socket!: SocketIOClient.Socket;
	
	private peers!: PeerInfo[];
	
	// Jobs are stored with the request's share id as key
	private jobs!: Map<string, JobInfo>;
	
	private constructor(url: string, nickname: string) {
		super();
		
		this.nickname = nickname;
		this.socket = io(url);
		
		this.peers = [];
		this.jobs = new Map<string, JobInfo>();
		
		
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
				
				let peer = new Peer({ initiator: false });
				
				peer.on('connect', () => {
					console.log('connect'); // TODO : remove
					
					let receive = new PeerFileReceive(peer, req);
					
					this.jobs.set(req.shareID, { request: req, session: receive });

					// Register callback to delete job on complete
					receive.on('done', () => {
						this.jobs.delete(req.shareID);
						this.emit('jobsUpdate', Array.from(this.jobs.values()));
					});

					// Register callback to delete job on cancellation
					receive.on('cancel', () => {
						this.jobs.delete(req.shareID);
						this.emit('jobsUpdate', Array.from(this.jobs.values()));
					});

					receive.on('cancelled', () => {
						this.jobs.delete(req.shareID);
						this.emit('jobsUpdate', Array.from(this.jobs.values()));
					});

					
					// NOTE : Don't forget to call the start function to start the transfer!
					this.emit("fileReceiverSession", receive);
					
					this.emit('jobsUpdate', Array.from(this.jobs.values()));
				
				});
				
				(this.emit('fileSendRequest', req) as Promise<boolean>)
				.then((accept) => {
					if (accept) {
						
						peer.on('signal', (signallingData: Peer.SignalData) => {
							this.socket.emit(`signal ${req.shareID}`, JSON.stringify(signallingData));
						});
						
						// Register signalling listeners
						this.socket.on(`signal ${req.shareID}`, (signallingData: string) => {
							peer.signal(JSON.parse(signallingData));
						});
						
						// Tunnels a message saying the sender has accepted the requested, and receiver can start sending signalling data
						this.socket.emit(`accept ${req.shareID}`);
					} else {
						this.socket.emit(`deny ${req.shareID}`);
					}
				})
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
	
	// Returns a promise that returns the corresponding FileSendRequest and whether the request was accepted
	sendFileSendRequest(recipientID: string, file: File): Promise<[FileSendRequest, boolean]> {
		
		return new Promise((resolve, reject) => {

			let request: FileSendRequest = {
				shareID: guid(),
				senderSocketID: this.socket.id,
				recieverSocketID: recipientID,
				filename: file.name,
				filesizeBytes: file.size
			}
	
			// Callback for a tunnelled message from the sender saying it accepts the send request
			this.socket.on(`accept ${request.shareID}`, () => {
	
				let peer = new Peer({ initiator: true });

	
				peer.on('signal', (signallingData: Peer.SignalData) => {
					this.socket.emit(`signal ${request.shareID}`, JSON.stringify(signallingData));
	
				});
	
				this.socket.on(`signal ${request.shareID}`, (signallingData: string) => {
					console.log(JSON.parse(signallingData));
					peer.signal(JSON.parse(signallingData));
				});
	
				peer.on('connect', () => {
					console.log('connect'); // TODO : Remove
	
					// Stop listening for signal data
					this.socket.off(`signal ${request.shareID}`);
	
					let send = new PeerFileSend(peer, file, request);
	
					// Registering an on complete callback to remove the job once complete
					send.on('done', () => {
						this.jobs.delete(request.shareID);
						this.emit('jobsUpdate', Array.from(this.jobs.values()));
					});
	
					// Registering for deletion on cancellation
					send.on('cancel', () => {
						this.jobs.delete(request.shareID);
						this.emit('jobsUpdate', Array.from(this.jobs.values()));
					});
					send.on('cancelled', () => {
						this.jobs.delete(request.shareID);
						this.emit('jobsUpdate', Array.from(this.jobs.values()));
					});
	
	
					this.jobs.set(request.shareID, { request: request, session: send });
	
					// NOTE : Don't forget to call the start function to start the transfer!
					this.emit('fileSenderSession', send);
	
					this.emit('jobsUpdate', Array.from(this.jobs.values()));
				});

				resolve([request, true]);
			});

			this.socket.on(`deny ${request.shareID}`, () => {
				resolve([request, false]);
			});
	
			this.socket.emit('req file share', request);
		});
	}
	
}