import * as React from 'react';
import PeerFileSend from '../../api/file/PeerFileSend';
import PeerFileReceive from '../../api/file/PeerFileReceive';
import FileSendRequest from '../../api/FileSendRequest';
import { fileSizeSI } from '../../api/Size';

interface Props {
	req: FileSendRequest
	session: PeerFileSend | PeerFileReceive
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
	}

	private handleSendProgressUpdate(bytesSent: number) {
		this.setState({
			bytesCompleted: bytesSent
		});
	}

	private handleReceiveProgressUpdate(file: any, bytesReceived: number) {
		this.setState({
			bytesCompleted: bytesReceived
		});
	}

	componentDidMount() {

		if (this.props.session instanceof PeerFileSend) {
			this.props.session.on('progress', this.handleSendProgressUpdate);
		} else {
			this.props.session.on('progress', this.handleReceiveProgressUpdate);
		}

	}

	componentWillUnmount() {

		if (this.props.session instanceof PeerFileSend) {
			this.props.session.off('progress', this.handleSendProgressUpdate);
		} else {
			this.props.session.off('progress', this.handleReceiveProgressUpdate);
		}

	}

	public render(): JSX.Element {
		return (
			<div>
				File: {this.props.req.filename} <br />
				Done: {fileSizeSI(this.state.bytesCompleted)} ({Math.floor((this.state.bytesCompleted / this.props.req.filesizeBytes) * 100)} %)<br />
				Total: {fileSizeSI(this.props.req.filesizeBytes)} <br />
			</div>
		)
	}

}