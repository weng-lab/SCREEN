import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import LargeHorizontalBars from '../../geneexp/components/large_horizontal_bars';

import loading from '../../../common/components/loading';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/zrenders';
import * as ApiClient from '../../../common/api_client';

import LongChecklistFacet from '../../../common/components/longchecklist'

import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import {panelize} from '../../../common/utility'

class ExpressionPlot extends React.Component {
    constructor(props) {
	super(props);
        this.key = "ge";
        this.state = { ges : {}, jq: null, isFetching: true, isError: false };
        this.loadCRE = this.loadCRE.bind(this);
        this.biosampleTypes = this.biosampleTypes.bind(this);
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
    }

    componentDidMount(){
	if("expression" === this.props.maintabs_active){
	    this.loadCRE(this.props);
	}
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
	return (
	    <button type="button"
		    className="btn btn-default btn-xs"
		    onClick={() => {gclick("UCSC");}}>
		UCSC
	    </button>);
    }
    
    loadCRE(){
	let gene = null;
	const genes = this.props.search.parsedQuery.genes;
	if(genes.length > 0){
	    gene = genes[0].approved_symbol;
	}
	if (!gene) {
	    return;
	}
        const q = {assembly: this.props.assembly,
		   gene: gene,
		   compartments_selected: Array.from(this.props.compartments_selected),
                   biosample_types_selected:
		   Array.from(this.props.biosample_types_selected)};
        const jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	ApiClient.getByPost(jq, "/gews/search",
			    (r) => {
				this.setState({[q]: r, isFetching: false, isError: false});
			    },
			    (msg) => {
				console.log("err loading cres for table");
				this.setState({jq: null, isFetching: false, isError: true});
			    });
    }

    gclick(name) {
	if ("items" in this.state){
	    this.props.actions.showGenomeBrowser({
		title: this.state.gene,
		start: this.state.coords.start,
		len: this.state.coords.len,
		chrom: this.state.coords.chrom
	    }, name, "gene");
	}
    }

    biosampleTypes(){
	const biosample_types = this.props.globals.geBiosampleTypes;
	const biosample_types_selected = this.props.biosample_types_selected;
	return panelize("Biosample Types",
                    <LongChecklistFacet
                        title={""}
                        data={biosample_types.map((e) => {
                                return {key: e,
                                        selected: biosample_types_selected.has(e)
                                }})}
                        cols={[{
		                title: "Assay", data: "key",
		                className: "dt-right"
	                    }]}
                        order={[]}
			buttonsOff={true}
        	        mode={CHECKLIST_MATCH_ANY}
                        onTdClick={(c) => { 
			    this.props.actions.toggleBiosampleType(c) 
			} }
			/>);
    }
    
    doRenderWrapper(){
	let gene = null;
	const genes = this.props.search.parsedQuery.genes;
	if(genes.length > 0){
	    gene = genes[0].approved_symbol;
	}
	if(gene){
            const q = {assembly: this.props.assembly,
		       gene: gene,
		       compartments_selected: Array.from(this.props.compartments_selected),
                       biosample_types_selected:
		       Array.from(this.props.biosample_types_selected)};
            if(q in this.state){
		const gi = this.state[q];
		return (
			<div>
			<h2><em>{gi.gene}</em> {this._bb()}</h2>
			{this.biosampleTypes()}
		    {React.createElement(LargeHorizontalBars,
					 {...gi, width: 800, barheight: "15",
					  isFetching: false})}
		    </div>);
	    }
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
