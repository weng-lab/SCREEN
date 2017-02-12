import React from 'react'

import ResultsTableContainer from '../components/results_app'
import ResultsTree from '../components/tree'
import DetailsContainer from '../components/details_container'
import TFDisplay from '../components/tf_display'
import ActivityProfile from '../components/activity_profile'
import ExpressionBoxplot from '../../geneexp/components/expression_boxplot'

import loading from '../../../common/components/loading'
import DetailsTabInfo from './details'

class ResultsTab extends React.Component{
    render() { return (<ResultsTableContainer />); }
}

class TreeTab extends React.Component{
    render() { return (<ResultsTree />); }
}

class DetailsTab extends React.Component{
    render() { return (<DetailsContainer tabs={DetailsTabInfo} />); }
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
    }
    componentWillReceiveProps() {
	if (!GlobalParsedQuery.approved_symbol) return;
	$.ajax({
	    url: "/geneexpjson",
	    type: "POST",
	    data: JSON.stringify({GlobalAssembly, gene: this.props.gene, compartments_selected: new Set(["cell"])}),
	    dataType: "json",
	    contentType: "application/json",
	    error: function(jqxhr, status, error) {
		console.log("err loading gene expression");
		this.setState({isFetching: false, isError: true});
	    }.bind(this),
	    success: function(r) {
		this.setState({...r, isFetching: false, isError: false});
	    }.bind(this)
	});	
    }
    doRenderWrapper(){
	if (!GlobalParsedQuery.approved_symbol) return <div />;
	let gene = this.props.gene;
	let url = 'http://screen.umassmed.edu/geneexp/' + GlobalAssembly + "/" + this.props.gene;
	let message = <div>This plot is displaying cell-wide expression of <em>{this.props.gene}</em>. To view expression in subcellular compartments, <a href={url}>click here</a>.</div>;
	if("items" in this.state){
	    return (<div><h2><em>{this.props.gene}</em></h2>{message}<br /><ExpressionBoxplot data={this.state} /></div>);
	}
	return loading(this.state);
    }
    render(){
	return (<div style={{"width": "100%"}} >
		{this.doRenderWrapper()}
		</div>);
    }
}

class ExpressionTab extends React.Component {
    render() {return <ExpressionPlot gene={GlobalParsedQuery.approved_symbol} />;}
}

const MainTabInfo = {
    results : {title: "Search Results", visible: true, f: ResultsTab},
    expression: {title: GlobalParsedQuery.approved_symbol ? GlobalParsedQuery.approved_symbol + " Expression" : "", visible: !!GlobalParsedQuery.approved_symbol, f: ExpressionTab},
    aprofile: {title: "Activity Profile", visible: false, f: ActivityProfileTab},
    ct_tree: {title: "Cell Type Clustering", visible: GlobalAssembly == "mm10", f: TreeTab},
    tf_enrichment: {title: "TF Enrichment", visible: false, f: TFTab},
    details: {title: "RE Details", visible: false, f: DetailsTab},
    gcompare: {title: "Group Comparison", visible: false, f: GcompareTab}
};

export default MainTabInfo;
