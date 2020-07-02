import React from 'react';
import './App.css';
import FileSendRequest from './api/FileSendRequest';
import FileSaver from 'file-saver';
import PeerInfo from './api/PeerInfo';
import PeerService from './api/PeerService';
import Peer from 'simple-peer';

import ShareWithPage from "./pages/ShareWithPage";
import SelectFilePage from "./pages/SelectFilePage";
import ReceiveFilePage from "./pages/ReceiveFilePage";
import NicknamePage from "./pages/NicknamePage";
import UnsupportedPage from "./pages/UnsupportedPage";

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

        this.onShareWithPeerClick = this.onShareWithPeerClick.bind(this);
        this.handleFileSelected = this.handleFileSelected.bind(this);
        this.handleRecieveAccept = this.handleRecieveAccept.bind(this);
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
            this.setState({ peers: peers });

            // Return back to share-with incase the sender just disconnects before accept
            if (this.state.currentScreen === 'recieve') {
                if (!peers.find((peer) => peer.peerID === this.state.fileRequest!!.shareID)) {
                    this.setState({
                        currentScreen: 'share-with'
                    });
                }
            }
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
            <ShareWithPage 
                peers={this.state.peers}
                onPeerSelect={this.onShareWithPeerClick}
            />
        );
    }

    renderSelectFile(): JSX.Element {
        return (
            <SelectFilePage
                waitingForAccept={this.state.waitingForAccept}
                onFileSelect={this.handleFileSelected}
            />
        );
    }

    async handleFileSelected(ev: React.ChangeEvent<HTMLInputElement>) {
        console.log(ev.target.files)

        let file = ev.target.files!![0]

        this.setState({
            waitingForAccept: true
        });

        if (this.state.selectedPeerID) {
            this.peerService.sendFileSendRequest(this.state.selectedPeerID, file)
                .then(([req, accepted] : [FileSendRequest, boolean]) => {

                    if (accepted) {
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
                        this.setState({
                            currentScreen: 'share-with',
                            waitingForAccept: false,
                            fileRequest: null
                        });
                    }

                })


        } else {
            // TODO : Handle this
        }
    }

    renderRecieveFile(): JSX.Element {
        return (
            <ReceiveFilePage
                peers={this.state.peers}
                lockAccept={this.state.lockAccept}
                fileRequest={this.state.fileRequest!!}
                onReceiveDecision={this.handleRecieveAccept}
            />
        );
    }

    handleRecieveAccept(accept: boolean) {

        this.setState({
            lockAccept: true
        });
        
        if (accept) {
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
        } else {

            this.setState({
                currentScreen: 'share-with',
                lockAccept: false
            });

            if (this.state.fileRequestAcceptCallback) this.state.fileRequestAcceptCallback(false);
        }

    }

    renderNicknamePage(): JSX.Element {
        // TODO : Nickname validation
        return (
            <NicknamePage
                handleNicknameSelect={(nickname) => {
                    this.setupPeerService();
                    window.localStorage.setItem("nickname", nickname as string);
                    this.setState({ nickname: nickname, currentScreen: 'share-with' });
                }}
            />
        );
    }

    renderCurrentPage(): JSX.Element {
        // Override: Browser does not support WebRTC
        if (!Peer.WEBRTC_SUPPORT) {
            return (
                <UnsupportedPage />
            )
        }

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

    handleDeleteNicknameClick() {
        window.localStorage.removeItem("nickname");
        window.location.reload(true);
    }
    
    public render(): JSX.Element {
        return (
            <div className="App">
                <h3 style={{ textAlign: 'center' }}>JustShare [Alpha 23]</h3>
                <p style={{ textAlign: 'center' }}>
                    {
                        window.localStorage.getItem("nickname") ?
                        `You are : ${this.state.nickname ? `${this.state.nickname} (id : ${this.state.socketID})` : this.state.socketID}`
                        : ""
                    }
                    <br />
                    <a href="#" onClick={() => this.handleDeleteNicknameClick()}>{window.localStorage.getItem("nickname") && this.state.currentScreen === 'share-with' ? "Delete Nickname" : ""}</a>
                </p>
                { this.renderCurrentPage() }
            </div>
        )
        
    }

}
