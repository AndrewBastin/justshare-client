import React, {useState, useLayoutEffect} from 'react';
import './App.css';
import FileSendRequest from './api/FileSendRequest';
import FileSaver from 'file-saver';
import PeerInfo from './api/PeerInfo';
import PeerService from './api/PeerService';
import Peer from 'simple-peer';

import ShareWithPage from "./pages/ShareWithPage";
import SelectFilePage from "./pages/SelectFilePage";
import ReceiveFilePage from "./pages/ReceiveFilePage";
import NicknamePage from "./pages/NicknamePage/NicknamePage";
import UnsupportedPage from "./pages/UnsupportedPage";
import AppBar from './components/AppBar/AppBar';
import {AnimatePresence} from 'framer-motion';
import ReactLoading from 'react-loading';

type ScreenType = 'nickname' | 'share-with' | 'select-file' | 'recieve';

const url = "https://justshare-server.herokuapp.com";
//const url = "localhost:2299";

let peerService: PeerService;

const Ap: React.FC<{}> = () => {

    const [peers, setPeers] = useState<PeerInfo[]>([]);
    const [socketID, setSocketID] = useState<string>('');
    const [selectedPeerID, setSelectedPeerID] = useState<string | null>(null);
    const [fileRequest, setFileRequest] = useState<FileSendRequest | null>(null);
    const [fileRequestAcceptCallback, setFileRequestAcceptCallback] = useState<((accept: boolean) => void) | null>(null);
    const [lockAccept, setLockAccept] = useState<boolean>(false);
    const [waitingForAccept, setWaitingForAccept] = useState<boolean>(false);
    const [nickname, setNickname] = useState<string | null>(window.localStorage.getItem("nickname"));
    const [currentScreen, setCurrentScreen] = useState<ScreenType>(nickname ? 'share-with' : 'nickname');

    // Setup Peer Service
    useLayoutEffect(() => {
        if (nickname) {

            peerService = PeerService.createInstance(url, nickname);

            peerService.on("sockConnected", () => {
                console.log(`Socket connected, ID : ${peerService.getSockID()}`);
                setSocketID(peerService.getSockID());
            });

            peerService.on("peerUpdate", (peers) => {
                setPeers(peers);

                // Return back to share-with incase the sender just disconnects before accept
                if (currentScreen === 'recieve') {
                    if (!peers.find((peer) => peer.peerID === fileRequest!!.shareID)) {
                        setCurrentScreen('share-with');
                    }
                }
            });

            peerService.on("fileSendRequest", (req) => new Promise((resolve, reject) => {
                setFileRequest(req);
                setFileRequestAcceptCallback(() => resolve);
                setCurrentScreen('recieve');
            }));
        }

        // Cleanup
        return () => {
            if (peerService) peerService.removeAllListeners();
        }
    // eslint-disable-next-line
    }, [nickname]);

    const handleDeleteNicknameClick = () => {
        window.localStorage.removeItem("nickname");
        setNickname(null);
        window.location.reload(true);
    }

    const renderNicknamePage = () => {
        // TODO : Nickname validation
        return (
            <NicknamePage
                handleNicknameSelect={(nickname) => {
                    window.localStorage.setItem("nickname", nickname as string);
                    setNickname(nickname);
                    setCurrentScreen('share-with');
                }}
            />
        );
    }

    const handleFileSelected = async (ev: React.ChangeEvent<HTMLInputElement>) => {
        console.log(ev.target.files)

        let file = ev.target.files!![0]

        setWaitingForAccept(true);

        if (selectedPeerID) {
            peerService.sendFileSendRequest(selectedPeerID, file)
                .then(([req, accepted] : [FileSendRequest, boolean]) => {

                    if (accepted) {
                        peerService.on('fileSenderSession', (session) => {
            
                            console.log("Session")
                            session.on('done', () => {
                                console.log("complete");
                            })
                            session.start();
            
                            setWaitingForAccept(false);
                            setFileRequest(null);
                            setCurrentScreen('share-with');
                        })
                    } else {
                        console.log("Denied");
                        setWaitingForAccept(false);
                        setFileRequest(null);
                        setCurrentScreen('share-with');
                    }

                })


        } else {
            // TODO : Handle this
        }
    }

    const renderSelectFile = () => {
        return (
            <SelectFilePage
                waitingForAccept={waitingForAccept}
                onFileSelect={handleFileSelected}
            />
        );
    }

    const onShareWithPeerClick = (peerID: string) => {
        setSelectedPeerID(peerID);
        setCurrentScreen('select-file');
    }

    const renderShareWith = () => {
        if (PeerService.getInstance()) {
            return (
                <ShareWithPage 
                    peers={peers}
                    onPeerSelect={onShareWithPeerClick}
                />
            );
        } else {
            return (
                <div>
                </div>
            );
        }
    }

    const handleRecieveAccept = (accept: boolean) => {

        setLockAccept(true);
        
        if (accept) {
            peerService.on('fileReceiverSession', (session) => {
    
                session.on('done', (file, filename: string) => {
                    console.log(file);
                    FileSaver.saveAs(file, filename);
    
                    console.log("complete");
                });
                session.start();

                setLockAccept(false);
                setCurrentScreen('share-with');
    
            });
    
            // TODO : Handle not case
            if (fileRequestAcceptCallback) fileRequestAcceptCallback(true);
        } else {

            setLockAccept(false);
            setCurrentScreen('share-with');
            
            if (fileRequestAcceptCallback) fileRequestAcceptCallback(false);
        }

    }
    const renderRecieveFile = () => {
        return (
            <ReceiveFilePage
                peers={peers}
                lockAccept={lockAccept}
                fileRequest={fileRequest!!}
                onReceiveDecision={handleRecieveAccept}
            />
        );
    }

    const renderCurrentPage = () => {
        // Override: Browser does not support WebRTC
        if (!Peer.WEBRTC_SUPPORT) {
            return (
                <UnsupportedPage />
            )
        }

        if (!socketID && nickname) {
            return (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '90%'
                    }}
                >
                    <ReactLoading 
                        type={'spin'}
                        color={'#fff'}
                    />
                </div>
            );
        }

        if (currentScreen === 'nickname') {
            return renderNicknamePage();
        } else if (currentScreen === 'share-with') {
            return renderShareWith();
        } else if (currentScreen === 'select-file') {
            return renderSelectFile();
        } else if (currentScreen === 'recieve') {
            return renderRecieveFile();  
        } else {
            return (
                <div>
                    Unknown/Unimplemented state. Please refresh page
                </div>
            );
        }
    }

    return (
        <div className="App">
            <div className="App-Content">
                <AppBar 
                    nickname={nickname}
                    socketID={socketID}
                    onDeleteNickname={handleDeleteNicknameClick}
                />
                <AnimatePresence>
                    { renderCurrentPage() }
                </AnimatePresence>
            </div>
            <div className="App-Footer">
                JustShare [Alpha 33]
            </div>
        </div>
    );
}

export default Ap;
