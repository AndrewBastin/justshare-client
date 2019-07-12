import React from 'react';
import './App.css';
import io from 'socket.io-client';
import FileSendRequest from './api/FileSendRequest';
import Peer from 'peerjs';
import { guid } from './api/Crypto';
import { fileSizeSI } from './api/Size';
import PeerFileSend from './api/file/PeerFileSend';
import PeerFileReceive from './api/file/PeerFileReceive';
import FileSaver from 'file-saver';
import PeerInfo from './api/PeerInfo';

interface State {
    
    peers: PeerInfo[],
    
    socketID: string,
    
    selectedPeerID?: string,
    
    fileRequest?: FileSendRequest,

    fileToSend?: File,

    bytesReceived: number,
    bytesSent: number,

    waitingForAccept: boolean,

    nickname: string | null,

    currentScreen: 'nickname' | 'share-with' | 'select-file' | 'recieve' | 'recieving' | 'sending'

}

export default class App extends React.Component<{}, State> {
    
    private socket!: SocketIOClient.Socket;
    private peer!: Peer;

    constructor(props: {}, ctx: any) {
        super(props, ctx);

        this.state = {
            peers: [],
            socketID: '',
            bytesReceived: 0,
            bytesSent: 0,
            waitingForAccept: false,
            nickname: window.localStorage.getItem("nickname"),
            currentScreen: window.localStorage.getItem("nickname") ? 'share-with' : 'nickname'
        };
    }

    componentDidMount() {
        if (this.state.nickname) {
            this.setupPeerAndSocket();
        }
    }

    setupPeerAndSocket() {
        this.peer = new Peer();

        //this.socket = io("https://justshare-server.herokuapp.com/");
        this.socket = io("localhost:2299");

        this.socket.on('connect', () => {

            if (this.state.nickname) this.socket.emit("declare nickname", this.state.nickname);

            console.log(`Socket connected, ID : ${this.socket.id}`);
            this.socket.on('peer joined', (peerID: string) => {
                console.log(`Peer Joined ${peerID}`);

                this.setState({
                    peers: [...this.state.peers, { peerID: peerID }]
                });

            });

            this.socket.on('peer left', (peerID: string) => {
                console.log(`Peer Left ${peerID}`);
                
                this.setState({
                    peers: this.state.peers.filter(p => p.peerID !== peerID)
                });
            });

            this.socket.on('peer list', (peerIDs: PeerInfo[]) => {
                console.log("Peer List");

                this.setState({
                    peers: peerIDs
                });
            });

            this.socket.on('file share', (req: FileSendRequest) => {
                console.log("File Share");
                console.log(req);

                // TODO : Implement
                this.setState({
                    currentScreen: 'recieve',
                    fileRequest: req
                });
            });

            this.socket.on("shout nickname", (peer: PeerInfo) => {
                this.setState({
                    peers: [...this.state.peers.filter(p => p.peerID !== peer.peerID), peer]
                })
            });

            this.setState({
                socketID: this.socket.id
            });

        });
    }

    onShareWithPeerClick(peerID: string) {
        this.setState({
            selectedPeerID: peerID,
            currentScreen: "select-file"
        });
    }

    renderShareWith(): JSX.Element {
        return (
            <div>
                <div className="App-ListHeading">Share With</div>
                <div>
                    {
                        this.state.peers.map((peer, index) => {
                            return (
                                <a className="App-ListItem" key={index} onClick={() => this.onShareWithPeerClick(peer.peerID)}>{
                                    (peer.nickname) ? peer.nickname : peer.peerID
                                }</a>
                            );
                        })
                    }
                </div>
            </div>
        );
    }

    renderSelectFile(): JSX.Element {
        if (!this.state.waitingForAccept) {
            return (
                <div>
                    <div className="App-ListHeading">Select File</div>
                    <input type="file" onChange={ (ev) => this.handleFileSelected(ev) }></input>
                </div>
            );
        } else {
            return (
                <div>
                    <div className="App-ListHeading">Select File</div>
                    <div>Waiting for the reciever to accept...</div>
                </div>
            );
        }
    }

    handleFileSelected(ev: React.ChangeEvent<HTMLInputElement>) {
        console.log(ev.target.files)

        let file = ev.target.files!![0]

        let request: FileSendRequest = {
            shareID: guid(),
            senderSocketID: this.socket.id,
            senderPeerID: this.peer.id,
            recieverSocketID: this.state.selectedPeerID || "", // TODO : Handle null selectedPeerID
            filename: file.name,
            filesizeBytes: file.size

        }
        this.socket.emit('req file share', request);

        this.peer.on("connection", (conn) => {

            conn.on("open", () => {
                new PeerFileSend(conn, file)
                    .on('accept', () => {
                        console.log('accept')
                    })
                    .on('reject', () => {
                        console.log("reject")
                    })
                    .on('complete', () => {
                        console.log("complete")
                        
                        window.location.reload(true);

                    })
                    .on('cancel', () => {
                        console.log("cancel")
                    })
                    .on('progress', (bytesSent: number) => {
                        
                        this.setState({
                            bytesSent: bytesSent
                        })
                    })
                    .start()
            })
                

            // TODO : Implement connection stuff
            this.setState({
                fileRequest: request,
                currentScreen: 'sending'
            });

        });

        this.setState({
            waitingForAccept: true
        });

        console.log(request);
    }

