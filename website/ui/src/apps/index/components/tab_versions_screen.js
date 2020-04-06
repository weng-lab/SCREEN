/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';

import { Tabs, Tab } from 'react-bootstrap';

import Ztable from '../../../common/components/ztable/ztable';
import loading from '../../../common/components/loading';
import * as ApiClient from '../../../common/api_client';

const CtsTableColumns = () => {
    const dccLink = (assay, accs) => {
        const url = acc => 'https://www.encodeproject.org/experiments/' + acc;
        return (
	    <p>
		<strong>{assay}</strong>:&nbsp;
                { accs.map( (acc, i) => (
		    <span key={acc}>
                        <a href={url(acc)} target="_blank" rel="noopener noreferrer">
                            {acc}
                        </a>{ i < accs.length - 1 && ", "}
   		    </span>
	        ))}
	    </p>
        );
    };

    const renderBiosample = biosample => biosample.substring(0, biosample[biosample.length - 1] === "'" ? biosample.length - 1 : biosample.length).replace(/b'/g, "").replace(/b"/g, "");
    
    const dccLinks = experiments => Object.keys(experiments).map(assay => dccLink(assay, experiments[assay]));

    return [
        {
            title: 'Biosample',
            data: 'biosample_term_name',
	    render: renderBiosample
        },
        {
            title: 'Experiments',
            data: 'experiments',
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
	const jq = JSON.stringify({ assembly: "GRCh38" });
	ApiClient.getByPost(jq, "/dataws/ground_level_versions",
			    (r) => {
				let versionIDs = Object.keys(r);
				let versions = {};
				let totals = {};
				versionIDs.sort( (a, b) => (a.split("-")[0] === b.split("-")[0] ? +a.split("-")[1] - +b.split("-")[1] : +a.split("-")[0] - +b.split("-")[0]) ).reverse();
				versionIDs.forEach(id => {
				    versions[id] = [];
				    totals[id] = 0;
				    Object.keys(r[id]).forEach(biosample => {
					versions[id].push({
					    biosample_term_name: biosample,
					    experiments: r[id][biosample]
					});
					Object.keys(r[id][biosample]).forEach(assay => {
					    totals[id] += r[id][biosample][assay].length;
					});
				    });
				});
				this.setState({versions,
					       selectedVersion: 0,
					       versionIDs,
					       totals,
					       isFetching: false, isError: false});
	    },
	    (err) => {
		console.log("err loading files");
		console.log(err);
                this.setState({isFetching: false, isError: true});
	    });
    }

    render() {
        if (this.state.versions && this.state.versionIDs)
	    return (
		<div>
		    <Tabs defaultActiveKey={1} id="tabset">
 		        { this.state.versionIDs.map( (id, i) => (
   			    <Tab title={id} key={id} eventKey={i}>
                                <h3>ENCODE and Roadmap Experiments constituting ground level version {id} ({this.state.totals[id].toLocaleString()} total)</h3>
                                <Ztable data={this.state.versions[id]} cols={CtsTableColumns()} />
			    </Tab>
			))}
		    </Tabs>
		</div>
            );
	return loading({...this.state})
    }
}

export default TabDataScreen;
