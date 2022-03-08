/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';
import { Menu, Modal } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

import Ztable from '../../../common/components/ztable/ztable';
import {tabPanelize} from '../../../common/utility';

import HumanSVG from './human';
import MouseSVG from './mouse';
import Download from './download';
import SearchIcon from './search';
import { QuickStart } from './QuickStart';
import { MatrixPage } from './Matrices';
import { ENTExDownloadPage } from './ENTEx';

const dccLink = fileID => {
    const url = "https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/Seven-Group/" + fileID;
    return fileDownload(url, fileID, fileID);
}

const sgroupLink = x => {
	if (!x) return null;
	const url = `https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/Signal-Files/${x[0]}-${x[1]}.txt`;
	return fileDownload(url, "", "");
}

const check = value => value ? (
	<span className="glyphicon glyphicon-check" style={{ fontSize: "1.2em", verticalAlign: "middle" }} />
) : null;

const Info = () => (
	<svg class="bi bi-info-square-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
	<path fill-rule="evenodd" d="M0 2a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2zm8.93 4.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM8 5.5a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
	</svg>
);

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
            title: "DNase", data: "dnase", render: sgroupLink
	}, {
            title: "H3K4me3", data: "h3k4me3", render: sgroupLink
	}, {
            title: "H3K27ac", data: "h3k27ac", render: sgroupLink
	}, {
            title: "CTCF", data: "ctcf", render: sgroupLink
	}, {
            title: "Download", data: "file", className: "dt-body-center dt-head-center ",
	    render: dccLink
	}
]);

class TabFiles extends React.Component {
    constructor(props) {
	super(props);
        this.key = "files"
	this.state = { isFetching: false, isError: false, page: 0 };
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
	fetch(window.location.href + "biosample-metadata.json")
	    .then( response => response.json())
	    .then( data => {
                this.setState({ data });
	    });
    }

