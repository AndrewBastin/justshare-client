import * as React from 'react';
import JobInfo from '../../api/JobInfo';
import PeerService from '../../api/PeerService';
import TransferProgress from '../TransferProgress/TransferProgress';

interface State {

	jobs: JobInfo[]

}

export default class TransfersSection extends React.Component<{}, State> {

	constructor(props: {}, ctx: any) {
		super(props, ctx);

		this.state = {
			jobs: []
		}

		this.handleJobsUpdate = this.handleJobsUpdate.bind(this);
	}

	handleJobsUpdate(jobs: JobInfo[]) {
		this.setState({
			jobs: jobs
		});
	}

	componentDidMount() {
		PeerService.getInstance().on('jobsUpdate', this.handleJobsUpdate);
	}

	componentWillUnmount() {
		PeerService.getInstance().off('jobsUpdate', this.handleJobsUpdate);
	}

	public render(): JSX.Element {
		return (
			<div>
				{
					this.state.jobs.map((job, index) => (
						<TransferProgress key={index} job={job} />
					))
				}
			</div>
		);
	}

}