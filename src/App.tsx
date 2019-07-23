import React from 'react';
import './App.css';
import FileSendRequest from './api/FileSendRequest';
import { fileSizeSI } from './api/Size';
import FileSaver from 'file-saver';
import PeerInfo from './api/PeerInfo';
import PeerService from './api/PeerService';
import TransferProgress from './components/TransferProgress/TransferProgress';
import JobInfo from './api/JobInfo';
import TransfersList from './components/TransfersList/TransfersList';

interface State {
    
    peers: PeerInfo[],
    
    socketID: string,
    
    selectedPeerID?: string,
       
    fileRequest?: FileSendRequest | null, 
    fileRequestAcceptCallback?: (accept: boolean) => void,

    // Disable accept button because it is already been clicked (waiting for handshakes to complete)
    lockAccept: boolean,

    fileToSend?: File,

    waitingForAccept: boolean,

    nickname: string | null,

    currentScreen: 'nickname' | 'share-with' | 'select-file' | 'recieve'
}

export default class App extends React.Component<{}, State> {
    
    private peerService!: PeerService;

    constructor(props: {}, ctx: any) {
        super(props, ctx);

        this.state = {
            peers: [],
            socketID: '',
            waitingForAccept: false,
            lockAccept: false,
            nickname: window.localStorage.getItem("nickname"),
            currentScreen: window.localStorage.getItem("nickname") ? 'share-with' : 'nickname',
        };
    }

    componentWillMount() {
        if (this.state.nickname) {
            this.setupPeerService();
        }
    }

    setupPeerService() {

        let url = "https://justshare-server.herokuapp.com";
        //let url = "localhost:2299";

        this.peerService = PeerService.createInstance(url, this.state.nickname!!);

        this.peerService.on("sockConnected", (sock) => {
            console.log(`Socket connected, ID : ${this.peerService.getSockID()}`);

            this.setState({
                socketID: this.peerService.getSockID()
            })
        });

        this.peerService.on("peerUpdate", (peers) => {
            this.setState({ peers: peers })
        });

        this.peerService.on("fileSendRequest", (req) => new Promise((resolve, reject) => {

            this.setState({
                currentScreen: 'recieve',
                fileRequest: req,
                fileRequestAcceptCallback: resolve
            });

        }));

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
                <TransfersList />
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

    async handleFileSelected(ev: React.ChangeEvent<HTMLInputElement>) {
        console.log(ev.target.files)

        let file = ev.target.files!![0]

        this.setState({
            waitingForAccept: true
        });

        if (this.state.selectedPeerID) {
            await this.peerService.sendFileSendRequest(this.state.selectedPeerID, file);

            this.peerService.on('fileSenderSession', (session) => {

                session.on('done', () => {
                    console.log("complete");
                })
                session.start();

                this.setState({
                    currentScreen: 'share-with',
                    waitingForAccept: false,
                    fileRequest: null
                });
            })

        } else {
            // TODO : Handle this
        }
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
                    <button disabled={this.state.lockAccept} onClick={() => this.handleRecieveAccept() }>Accept</button>
                </p>
            </div>
        )
    }

    handleRecieveAccept() {

        this.setState({
            lockAccept: true
        });

        this.peerService.on('fileReceiverSession', (session) => {

            session.on('done', (file, filename: string) => {
                console.log(file);
                FileSaver.saveAs(file, filename);

                console.log("complete");
            });
            session.start();

            this.setState({
                currentScreen: 'share-with',
                lockAccept: false
            });
        });

        // TODO : Handle not case
        if (this.state.fileRequestAcceptCallback) this.state.fileRequestAcceptCallback(true);

    }

    renderNicknamePage(): JSX.Element {
        // TODO : Nickname validation
        return (
            <div>
                <div className="App-ListHeading">Nickname</div>
                <div>Enter the nickname (you will be shown on other devices with this name) : </div>
                <input value={ this.state.nickname ? this.state.nickname : "" } onChange={(ev) => this.setState({ nickname: ev.target.value }) }/>
                
                <button onClick={(ev) => {
                    this.setupPeerService();
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
                <h3 style={{ textAlign: 'center' }}>JustShare [Alpha 13]</h3>
                <p style={{ textAlign: 'center' }}>You are : {this.state.nickname ? `${this.state.nickname} (id : ${this.state.socketID})` : this.state.socketID}</p>
                { this.renderCurrentPage() }
            </div>
        )
        
    }

}