    doRenderWrapper(){
	    return (
		<div>
			<Menu secondary style={{ fontSize: "1.1em" }}>
				<Menu.Item onClick={() => this.setState({ page: 0 })} active={this.state.page === 0}>Quick Start</Menu.Item>
				<Menu.Item onClick={() => this.setState({ page: 1 })} active={this.state.page === 1}>Detailed Elements</Menu.Item>
				<Menu.Item onClick={() => this.setState({ page: 2 })} active={this.state.page === 2}>Data Matrices</Menu.Item>
				<Menu.Item onClick={() => this.setState({ page: 3 })} active={this.state.page === 3}>EN-TEx Decorations (human only)</Menu.Item>
			</Menu>
			{ this.state.page === 0 ? <QuickStart /> : this.state.page === 3 ? <ENTExDownloadPage /> : this.state.page === 1 ? (
				<React.Fragment>
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
		        <a className={"btn btn-primary btn-lg"} role={"button"} href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/GRCh38-cCREs.bed" download>
		    Download all human cCREs<br/><span style={{ fontSize: "0.8em" }}>(GRCh38)</span>
		        </a>
		    </div>
   		    <div className="col-md-2" />
		    <div className="col-md-4" style={{ textAlign: "center" }}>
		        <a className={"btn btn-primary btn-lg"} role={"button"} href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/mm10-cCREs.bed" download>
		    Download all mouse cCREs<br/><span style={{ fontSize: "0.8em" }}>(mm10)</span>
		        </a>
		    </div>
                  </div>
		    <div className="row" style={{ paddingTop: "1.4em" }}>
		    <div className="col-md-6" style={{ textAlign: "center" }}>
		    <div style={{ width: "100%", display: "table" }}>
		    <div style={{ display: "table-row" }}>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/GRCh38-cCREs.PLS.bed" title="Promoter-like (PLS)" number={34803} bar="#ff0000"/>
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/GRCh38-cCREs.pELS.bed" title="Proximal enhancer-like (pELS)" number={141830} bar="#ffa700" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/GRCh38-cCREs.dELS.bed" title="Distal enhancer-like (dELS)" number={667599} bar="#ffcd00" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/GRCh38-cCREs.CTCF-only.bed" title="CTCF-only" number={56766} bar="#00b0f0" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/GRCh38-cCREs.DNase-H3K4me3.bed" title="DNase-H3K4me3" number={25537} bar="#ffaaaa" />
		    </div>
		    </div>
		    </div>
		    </div>
		    <div className="col-md-6" style={{ textAlign: "center" }}>
		    <div style={{ width: "100%", display: "table" }}>
		    <div style={{ display: "table-row" }}>
		    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/mm10-cCREs.PLS.bed" title="Promoter-like (PLS)" number={23762} bar="#ff0000"/>
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/mm10-cCREs.pELS.bed" title="Proximal enhancer-like (pELS)" number={72794} bar="#ffa700" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/mm10-cCREs.dELS.bed" title="Distal enhancer-like (dELS)" number={209040} bar="#ffcd00" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		        <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/mm10-cCREs.CTCF-only.bed" title="CTCF-only" number={23836} bar="#00b0f0" />
		    </div>
                    <div style={{ width: "20%", padding: "2%", display: "table-cell" }}>
		    <Download href="https://api.wenglab.org/screen_v13/fdownloads/Registry-V3/mm10-cCREs.DNase-H3K4me3.bed" title="DNase-H3K4me3" number={10383} bar="#ffaaaa" />
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
			    <div className="col-md-4" style={{ fontSize: "1.4em", marginLeft: "1.4em" }}>Download cCREs by cell type</div><div className="col-md-2" />
			    <div className="col-md-4" style={{ fontSize: "1.4em" }}>Download cCREs by cell type</div><div className="col-md-1" />
		    </div>
			    <div className="col-md-6" style={{ textAlign: "center", paddingTop: "1.2em" }}>
		    <div style={{ width: "100%", display: "table" }}>
		    <div style={{ display: "table-row" }}>
                    <div style={{ width: "33%", padding: "2%", display: "table-cell" }}>
			<SearchIcon
			    title="Cell Lines"
			    number={Object.keys(this.state.data.human).filter( x => this.state.data.human[x].biosample_type === "cell line" ).length}
			onClick={ () => { this.setState({ hmodal: { species: "human", type: CELL_LINES, d: Object.keys(this.state.data.human).filter( x => this.state.data.human[x].biosample_type === "cell line" ) } }); }}
			/>
		    </div>
                    <div style={{ width: "33%", padding: "2%", display: "table-cell" }}>
			<SearchIcon
			    title="Adult Primary Cells and Tissues"
			    number={Object.keys(this.state.data.human).filter( x => this.state.data.human[x].biosample_type !== "cell line" && this.state.data.human[x].life_stage !== "embryonic" ).length}
			onClick={ () => { this.setState({ hmodal: { species: "human", type: ADULT, d: Object.keys(this.state.data.human).filter( x => this.state.data.human[x].life_stage !== "embryonic" && this.state.data.human[x].biosample_type !== "cell line" ) } }); }}
			/>
		    </div>
		    <div style={{ width: "33%", padding: "2%", display: "table-cell" }}>
			    <SearchIcon
			title="Embryonic Tissues"
			number={Object.keys(this.state.data.human).filter( x => this.state.data.human[x].life_stage === "embryonic" && this.state.data.human[x].biosample_type !== "cell line" ).length}
			onClick={ () => { this.setState({ hmodal: { d: Object.keys(this.state.data.human).filter( x => this.state.data.human[x].life_stage === "embryonic" && this.state.data.human[x].biosample_type !== "cell line" ), species: "human", type: EMBRYONIC } }); }}
			    />
		    </div>
		    </div>
		    </div>
			    </div>
			    <div className="col-md-6" style={{ textAlign: "center", paddingTop: "1.2em" }}>
		    <div style={{ width: "100%", display: "table" }}>
		    <div style={{ display: "table-row" }}>
                    <div style={{ width: "33%", padding: "2%", display: "table-cell" }}>
			<SearchIcon
			    title="Cell Lines"
			    number={Object.keys(this.state.data.mouse).filter( x => this.state.data.mouse[x].biosample_type === "cell line" ).length}
			onClick={ () => { this.setState({ mmodal: { species: "mouse", type: CELL_LINES, d: Object.keys(this.state.data.mouse).filter( x => this.state.data.mouse[x].biosample_type === "cell line" ) } }); }}
			/>
		    </div>
                    <div style={{ width: "33%", padding: "2%", display: "table-cell" }}>
			<SearchIcon
			    title="Adult Primary Cells and Tissues"
			    number={Object.keys(this.state.data.mouse).filter( x => this.state.data.mouse[x].biosample_type !== "cell line" && this.state.data.mouse[x].life_stage !== "embryonic" ).length}
			onClick={ () => { this.setState({ mmodal: { species: "mouse", type: ADULT, d: Object.keys(this.state.data.mouse).filter( x => this.state.data.mouse[x].life_stage !== "embryonic" && this.state.data.mouse[x].biosample_type !== "cell line" ) } }); }}
			/>
		    </div>
		    <div style={{ width: "33%", padding: "2%", display: "table-cell" }}>
			    <SearchIcon
			title="Embryonic Tissues"
			number={Object.keys(this.state.data.mouse).filter( x => this.state.data.mouse[x].life_stage === "embryonic" && this.state.data.mouse[x].biosample_type !== "cell line" ).length}
			onClick={ () => { this.setState({ mmodal: { d: Object.keys(this.state.data.mouse).filter( x => this.state.data.mouse[x].life_stage === "embryonic" && this.state.data.mouse[x].biosample_type !== "cell line" ), species: "mouse", type: EMBRYONIC } }); }}
			    />
		    </div>
		    </div>
		    </div>
			    </div>
			    </div>
		    )}
		    <Modal open={!!this.state.mmodal} onClose={ () => { this.setState({ mmodal: null }); }} style={{ height: "auto", top: "auto", left: "auto", right: "auto", bottom: "auto" }}>
			    <Modal.Header style={{ fontSize: "2em" }}>{this.state.mmodal && TITLES[this.state.mmodal.type](this.state.mmodal.species)}</Modal.Header>
				<Modal.Content style={{ fontSize: "1.2em" }}>
					<div className="alert alert-warning">
					<Info />
					&nbsp;The rightmost "download" column files contain the complete set of mouse cCREs with their activity annotated in the given cell type. The cCRE category is in the second to last column.
					In cell types with DNase-seq data available, cCREs inactive in the given cell type are labeled as "Low-DNase". In cell types without DNase-seq available, elements are
					labeled as "Unclassified" if they do not have signal for any of the available epigenetic marks.<br /><br />
					Files in the other columns contain rDHSs with associated Z-scores (second column) for the corresponding epigenetic mark. Use the complete set of human cCREs, which may be downloaded from this page,
					to match cCREs to rDHSs.
					</div>
					<Ztable sortCol={[ "tissue", true ]} cols={CtsTableColumns} data={this.state.mmodal ? this.state.mmodal.d.map( k => ({ ...this.state.data.mouse[k], celltype: k.replace(/_/g, " "), tissue: this.state.data.mouse[k].tissue[0] || "" }) ) : []} />
				</Modal.Content>
		</Modal>
		    <Modal open={!!this.state.hmodal} onClose={ () => { this.setState({ hmodal: null }); }}>
			    <Modal.Header style={{ fontSize: "2em" }}>{this.state.hmodal && TITLES[this.state.hmodal.type](this.state.hmodal.species)}</Modal.Header>
				<Modal.Content style={{ fontSize: "1.2em" }}>
					<div className="alert alert-warning">
					<Info />
					&nbsp;The rightmost "download" column files contain the complete set of human cCREs with their activity annotated in the given cell type. The cCRE category is in the second to last column.
					In cell types with DNase-seq data available, cCREs inactive in the given cell type are labeled as "Low-DNase". In cell types without DNase-seq available, elements are
					labeled as "Unclassified" if they do not have signal for any of the available epigenetic marks.<br /><br />
					Files in the other columns contain rDHSs with associated Z-scores (second column) for the corresponding epigenetic mark. Use the complete set of human cCREs, which may be downloaded from this page,
					to match cCREs to rDHSs.
					</div>
					<Ztable sortCol={[ "tissue", true ]} cols={CtsTableColumns} data={this.state.hmodal ? this.state.hmodal.d.map( k => ({ ...this.state.data.human[k], celltype: k.replace(/_/g, " "), tissue: this.state.data.human[k].tissue[0] || "" }) ) : []} />
				</Modal.Content>
		    </Modal>
			</React.Fragment>
			) : <MatrixPage />} 
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
