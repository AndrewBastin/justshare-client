import * as React from 'react';
import PeerFileSend from '../../api/file/PeerFileSend';
import { fileSizeSI } from '../../api/Size';
import JobInfo from '../../api/JobInfo';
import {useState, useEffect} from 'react';

interface Props {
	job: JobInfo
}

interface State {
	bytesCompleted: number
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

	// Job Update Notification Registration
	useEffect(() => {
		if (props.job.session instanceof PeerFileSend) {
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
	}, [props.job]);
	

	return (
		<div>
			File: {props.job.request.filename} <br />
			Done: {fileSizeSI(bytesCompleted)} ({Math.floor((bytesCompleted / props.job.request.filesizeBytes) * 100)} %)<br />
			Total: {fileSizeSI(props.job.request.filesizeBytes)} <br />
			
			<button onClick={handleCancelButtonClick}>Cancel</button> <br />
		</div>
	);
}

export default TranProg;
