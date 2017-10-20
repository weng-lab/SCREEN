import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import LargeHorizontalBars from '../../geneexp/components/large_horizontal_bars';

import loading from '../../../common/components/loading';

import * as Actions from '../actions/main_actions';
import * as ApiClient from '../../../common/api_client';

class ExpressionPlot extends React.Component {
    constructor(props) {
	super(props);
        this.key = "ge";
        this.state = { ges : {}, jq: null, isFetching: true, isError: false };
        this.loadCRE = this.loadCRE.bind(this);
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
    
    loadCRE(p){
	let gene = null;
	const genes = p.search.parsedQuery.genes;
	if(genes.length > 0){
	    gene = genes[0].approved_symbol;
	}
	if (!gene) {
	    return;
	}
        const q = {assembly: p.assembly,
		   gene: gene,
		   compartments_selected: Array.from(p.compartments_selected),
                   biosample_types_selected:
		   Array.from(p.biosample_types_selected)};
        const jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	ApiClient.getByPost(jq, "/gews/search",
			    (r) => {
				this.setState({[jq]: r, isFetching: false, isError: false});
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
            const jq = JSON.stringify(q);
            if(jq in this.state){
		const gi = this.state[jq];
		return (
		    <div>
			<div className="row" style={{width: "100%"}}>
			    <div className="col-md-3">
				<h2><em>{gi.gene}</em> {this._bb()}</h2>
			    </div>
			</div>
			{React.createElement(LargeHorizontalBars,
					     {...gi, width: 800, barheight: "15",
					      globals: this.props.globals,
					      actions: this.props.actions,
					      biosample_types_selected: this.props.biosample_types_selected,
					      compartments_selected: this.props.compartments_selected,
					      useBoxes: true})}
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
