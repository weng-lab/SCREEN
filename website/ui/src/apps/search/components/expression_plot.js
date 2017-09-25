import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import $ from 'jquery';

import LargeHorizontalBars from '../../geneexp/components/large_horizontal_bars';

import loading from '../../../common/components/loading';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/zrenders';

/*global Globals */
/*global GlobalAssembly */
/*global GlobalParsedQuery */
/*eslint no-undef: "error"*/

class ExpressionPlot extends React.Component {
    constructor(props) {
	super(props);
        this.key = "ge";
        this.state = { ges : {}, jq: null, isFetching: true, isError: false };
        this.loadCRE = this.loadCRE.bind(this);
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
	if("expression" === nextProps.maintabs_active){
	    return true;
	}
	return false;
    }
    
    componentWillReceiveProps(nextProps){
	if("expression" === nextProps.maintabs_active){
	    this.loadCRE(nextProps);
	}
    }

    _bb() {
	let gclick = this.gclick.bind(this);
	return <button type="button" className="btn btn-default btn-xs" onClick={() => {gclick("UCSC");}}>UCSC</button>;
    }
    
    loadCRE(){
	let gene = null;
	if(GlobalParsedQuery.genes.length > 0){
	    gene = GlobalParsedQuery.genes[0].approved_symbol;
	}
	if (!gene) {
	    return;
	}
	if(gene in this.state.ges){
	    return;
	}
	var q = {GlobalAssembly, gene,
		 compartments_selected: new Set(["cell"]),
		 biosample_types_selected: new Set(Globals.geBiosampleTypes)};
        var jq = JSON.stringify(q);
	if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadCREs....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/geneexpjson",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({jq: null, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
		let nges = {...this.state.ges};
		nges[gene] = r;
		this.setState({ges : nges, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    gclick(name) {
	if (GlobalParsedQuery.genes.length > 0) {
	    this.props.actions.showGenomeBrowser({
		title: GlobalParsedQuery.genes[0].oname,
		start: GlobalParsedQuery.genes[0].start,
		len: GlobalParsedQuery.genes[0].stop - GlobalParsedQuery.genes[0].start,
		chrom: GlobalParsedQuery.genes[0].chrom
	    }, name, "gene");
	}
    }
    
    doRenderWrapper(){
	let gene = null;
	if(GlobalParsedQuery.genes.length > 0){
	    gene = GlobalParsedQuery.genes[0].approved_symbol;
	}
        if (!gene) {
	    return <div />;
	}

	if(gene in this.state.ges){
	    let data = this.state.ges[gene];
	    return (
		<div>
		    <h2><em>{gene}</em> {this._bb()}</h2>
		    {Render.openGeLink(gene)}
		    <br />
		    {React.createElement(LargeHorizontalBars,
					 {...data, width: 800, barheight: "15",
					  isFetching: false})}
		</div>);
	}
	return loading({...this.state});
    }

    render(){
        return (
	    <div style={{"width": "100%"}} >
		{this.doRenderWrapper()}
            </div>);
    }
};

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(ExpressionPlot);
