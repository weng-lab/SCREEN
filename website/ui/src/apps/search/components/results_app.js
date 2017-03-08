import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import TableWithCart from './table_with_cart';
import {getCommonState, orjoin} from '../../../common/utility';

class ResultsTableContainer extends React.Component {
    constructor(props) {
	super(props);
        this.state = { cres: [], total: 0, isFetching: true, isError: false,
                       jq : null}
	this._all = {"dnase": "DNase-seq",
		     "promoter": "H3K4me3 ChIP-seq",
		     "enhancer": "H3K27ac ChIP-seq",
		     "ctcf": "CTCF ChIP-seq" };
    }

    _get_missing(a) {
	let r = [];
	Object.keys(this._all).map((k) => {
	    if (!a.includes(k)) r.push(this._all[k]);
	});
	return r;
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
        var q = getCommonState(props);
        var jq = JSON.stringify(q);
	var setrfacets = this.props.actions.setrfacets;
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadCREs....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/dataws/cre_table",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({cres: [], total: 0,
                               jq, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({cres: r["cres"], total: r["total"],
			       nodnase: this._get_missing(r["rfacets"]),
                               jq, isFetching: false, isError: false});
		setrfacets(r["rfacets"]);
            }.bind(this)
        });
    }

    searchLinks(gene, noTss, useTss, tssDist, assembly, geneTitle){
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
		    first and last TSSs
		</a>{" of "}{geneTitle}
	    </li>);
	if(useTss && !tssDist){
	    firstLastTss = "";
	}

	let tssUpstream = (<li>{"within "}{distsRefs}{" upstream of the TSSs"}</li>);

	return (
	    <div>
		<span className={"glyphicon glyphicon-info-sign"} aria-hidden="true"></span>
		{" Click to see candidate Regulatory Elements:"}
		<ul>
		    {geneBody}
		    {firstLastTss}
		    {tssUpstream}
		</ul>
	    </div>);
    }

    firstLine(gene, noTss, useTss, tssDist, assembly, geneTitle){
	if(useTss){
	    if(tssDist){
		return (
		    <span>
			{"This search is showing candidate Regulatory Elements located between the first and last TSSs of "}
			{geneTitle}{" and up to " + tssDist / 1000  + "kb upstream."}
		    </span>);
	    } else {
		return (
		    <span>
			{"This search is showing candidate promoters located between the first and last TSSs of "}
			{geneTitle}{"."}
		    </span>);
	    }
	}
	return (
	    <span>
		{"This search is showing cREs overlapping the gene body of "}
		{geneTitle}{"."}
	    </span>);
    }

    doInterpGene({gene, noTss, useTss, tssDist, assembly}){
	if(0){
	    console.log("gene, noTss, useTss, tssDist, assembly",
			gene, noTss, useTss, tssDist, assembly);
	}
        let geneTitle = (<em>{gene}</em>);    
	return (
	    <div>
		<span className={"glyphicon glyphicon-info-sign"} aria-hidden="true"></span>
		{" "}
		{this.firstLine(gene, noTss, useTss, tssDist, assembly, geneTitle)}
		<br />
		{this.searchLinks(gene, noTss, useTss, tssDist, assembly, geneTitle)}
	    </div>);
    }
    
    render() {
	let interp = GlobalParsedQuery["interpretation"];
	let interpBox = "";
	if(interp){
	    let interpMsb = interp.hasOwnProperty("msg") ? interp.msg : "";
	    let interpGene = interp.hasOwnProperty("gene") ?
			     this.doInterpGene(interp["gene"]) : "";
	    interpBox = (
		<div className="interpretation panel">
		    {interpMsb}
		    {interpGene}
		</div>);
	}
	
	return (
	    <div>
		{interpBox}
		<TableWithCart
                    actions={this.props.actions}
                    data={this.state.cres}
                    total={this.state.total}
                    cart_accessions={this.props.cart_accessions}
                    isFetching={this.state.isFetching}
		    jq={this.state.jq}
		    nodnase={this.state.nodnase}
		    hasct={this.props.cellType}
		/>
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)
(ResultsTableContainer);

