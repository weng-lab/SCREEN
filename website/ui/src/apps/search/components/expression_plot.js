import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import LargeHorizontalBars from '../../geneexp/components/large_horizontal_bars';

import loading from '../../../common/components/loading';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/zrenders';
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
    
    loadCRE(){
	let gene = null;
	const genes = this.props.search.parsedQuery.genes;
	if(genes.length > 0){
	    gene = genes[0].approved_symbol;
	}
	if (!gene) {
	    return;
	}
	if(gene in this.state.ges){
	    return;
	}
	const q = {assembly: this.props.assembly,
		   gene,
		   compartments_selected: ["cell"],
		   biosample_types_selected: this.props.globals.geBiosampleTypes};
        const jq = JSON.stringify(q);
	if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	ApiClient.getByPost(jq, "/gews/search",
			    (r) => {
				let nges = {...this.state.ges};
				nges[gene] = r;
				this.setState({ges : nges, isFetching: false, isError: false});
			    },
			    (msg) => {
				console.log("err loading cres for table");
				this.setState({jq: null, isFetching: false, isError: true});
			    });
    }

    gclick(name) {
	const genes = this.props.search.parsedQuery.genes;
	if (genes.length > 0) {
	    const gene = genes[0];
	    this.props.actions.showGenomeBrowser({
		title: gene.oname,
		start: gene.start,
		len: gene.stop - gene.start,
		chrom: gene.chrom
	    }, name, "gene");
	}
    }
    
    doRenderWrapper(){
	const genes = this.props.search.parsedQuery.genes;
	let gene = null;
	if(genes.length > 0){
	    gene = genes[0].approved_symbol;
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
