import React from 'react';

import Ztable from '../../../common/components/ztable/ztable';
import loading from '../../../common/components/loading';
import * as ApiClient from '../../../common/api_client';

const CtsTableColumns = () => {
    const dccLink = expID => {
        if ('NA' === expID) {
            return '';
        }
        const url = 'https://encodeproject.org/' + expID;
        return (
            <a key={expID} href={url} target="_blank">
                {expID}{' '}
            </a>
        );
    };

    const dccLinks = fileIDs => fileIDs.map(fileID => dccLink(fileID));

    return [
        {
            title: 'Assembly',
            data: 'assembly',
        },
        {
            title: 'Biosample',
            data: 'biosample_term_name',
        },
        {
            title: 'Files',
            data: 'fileids',
            render: dccLinks,
        },
    ];
};

class TabDataScreen extends React.Component {
    constructor(props) {
	super(props);
	this.state = { isFetching: false, isError: false };
    }

    componentDidMount(){
	this.loadFiles(this.props);
    }

    componentWillReceiveProps(nextProps){
	this.loadFiles(nextProps);
    }
    
    loadFiles(nextProps){
        if("files" in this.state){
            return;
        }
	if(this.state.isFetching){
	    return;
	}
	this.setState({isFetching: true});
	const jq = JSON.stringify({assembly: "hg19"});
	ApiClient.getByPost(jq, "/data/ground_level_versions",
			    (r) => {
				this.setState({versions: r,
					       isFetching: false, isError: false});
	    },
	    (err) => {
		console.log("err loading files");
		console.log(err);
                this.setState({isFetching: false, isError: true});
	    });
    }

    render() {
	console.log(this.state);
        if("files" in this.state){
	    return (
		<div>
                    <h3>ENCODE and Roadmap Experiments Used in SCREEN v4.10</h3>
		    <h4>{this.state.version}</h4>
                    <Ztable data={this.state.files} cols={CtsTableColumns()} />
		</div>
            );
	}
	return loading({...this.state})
    }
}

export default TabDataScreen;
