import React from 'react'

import ResultsTableContainer from '../components/results_app'
import ResultsTree from '../components/tree'
import DetailsContainer from '../components/details_container'
import TFDisplay from '../components/tf_display'
import ActivityProfile from '../components/activity_profile'
import ExpressionBoxplot from '../../geneexp/components/expression_boxplot'

import loading from '../../../common/components/loading'
import DetailsTabInfo from './details'

import * as Render from '../../../common/renders'

class ResultsTab extends React.Component{
    render() { return (<ResultsTableContainer />); }
}

class TreeTab extends React.Component{
    render() { return (<ResultsTree />); }
}

class DetailsTab extends React.Component{
    render() { return (<DetailsContainer tabs={DetailsTabInfo()} />); }
}

class GcompareTab extends React.Component{
    render() { return (gcompare); }
}

class TFTab extends React.Component {
    render() { return (<TFDisplay />); }
}

class ActivityProfileTab extends React.Component {
    render() { return <ActivityProfile key="aprofile" />;}
}

class ExpressionPlot extends React.Component {
    constructor(props) {
	super(props);
	this.state = {};
	this.state = { ges : {}, jq: null, isFetching: true, isError: false };
        this.loadGe = this.loadGe.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        // only check/get data if we are active tab
        if("expression" == nextProps.maintabs_active){
            this.loadGe(nextProps);
        }
    }

    loadGe({}){
	let gene = GlobalParsedQuery.approved_symbol;
	if (!gene) {
	    return;
	}
	if(gene in this.state.ges){
	    return;
	}
	var q = {GlobalAssembly, gene, compartments_selected: new Set(["cell"]),
		 biosample_types_selected: new Set(Globals.geBiosampleTypes)};
	var jq = JSON.stringify(q);
	if(this.state.jq == jq){
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
		console.log("err loading gene expression");
		this.setState({isFetching: false, isError: true});
	    }.bind(this),
	    success: function(r) {
		let nges = {...this.state.ges};
		nges[gene] = r;
		this.setState({ges : nges, isFetching: false, isError: false});
	    }.bind(this)
	});
    }
    
    doRenderWrapper(){
	let gene = GlobalParsedQuery.approved_symbol;
	if (!gene) {
	    return <div />;
	}
		
	if(gene in this.state.ges){
	    return (
		<div>
		    <h2><em>{this.props.gene}</em></h2>
		    {Render.openGeLink(gene)}<br />
		<ExpressionBoxplot data={this.state.ges[gene]} />
		</div>);
	}
	return loading(this.state);
    }

    render(){
	return (<div style={{"width": "100%"}} >
		{this.doRenderWrapper()}
		</div>);
    }
}

const MainTabInfo = () => {
    let gene = GlobalParsedQuery.approved_symbol;
    let geTitle = gene ? gene + " Expression" : "";
    
    return {results : {title: "cRE Search Results", visible: true, f: ResultsTab},
	    expression: {title: geTitle, visible: !!gene, f: ExpressionPlot},
	    aprofile: {title: "Activity Profile", visible: false, f: ActivityProfileTab},
	    ct_tree: {title: "Cell Type Clustering", visible: GlobalAssembly == "mm10", f: TreeTab},
	    tf_enrichment: {title: "TF Enrichment", visible: false, f: TFTab},
	    details: {title: "cRE Details", visible: false, f: DetailsTab},
	    gcompare: {title: "Group Comparison", visible: false, f: GcompareTab}};
}

export default MainTabInfo;
