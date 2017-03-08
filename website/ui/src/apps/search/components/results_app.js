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

    doInterpGene({gene, noTss, useTss, tssDist, assembly}){
        let geneTitle = (<em>{gene}</em>);
	
        if(noTss){
            return (
		<span>
		    "This search is showing cREs overlapping the gene body of "
		    {geneTitle}"."
		</span>);
	}
	
        if(useTss){
            if(!tssDist){
                return (
		    <div>
			{"This search is showing candidate promoters located between the first and last TSS's of "}{geneTitle}{"."}
			<br />
			{"To see cREs overlapping the gene body of "}{geneTitle}{", "}
			<a href={"/search?q=" + gene + "&assembly=" + assembly}>
			    click here
			</a>.
		    </div>);
	    } 
	    return (
		<div>
		    {"This search is showing candidate promoters located between the first and last TSS's of "}
		    {geneTitle}
		    {" and up to " + tssDist + " upstream."}
		    <br />
		    {"To see cREs overlapping the gene body of "}
		    {geneTitle}
		    {", "}
		    <a href={"/search?q=" + gene + "&assembly=" + assembly}>
			click here
		    </a>.
		</div>);
	}

	let dists = ["1kb", "2kb", "5kb", "10kb", "25kb", "50kb"];
	let distsRefs = orjoin(dists.map((d) => (
	    <a href={"/search?q=" + gene + "+tssdist_" + d + "+promoter&assembly=" + assembly}>
		{d}
	    </a>))
	);
	
        return (
	    <div>
		{"This search is showing cREs overlapping the gene body of "}
		{geneTitle}{"."}
		<br />
		{"To see candidate promoters located between the first and last TSS's of "}{geneTitle}{", "}
		<a href={"/search?q=" + gene + "+tss+promoter&assembly=" + assembly}>
		    click here
		</a>{","}
		<br />
		{"or click one of the following links to see candidate promoters within "}
		{distsRefs}
		{" upstream of the TSSs."}
	    </div>);
    }
    
    render() {
	let interp = GlobalParsedQuery["interpretation"];
	let interpMsb = interp.hasOwnProperty("msg") ? interp.msg : "";
	let interpGene = interp.hasOwnProperty("gene") ?
			 this.doInterpGene(interp["gene"]) : "";

	return (
	    <div>
		<div className="interpretation">
		    {interpMsb}
		    {interpGene}
		</div>
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