    renderRecieveFile(): JSX.Element {
        let senderInfo = this.state.peers.find(p => p.peerID === this.state.fileRequest!!.senderSocketID)
        return (
            <div>
                <div className="App-ListHeading">Recieve</div>
                <p>
                    { senderInfo ? senderInfo.nickname : this.state.fileRequest!!.senderSocketID } wants to send 
                    &nbsp;{this.state.fileRequest!!.filename} ({fileSizeSI(this.state.fileRequest!!.filesizeBytes)}) <br />
                    <br />
                    <br />
                    Accept ?
                    <br />
                    <br />
                    <button onClick={() => this.handleRecieveAccept() }>Accept</button>
                </p>
            </div>
        )
    }

    handleRecieveAccept() {
        let conn = this.peer.connect(this.state.fileRequest!!.senderPeerID)
        conn.on("open", () => {

            let receive = new PeerFileReceive(conn)
                .on('incoming', (file) => {
                    console.log('incoming')
                    receive.accept(file) || receive.reject(file)
                })
                .on('complete', (file) => {
                    let blob = new Blob(file.data, { type: file.type })
                    console.log(file)
                    FileSaver.saveAs(blob, file.name)

                    window.location.reload(true);

                    console.log('complete')
                })
                .on('cancel', () => {
                    console.log('cancel')
                })
                .on('progress', (file, bytesReceived: number) => {
                    this.setState({
                        bytesReceived: bytesReceived
                    })
                })
                
            receive.start()

            this.setState({
                currentScreen: 'recieving'
            })
        })
        // TODO : Implement
    }

    renderRecieving() {
        return (
            <div>
                <div className="App-ListHeading">Recieving</div>
                <div>{this.state.fileRequest!!.filename}</div>
                <div>{fileSizeSI(this.state.bytesReceived)}/{fileSizeSI(this.state.fileRequest!!.filesizeBytes)} ({Math.floor((this.state.bytesReceived / this.state.fileRequest!!.filesizeBytes) * 100)}%)</div>
            </div>
        )
    }

    renderSending() {
        return (
            <div>
                <div className="App-ListHeading">Sending</div>
                <div>{this.state.fileRequest!!.filename}</div>
                <div>{fileSizeSI(this.state.bytesSent)}/{fileSizeSI(this.state.fileRequest!!.filesizeBytes)} ({Math.floor((this.state.bytesSent / this.state.fileRequest!!.filesizeBytes) * 100)}%)</div>
            </div>
        )
    }

    renderNicknamePage(): JSX.Element {
        // TODO : Nickname validation
        return (
            <div>
                <div className="App-ListHeading">Nickname</div>
                <div>Enter the nickname (you will be shown on other devices with this name) : </div>
                <input value={ this.state.nickname ? this.state.nickname : "" } onChange={(ev) => this.setState({ nickname: ev.target.value }) }/>
                
                <button onClick={(ev) => {
                    this.setupPeerAndSocket();
                    window.localStorage.setItem("nickname", this.state.nickname as string);
                    this.setState({ currentScreen: 'share-with' });
                }}>
                    Done
                </button>
            </div>
        )
    }

    renderCurrentPage(): JSX.Element {
        if (this.state.currentScreen === 'nickname') {
            return this.renderNicknamePage();
        } else if (this.state.currentScreen === 'share-with') {
            return this.renderShareWith();
        } else if (this.state.currentScreen === 'select-file') {
            return this.renderSelectFile();
        } else if (this.state.currentScreen === 'recieve') {
            return this.renderRecieveFile();  
        } else if (this.state.currentScreen === 'recieving') {
            return this.renderRecieving();
        } else if (this.state.currentScreen === 'sending') {
            return this.renderSending();
        } else {
            return (
                <div>
                    Unknown/Unimplemented state. Please refresh page
                </div>
            );
        }
    }
    
    public render(): JSX.Element {
        return (
            <div className="App">
                <h3 style={{ textAlign: 'center' }}>JustShare [Alpha 3]</h3>
                <p style={{ textAlign: 'center' }}>You are : {this.state.nickname ? `${this.state.nickname} (id : ${this.state.socketID})` : this.state.socketID}</p>
                { this.renderCurrentPage() }
            </div>
        )
        
    }

}
