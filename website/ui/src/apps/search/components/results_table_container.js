import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as ApiClient from '../../../common/api_client';

import TableWithCart from './table_with_cart';
import {getCommonState, orjoin} from '../../../common/utility';

class ResultsTableContainer extends React.Component {
    constructor(props) {
	super(props);
        this.state = { cres: [], total: 0, cts: null,
                       isFetching: true, isError: false,
                       jq : null}
	this._all = {"dnase": "DNase-seq",
		     "promoter": "H3K4me3 ChIP-seq",
		     "enhancer": "H3K27ac ChIP-seq",
		     "ctcf": "CTCF ChIP-seq" };
    }

    _get_missing(a) {
	let r = [];
	Object.keys(this._all).forEach((k) => {
	    if (!a.includes(k)) {
		r.push(this._all[k]);
	    }
	});
	return r;
    }

    shouldComponentUpdate(nextProps, nextState) {
	return "results" === nextProps.maintabs_active;
    }

    componentDidMount(){
	if(this.props.maintabs_visible){
	    this.loadCREs(this.props);
	}
    }

    componentWillReceiveProps(nextProps){
        //console.log("in componentWillReceiveProps");
        this.loadCREs(nextProps);
    }

    loadCREs(props){
	//console.log("loadCREs in results_app");
        var jq = JSON.stringify(getCommonState(props));
	var setrfacets = this.props.actions.setrfacets;
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadCREs....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
	ApiClient.getByPost(jq, "/dataws/cre_table",
			    (r) => {
				console.log(r);
				this.setState({cres: r["cres"],
					       total: r["total"],
					       cts: r["cts"],
					       missingAssays: this._get_missing(r["rfacets"]),
					       jq, isFetching: false, isError: false});
				setrfacets(r["rfacets"])},
			    (msg) => {
				console.log("err loading cres for table");
				console.log(msg);
				this.setState({cres: [], total: 0,
					       jq, isFetching: false, isError: true});
			    });
        
    }

    searchLinks(gene, useTss, tssDist, assembly, geneTitle){
	let dists = [1000, 2000, 5000, 10000, 25000, 50000];
	let distsRefs = orjoin(dists.map((d) => (
	    <a href={"/search?q=" + gene + "&tssDist=" + d + "&promoter&assembly=" + assembly}>
		{d / 1000}{"kb"}
	    </a>))
	);

	let geneBody = "";
	if(useTss){
	    geneBody = (
		<li>{"overlapping the "}
		    <a href={"/search?q=" + gene + "&assembly=" + assembly}>
			gene body
		    </a>{" of "}{geneTitle}
		</li>);
	}

	let firstLastTss = (
	    <li>{"located between the "}
		<a href={"/search?q=" + gene + "&tss&promoter&assembly=" + assembly}>
		    first and last Transcription Start Sites (TSSs)
		</a>{" of "}{geneTitle}
	    </li>);
	if(useTss && !tssDist){
	    firstLastTss = "";
	}

	let tssUpstream = (<li>{"within "}{distsRefs}{" upstream of the TSSs"}</li>);

	return (
	    <div>
		<ul>
		    {geneBody}
		    {firstLastTss}
		    {tssUpstream}
		</ul>
	    </div>);
    }

    firstLine(useTss, tssDist, geneTitle){
	let click = " Click to see candidate Regulatory Elements:";
	if(useTss){
	    if(tssDist){
		return (
		    <span>
			{"This search is showing candidate Regulatory Elements located between the first and last Transcription Start Sites (TSSs) of "}
			{geneTitle}{" and up to " + tssDist / 1000  + "kb upstream."}{click}
		    </span>);
	    } else {
		return (
		    <span>
			{"This search is showing candidate promoters located between the first and last Transcription Start Sites (TSSs) of "}
			{geneTitle}{"."}{click}
		    </span>);
	    }
	}
	return (
	    <span>
		{"This search is showing cREs overlapping the gene body of "}
		{geneTitle}{"."}{click}
	    </span>);
    }

    doInterpGene({gene, useTss, tssDist, assembly}){
        let geneTitle = (<em>{gene}</em>);
	return (
	    <div>
		{this.firstLine(useTss, tssDist, geneTitle)}
		<br />
		{this.searchLinks(gene, useTss, tssDist, assembly, geneTitle)}
	    </div>);
    }

    render() {
	if("results" !== this.props.maintabs_active){
            return false;
        }


	let cresWithChecks = this.state.cres;
	cresWithChecks.forEach( (cre) =>
	   { cre["checked"] = false
        if(cre.info.accession=== this.props.gb_cres.accession)
        {
          cre["checked"] = true
        }
   	  }

	)

	let interp = this.props.interpretation;
	let interpBox = "";
	if(interp){
	    let interpMsb = interp.hasOwnProperty("msg") ? interp.msg : "";
	    let interpGene = interp.hasOwnProperty("gene") ?
			     this.doInterpGene(interp["gene"]) : "";
	    if(interp.hasOwnProperty("msg") || interp.hasOwnProperty("gene")){
		interpBox = (
		    <div className="interpretation panel">
		        {interpMsb}
		        {interpGene}
	            </div>);
	    }
	}

	return (
	    <div>
	    {interpBox}
		<TableWithCart
		    assembly={this.props.assembly}
                    actions={this.props.actions}
		    cellType={this.props.cellType}
                    data={cresWithChecks}
                    total={this.state.total}
                    cart_accessions={this.props.cart_accessions}
                    isFetching={this.state.isFetching}
		    jq={this.state.jq}
		    missingAssays={this.state.missingAssays}
                    cts={this.state.cts}
	            hasct={this.props.cellType}
		    globals={this.props.globals}
	            make_ct_friendly={ct =>
			this.props.globals.byCellType[ct][0]["name"]}
      gb_cres={this.props.gb_cres}
		/>
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)(ResultsTableContainer);
