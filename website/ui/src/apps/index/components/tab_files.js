import React from 'react';
import Modal from 'react-modal';

import * as Render from '../../../common/zrenders';
import Ztable from '../../../common/components/ztable/ztable';
import loading from '../../../common/components/loading';
import {tabPanelize} from '../../../common/utility';
import * as ApiClient from '../../../common/api_client';

import HumanSVG from './human';
import MouseSVG from './mouse';
import Download from './download';
import RightArrow from './rightarrow';
import SearchIcon from './search';

const dccLink = (fileID) => {
    if("NA" === fileID){
	return "-";
    }
    const fn = fileID + ".bed.gz";
    const url = "https://www.encodeproject.org/files/" + fileID + "/@@download/" + fn
    return fileDownload(url, fn, fileID);
}

const check = value => value ? (
	<span className="glyphicon glyphicon-check" style={{ fontSize: "1.2em", verticalAlign: "middle" }} />
) : null;

const fileDownload = (url, fn, fileID) => {
    return (
	<span>
	    <a href={url} download>
		<span className="glyphicon glyphicon-download" aria-hidden="true"
		      style={{fontSize: "1.2em",
			      verticalAlign: "middle",
			      paddingRight: "5px"}} />
	    </a>
	</span>);
}

const EMBRYONIC = 'EMBRYONIC';
const ADULT = 'ADULT';
const CELL_LINES = 'CELL_LINES';

const TITLES = {
    EMBRYONIC: species => "Download cCREs active in " + species + " embryonic tissues",
    ADULT: species => "Download cCREs active in " + species + " primary cells and tissues",
    CELL_LINES: species => "Download cCREs active in " + species + " immortalized cell lines",
};

