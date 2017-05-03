import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import ResultsTable from '../../../common/components/results_table'
import {ListItem} from '../../../common/components/list'
import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'

import loading from '../../../common/components/loading';
import {getCommonState} from '../../../common/utility';
import * as Render from '../../../common/renders'

class ConfigureGenomeBrowser extends React.Component {
    constructor(props) {
	super(props);
	this.key = "configgb";
        this.openGenomeBrowser = this.openGenomeBrowser.bind(this);
	this.gbclick = this.gbclick.bind(this);
	this.state = {"showCombo" : true};
	this.optionsChanged = this.optionsChanged.bind(this);
    }

    gbclick(cre, cts, gbrowser){
	var half_window = 7500;
	var arr = window.location.href.split("/");
	var host = arr[0] + "//" + arr[2];
	var data = {"accession" : cre.accession,
		    "coord_chrom" : cre.chrom,
		    "coord_start" : cre.start,
		    "coord_end" : cre.start + cre.len,
		    "halfWindow" : half_window,
		    "version" : 2,
		    "cellTypes" : cts,
		    "showCombo" : this.state.showCombo,
		    host,
		    GlobalAssembly};
	let jdata = JSON.stringify(data);
	switch (gbrowser) {
	    case "UCSC":
                this.openGenomeBrowser(jdata, "/ucsc_trackhub_url"); break;
	    case "WashU":
                this.openGenomeBrowser(jdata, "/washu_trackhub_url"); break;
	    case "Ensembl":
                this.openGenomeBrowser(jdata, "/ensembl_trackhub_url"); break;
	}
    }

    openGenomeBrowser(data, url){
        $.ajax({
	    type: "POST",
	    url: url,
	    data: data,
	    dataType: "json",
	    contentType : "application/json",
	    async: false, // http://stackoverflow.com/a/20235765
	    success: (r) => {
	        if ("err" in r) {
		    $("#errMsg").text(r.err);
		    $("#errBox").show()
		    return true;
	        }
	        console.log(r.url, r.trackhubUrl);
	        window.open(r.url, '_blank');
	    },
	    error: (a, b, c) => {
	        console.log(a);
	    }
        });
    }

    optionsChanged(s){
	this.setState({showCombo: s});
    }
    
    render() {
        let cre = this.props.configuregb_cre;
        let coord = cre ? cre.chrom + ':'
			+ Render.numWithCommas(cre.start)
			+ '-' + Render.numWithCommas(cre.start + cre.len)
                  : "";
	let cols = [
	    { title: "", data: "name",
	      render: Render.checkCt(this.props.configuregb_cts)},
	    { title: "cell type", data: "name",
	      className: "dt-right"},
	    { title: "tissue", data: "tissue",
	      className: "dt-right" },
	    { title: "", data: "cellTypeName",
	      className: "dt-right dcc",
	      render: Render.assayIcon,
	      orderable: false }
	]
	
	const make_ct_friendly = (ct) => (Globals.byCellType[ct][0]["name"]);
	let ctBox = (
	    <ResultsTable
		cols={cols}
		data={Globals.cellTypeInfoArr}
		configuregb_cts={this.props.configuregb_cts}
		order={[]}
		buttonsOff={true}
		onTdClick={(td, cellObj) => {
		    this.props.actions.togglGenomeBrowserCelltype(cellObj.value);
		}}
		bFilter={true}
		bLengthChange={false}
		pageLength={10}
            />)

	let rows = [];
	let cts = Array.from(this.props.configuregb_cts);
	cts.sort();
	for(let ct of cts){
	    rows.push(
		<ListItem value={ct}
			  selected="true"
			  n="0"
			  onclick={() => {
				  this.props.actions.togglGenomeBrowserCelltype(ct)
			      }}
		/>);
	}
	let selectedBiosamples = (
	    <div className="panel panel-default">
		<div className="panel-heading">
		    <h3 className="panel-title">Selected biosamples</h3>
		</div>
		<div className="panel-body">
		    {rows}
		</div>
	    </div>);

	let availBiosamples = (
	    <div className="panel panel-default">
		<div className="panel-heading">
		    <h3 className="panel-title">Available biosamples</h3>
		</div>
		<div className="panel-body">
		    {ctBox}
		</div>
	    </div>);	    
	
	let tc = "Thresholded cREs";
	let cc = "Classified cREs";
	let options = (
	    <div ref="options" className="btn-group" data-toggle="buttons">
		<label className="btn btn-info active"
		       onClick={() => { this.optionsChanged(true); }}>
		    <input type="radio" name="cc"
			   checked={this.state.showCombo} />
		    {tc}
		</label>
		<label className="btn btn-info"
		       onClick={() => { this.optionsChanged(false); }}>
		    <input type="radio" name="cc"
		    	   checked={!this.state.showCombo} />
		    {cc}
		</label>
	    </div>);	

	return (
	    <div className="container" style={{width: "100%"}}>
		<br />
		<div className="row">
                    <div className="col-md-2">
			<div className="btn-group" role="group">
			    <button type="button"
				    className="btn btn-primary"
				    onClick={() => {
					    this.gbclick(cre, cts, "UCSC");
					} }>
				{"Open in UCSC"}
			    </button>
			</div>
                    </div>
                    <div className="col-md-4">
			{options}
		    </div>
		    <div className="col-md-4">
			<p className="genomeCreDetailsTitle">{cre.accession}</p>
			{"         "}
			{coord}
                    </div>
		</div>

		<div className="row">
                    <div className="col-md-6">
                    </div>
                    <div className="col-md-6">
                    </div>
		</div>
		
		<div className="row">
                    <div className="col-md-6">
			{selectedBiosamples}
			{availBiosamples}
		    </div>

                    <div className="col-md-6">
                    </div>
		</div>

	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)
(ConfigureGenomeBrowser);

