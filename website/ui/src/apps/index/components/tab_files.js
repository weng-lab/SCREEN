/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';

import * as Render from '../../../common/zrenders';
import Ztable from '../../../common/components/ztable/ztable';
import loading from '../../../common/components/loading';
import {tabPanelize} from '../../../common/utility';
import * as ApiClient from '../../../common/api_client';

const dccLink = (fileID) => {
    if("NA" === fileID){
	return "-";
    }
    const fn = fileID + ".bed.gz";
    const url = "https://www.encodeproject.org/files/" + fileID + "/@@download/" + fn
    return fileDownload(url, fn, fileID);
}

const fileDownload = (url, fn, fileID) => {
    return (
	<span>
	    <a href={url} download={fn}>
		<span className="glyphicon glyphicon-download" aria-hidden="true"
		      style={{fontSize: "1.2em",
			      verticalAlign: "middle",
			      paddingRight: "5px"}} />
	    </a>
	    {Render.dccLinkFile(fileID)}
	</span>);
}

const CtaTableColumns = () => {
    let klassCenter = "dt-body-center dt-head-center ";

    return [
	{
	    title: "Assembly", data: "assembly", className: klassCenter,
	}, {
            title: "7 group", data: "5group",
	    className: klassCenter, render: dccLink
	}, {
            title: "7 group url", data: "5group", visible: false
	}, {
	    title: <span>9 state high&nbsp;H3K27ac</span>, data: "9state-H3K27ac",
	    className: klassCenter, render: dccLink
	}, {
	    title: <span>9 state high&nbsp;H3K27ac</span>, data: "9state-H3K27ac",
	    visible: false
	}, {
	    title: <span>9 state high&nbsp;H3K4me3</span>, data: "9state-H3K4me3",
	    className: klassCenter, render: dccLink
	}, {
	    title: <span>9 state high&nbsp;H3K4me3</span>, data: "9state-H3K4me3",
	    visible: false
	}, {
            title: <span>9 state high&nbsp;CTCF</span>, data: "9state-CTCF",
	    className: klassCenter, render: dccLink
	}, {
            title: <span>9 state high&nbsp;CTCF</span>, data: "9state-CTCF",
	    visible: false
	}
    ];
}

const CtsTableColumns = () => {
    const klassCenter = "dt-body-center dt-head-center ";

    return [
	{
	    title: "Assembly", data: "assembly", className: klassCenter,
	}, {
	    title: "Tissue", data: "tissue", className: klassCenter,
	}, {
	    title: "Biosample", data: "celltypedesc", className: klassCenter,
	}, {
            title: "7 group", data: "5group", className: klassCenter,
	    render: dccLink
	}, {
            title: "7 group url", data: "5group", visible: false
	}, {
            title: <span>9 state high&nbsp;DNase</span>, data: "9state-DNase",
	    className: klassCenter, render: dccLink
	}, {
            title: <span>9 state high&nbsp;DNase</span>, data: "9state-DNase",
	    visible: false
	}, {
	    title: <span>9 state high&nbsp;H3K27ac</span>, data: "9state-H3K27ac",
	    className: klassCenter, render: dccLink
	}, {
	    title: <span>9 state high&nbsp;H3K27ac</span>, data: "9state-H3K27ac",
	    visible: false
	}, {
	    title: <span>9 state high&nbsp;H3K4me3</span>, data: "9state-H3K4me3",
	    className: klassCenter, render: dccLink
	}, {
	    title: <span>9 state high&nbsp;H3K4me3</span>, data: "9state-H3K4me3",
	    visible: false
	}, {
            title: <span>9 state high&nbsp;CTCF</span>, data: "9state-CTCF",
	    className: klassCenter, render: dccLink
	}, {
            title: <span>9 state high&nbsp;CTCF</span>, data: "9state-CTCF",
	    visible: false
	}
    ];
}

class TabFiles extends React.Component {
    constructor(props) {
	super(props);
        this.key = "files"
	this.state = { isFetching: false, isError: false };
    }

    componentDidMount(){
        if(this.key === this.props.maintabs_active){
	    this.loadFiles(this.props);
	}
    }

    UNSAFE_componentWillReceiveProps(nextProps){
        if(this.key === nextProps.maintabs_active){
	    this.loadFiles(nextProps);
	}
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    loadFiles(nextProps){
        if("files" in this.state){
            return;
        }
	if(this.state.isFetching){
	    return;
	}
	this.setState({isFetching: true});
	ApiClient.globalTabFiles2(
	    (r) => {
		this.setState({files: r, isFetching: false, isError: false});
	    },
	    (err) => {
		console.log("err loading files");
		console.log(err);
                this.setState({isFetching: false, isError: true});
	    });
    }

    doRenderWrapper(){
        if("files" in this.state){
	    return (
		<div>
		    <h3>Cell type-agnostic</h3>
		    <Ztable data={this.state.files["agnostic"]}
				  cols={CtaTableColumns()}
				  bFilter={true}
				  bLengthChange={true}
		    />
		    <h3>Cell type-specific</h3>
		    <Ztable data={this.state.files["specific"]}
				  cols={CtsTableColumns()}
				  bFilter={true}
				  bLengthChange={true}
                    />
		</div>);
        }
	return loading({...this.state})
    }

    
    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
	return (tabPanelize(
            <div>
                {this.doRenderWrapper()}
	    </div>));
    }
}

export default TabFiles;
