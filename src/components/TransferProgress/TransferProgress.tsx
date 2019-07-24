import * as React from 'react';
import PeerFileSend from '../../api/file/PeerFileSend';
import { fileSizeSI } from '../../api/Size';
import JobInfo from '../../api/JobInfo';

interface Props {
	job: JobInfo
}

interface State {
	bytesCompleted: number
}

export default class TransferProgress extends React.Component<Props, State> {

	constructor(props: Props, ctx: any) {
		super(props, ctx);

		this.state = {
			bytesCompleted: 0
		}

		this.handleSendProgressUpdate = this.handleSendProgressUpdate.bind(this);
		this.handleReceiveProgressUpdate = this.handleReceiveProgressUpdate.bind(this);
		this.handleCancelButtonClick = this.handleCancelButtonClick.bind(this);
	}

	private handleSendProgressUpdate(bytesSent: number) {
		this.setState({
			bytesCompleted: bytesSent
		});
	}

	private handleReceiveProgressUpdate(bytesReceived: number) {
		this.setState({
			bytesCompleted: bytesReceived
		});
	}

	componentDidMount() {

		if (this.props.job.session instanceof PeerFileSend) {
			this.props.job.session.on('progress', this.handleSendProgressUpdate);
		} else {
			this.props.job.session.on('progress', this.handleReceiveProgressUpdate);
		}

	}

	componentWillUnmount() {

		if (this.props.job.session instanceof PeerFileSend) {
			this.props.job.session.off('progress', this.handleSendProgressUpdate);
		} else {
			this.props.job.session.off('progress', this.handleReceiveProgressUpdate);
		}

	}

	private handleCancelButtonClick() {
		this.props.job.session.cancel();
	}

	public render(): JSX.Element {
		return (
			<div>
				File: {this.props.job.request.filename} <br />
				Done: {fileSizeSI(this.state.bytesCompleted)} ({Math.floor((this.state.bytesCompleted / this.props.job.request.filesizeBytes) * 100)} %)<br />
				Total: {fileSizeSI(this.props.job.request.filesizeBytes)} <br />
				
				<button onClick={this.handleCancelButtonClick}>Cancel</button> <br />
			</div>
		)
	}

}