const CtsTableColumns = ([
    {
	    title: "Tissue", data: "tissue"
    },
	{
	    title: "Cell Type", data: "celltype"
	}, {
            title: "DNase", data: "dnase", render: check
	}, {
            title: "H3K4me3", data: "h3k4me3", render: check
	}, {
            title: "H3K27ac", data: "h3k27ac", render: check
	}, {
            title: "CTCF", data: "ctcf", render: check
	}, {
            title: "Download", data: "file", className: "dt-body-center dt-head-center ",
	    render: dccLink
	}
]);

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
	fetch("https://screen-beta.wenglab.org/cCRE-biosample-metadata.GRCh38.json")
	    .then( response => response.json())
	    .then( data => {
                this.setState({ data });
	    });
    }

    doRenderWrapper(){
	console.log(this.state.data);
	    return (
		<div>
		  <div className="row">
		    <div className="col-md-6">
		        <HumanSVG text="926,535 cCREs" />
		    </div>
		    <div className="col-md-6">
                        <MouseSVG text="339,815 cCREs" />
		    </div>
		    </div>
		    <div className="row" style={{ paddingTop: "1.0em" }}>
		    <div className="col-md-1" />
                    <div className="col-md-4" style={{ textAlign: "center" }}>
		        <a className={"btn btn-primary btn-lg"} role={"button"} href="http://gcp.wenglab.org/GRCh38-ccREs.bed" download>
		    Download all human cCREs<br/><span style={{ fontSize: "0.8em" }}>(GRCh38)</span>
		        </a>
		    </div>
   		    <div className="col-md-2" />
		    <div className="col-md-4" style={{ textAlign: "center" }}>
		        <a className={"btn btn-primary btn-lg"} role={"button"} href="http://gcp.wenglab.org/mm10-ccREs.bed" download>
		    Download all mouse cCREs<br/><span style={{ fontSize: "0.8em" }}>(mm10)</span>
		        </a>
		    </div>
                  </div>
		    <div className="row" style={{ paddingTop: "1.4em" }}>
		    <div className="col-md-6" style={{ textAlign: "center" }}>
		    <div style={{ width: "100%", display: "table" }}>
		    <div style={{ display: "table-row" }}>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="http://gcp.wenglab.org/mm10-ccREs.PLS.bed" title="Promoter-like (PLS)" number={34803} bar="#ff0000"/>
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="http://gcp.wenglab.org/mm10-ccREs.pELS.bed" title="Proximal enhancer-like (pELS)" number={141830} bar="#ffa700" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="http://gcp.wenglab.org/mm10-ccREs.dELS.bed" title="Distal enhancer-like (dELS)" number={667599} bar="#ffcd00" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="http://gcp.wenglab.org/mm10-ccREs.CTCF-only.bed" title="CTCF-only" number={56766} bar="#00b0f0" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="http://gcp.wenglab.org/mm10-ccREs.DNase-H3K4me3.bed" title="DNase-H3K4me3" number={25537} bar="#ffaaaa" />
		    </div>
		    </div>
		    </div>
		    </div>
		    <div className="col-md-6" style={{ textAlign: "center" }}>
		    <div style={{ width: "100%", display: "table" }}>
		    <div style={{ display: "table-row" }}>
		    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="http://gcp.wenglab.org/GRCh38-ccREs.PLS.bed" title="Promoter-like (PLS)" number={23762} bar="#ff0000"/>
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="http://gcp.wenglab.org/GRCh38-ccREs.pELS.bed" title="Proximal enhancer-like (pELS)" number={72794} bar="#ffa700" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="http://gcp.wenglab.org/GRCh38-ccREs.dELS.bed" title="Distal enhancer-like (dELS)" number={209040} bar="#ffcd00" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="http://gcp.wenglab.org/GRCh38-ccREs.CTCF-only.bed" title="CTCF-only" number={23836} bar="#00b0f0" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		    <Download href="http://gcp.wenglab.org/GRCh38-ccREs.DNase-H3K4me3.bed" title="DNase-H3K4me3" number={10383} bar="#ffaaaa" />
		    </div>
		    </div>
		    </div>
		    </div>
                    </div>
		    { this.state.data && (
			<div>
		    <div className="row" style={{ paddingTop: "1.4em" }}>
		    <div className="col-md-1" /><div className="col-md-4"><hr/></div><div className="col-md-1" />
		    <div className="col-md-1" /><div className="col-md-4"><hr/></div><div className="col-md-1" />
			    </div>
		    <div className="row" style={{ paddingTop: "1.0em" }}>
			    <div className="col-md-4" style={{ fontSize: "1.4em", marginLeft: "1.4em" }}>Download cCREs active in a cell type</div><div className="col-md-2" />
			    <div className="col-md-4" style={{ fontSize: "1.4em", marginLeft: "1.4em" }}>Download cCREs active in a cell type</div><div className="col-md-1" />
		    </div>
			    <div className="col-md-6" style={{ textAlign: "center", paddingTop: "1.2em" }}>
		    <div style={{ width: "100%", display: "table" }}>
		    <div style={{ display: "table-row" }}>
                    <div style={{ width: "33%", padding: "2%", display: "table-cell" }}>
			<SearchIcon
			    title="Cell Lines"
			    number={Object.keys(this.state.data).filter( x => this.state.data[x].biosample_type === "cell line" ).length}
			onClick={ () => { this.setState({ modal: { species: "human", type: CELL_LINES, d: Object.keys(this.state.data).filter( x => this.state.data[x].biosample_type === "cell line" ) } }); }}
			/>
		    </div>
                    <div style={{ width: "33%", padding: "2%", display: "table-cell" }}>
			<SearchIcon
			    title="Adult Primary Cells and Tissues"
			    number={Object.keys(this.state.data).filter( x => this.state.data[x].life_stage === "adult" ).length}
			onClick={ () => { this.setState({ modal: { species: "human", type: ADULT, d: Object.keys(this.state.data).filter( x => this.state.data[x].life_stage === "adult" && this.state.data[x].biosample_type !== "cell line" ) } }); }}
			/>
		    </div>
		    <div style={{ width: "33%", padding: "2%", display: "table-cell" }}>
			    <SearchIcon
			title="Embryonic Tissues"
			number={Object.keys(this.state.data).filter( x => this.state.data[x].life_stage === "embryonic" ).length}
			onClick={ () => { this.setState({ modal: { d: Object.keys(this.state.data).filter( x => this.state.data[x].life_stage === "embryonic" && this.state.data[x].biosample_type !== "cell line" ), species: "human", type: EMBRYONIC } }); }}
			    />
		    </div>
		    </div>
		    </div>
			    </div>
			    </div>
		    )}
		    <Modal isOpen={!!this.state.modal} onRequestClose={ () => { this.setState({ modal: null }); }}>
		    { this.state.modal && (
			<div>
			    <h2>{TITLES[this.state.modal.type](this.state.modal.species)}</h2>
			    <Ztable sortCol={[ "tissue", true ]} cols={CtsTableColumns} data={this.state.modal.d.map( k => ({ ...this.state.data[k], celltype: k.replace(/_/g, " "), tissue: this.state.data[k].tissue[0] || "", file: "" }) )} />
			    </div>
		        )}
		    </Modal>
		</div>    
	    );
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
