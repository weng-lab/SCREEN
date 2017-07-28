import React from 'react'

import ResultsTable from '../../../common/components/results_table';
<<<<<<< HEAD
import ZTable from '../../../common/components/ztable/ztable';


import * as Render from '../../../common/zrenders'
=======
import * as Render from '../../../common/renders'
import loading from '../../../common/components/loading'
>>>>>>> 0ed073a560007da51f316685033a07ad5afd6629
import {tabPanelize} from '../../../common/utility'

const TableColumns = () => {
    let klassCenter = "dt-body-center dt-head-center ";

    const dccLink = (expID) => {
	if("NA" === expID){
	    return "-";
	}
	let fn = expID + ".bigBed.bed.gz";
	let url = "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/9-State/" +
		  fn;
	return fileDownload(url, fn);
    }

    const fileDownload = (url, fn) => {
	return '<a href="' + url + '" download="'+ fn +'">' +
	       '<span class="glyphicon glyphicon-download" aria-hidden="true">' +
	       '</span>' + '</a>';
    }

    const fiveGroupDownload = (a) => {
	return fileDownload(a[0], a[1]);
    }

    return [
	{
	    title: "Assembly", data: "assembly", className: klassCenter,
	}, {
	    title: "Tissue", data: "tissue", className: klassCenter,
	}, {
	    title: "Biosample", data: "celltypedesc", className: klassCenter,
	}, {
            title: "5 group", data: "fiveGroup", className: klassCenter,
	    render: fiveGroupDownload
	}, {
            title: "5 group url", data: "fiveGroup", visible: false
	}, {
            title: "9 state high&nbsp;DNase", data: "dnase", className: klassCenter,
	    render: dccLink
	}, {
            title: "9 state high&nbsp;DNase", data: "dnase_url", visible: false
	}, {
	    title: "9 state high&nbsp;H3K27ac", data: "h3k27ac", className: klassCenter,
	    render: dccLink
	}, {
	    title: "9 state high&nbsp;H3K27ac", data: "h3k27ac_url", visible: false
	}, {
	    title: "9 state high&nbsp;H3K4me3", data: "h3k4me3", className: klassCenter,
	    render: dccLink
	}, {
	    title: "9 state high&nbsp;H3K4me3", data: "h3k4me3_url", visible: false
	}, {
            title: "9 state high&nbsp;CTCF", data: "ctcf", className: klassCenter,
	    render: dccLink
	}, {
            title: "9 state high&nbsp;CTCF", data: "ctcf_url", visible: false
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

    componentWillReceiveProps(nextProps){
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
        $.ajax({
            url: "/globalData/index/index",
            type: "GET",
            error: function(jqxhr, status, error) {
                console.log("err loading files");
		console.log(error);
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({files: r, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    doRenderWrapper(){
        if("files" in this.state){
	    return (<ResultsTable data={this.state.files}
		    cols={TableColumns()}
                    bFilter={true}
                    bLengthChange={true}
                    />);
        }
	return loading({...this.state})
    }

    
    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
	return (tabPanelize(
            <div>
<<<<<<< HEAD
		<ZTable data={NineState}
			      cols={TableColumns()}
                              bFilter={true}
                              bLengthChange={true}
                />
=======
                {this.doRenderWrapper()}
>>>>>>> 0ed073a560007da51f316685033a07ad5afd6629
	    </div>));
    }
}

export default TabFiles;
