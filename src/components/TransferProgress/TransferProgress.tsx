import * as React from 'react';
import PeerFileSend from '../../api/file/PeerFileSend';
import { fileSizeSI } from '../../api/Size';
import JobInfo from '../../api/JobInfo';
import {useState, useEffect} from 'react';

import './TransferProgress.css';

interface Props {
	job: JobInfo
}

const TranProg: React.FC<Props> = (props) => {
	const [bytesCompleted, setBytesCompleted] = useState(0);

	const handleCancelButtonClick = () => {
		props.job.session.cancel();
	}

	const handleSendProgressUpdate = (bytesSent: number) => {
		setBytesCompleted(bytesSent);
	}

	const handleReceiveProgressUpdate = (bytesReceived: number) => {
		setBytesCompleted(bytesReceived);
	}

	const isTransferSending = () => {
		return props.job.session instanceof PeerFileSend;
	}

	// Job Update Notification Registration
	useEffect(() => {
		if (isTransferSending()) {
			props.job.session.on('progress', handleSendProgressUpdate);
		} else {
			props.job.session.on('progress', handleReceiveProgressUpdate);
		}

		// Cleanup
		return () => {
			if (props.job.session instanceof PeerFileSend) {
				props.job.session.off('progress', handleSendProgressUpdate);
			} else {
				props.job.session.off('progress', handleReceiveProgressUpdate);
			}
		}
	// eslint-disable-next-line
	}, [props.job]);
	
	return (
		<div className="TransferProgress">
			<div className="TransferProgress-Type">{ isTransferSending() ? "SENDING" : "RECEIVING" }</div>
			<div className="TransferProgress-Title">{props.job.request.filename}</div>
			<div className="TransferProgress-Progress">
				{fileSizeSI(bytesCompleted)}/{fileSizeSI(props.job.request.filesizeBytes)} ({Math.floor((bytesCompleted / props.job.request.filesizeBytes) * 100)} %)<br />
			</div>
			
			<button className="TransferProgress-Cancel" onClick={handleCancelButtonClick}>Cancel</button> <br />
		</div>
	);

}

export default TranProg;
