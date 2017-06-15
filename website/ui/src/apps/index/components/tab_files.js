import React from 'react'

import ResultsTable from '../../../common/components/results_table';
import * as Render from '../../../common/renders'
import {tabPanelize} from '../../../common/utility'

const TableColumns = () => {
    let klassCenter = "dt-body-center dt-head-center ";

    const dccLink = (expID) => {
	if("NA" === expID){
	    return "-";
	}
	let fn = expID + ".bigBed.bed";
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
	    title: "Biosample", data: "celltypedesc", className: klassCenter,
	}, {
            title: "5 group", data: "fiveGroup", className: klassCenter,
	    render: fiveGroupDownload
	}, {
            title: "9 state DNase", data: "dnase", className: klassCenter,
	    render: dccLink
	}, {
	    title: "9 state H3K27ac", data: "h3k27ac", className: klassCenter,
	    render: dccLink
	}, {
	    title: "9 state H3K4me3", data: "h3k4me3", className: klassCenter,
	    render: dccLink
	}, {
            title: "9 state CTCF", data: "ctcf", className: klassCenter,
	    render: dccLink
	}
    ];
}

class TabFiles extends React.Component {
    constructor(props) {
	super(props);
        this.key = "files"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
	return (tabPanelize(
            <div>
		<ResultsTable data={NineState}
			      cols={TableColumns()}
                              bFilter={true}
                              bLengthChange={true}
                />
	    </div>));
    }
}

export default TabFiles;
