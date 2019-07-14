import FileSendRequest from './FileSendRequest';
import PeerFileSend from './file/PeerFileSend';
import PeerFileReceive from './file/PeerFileReceive';

export default interface JobInfo {
	request: FileSendRequest,
	session: PeerFileSend | PeerFileReceive
}