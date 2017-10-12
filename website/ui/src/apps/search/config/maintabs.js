import React from 'react';

import ResultsTableContainer from '../components/results_table_container';
import ResultsTree from '../components/tree';
import DetailsContainer from '../components/details_container';
import TFDisplay from '../components/tf_display';
import ActivityProfile from '../components/activity_profile';
import ExpressionPlot from '../components/expression_plot';
import ConfigureGenomeBrowser from '../components/configure_genome_browser';
import DetailsTabInfo from './details';
import BedUpload from '../components/bed_upload';

import {isCart} from '../../../common/utility';

class ResultsTab extends React.Component{
    shouldComponentUpdate(nextProps, nextState) {
       return "results" === nextProps.maintabs_active;
    }

    render() {
	if("results" !== this.props.maintabs_active){
            return false;
        }
        return React.createElement(ResultsTableContainer, this.props);
    }
}

class BedUploadTab extends React.Component{
    shouldComponentUpdate(nextProps, nextState) {
       return "bedupload" === nextProps.maintabs_active;
    }

    render() {
	if("bedupload" !== this.props.maintabs_active){
            return false;
        }
        return React.createElement(BedUpload, this.props);
    }
}

class TreeTab extends React.Component{
    render() { return (<ResultsTree />); }
}

class DetailsTab extends React.Component{
    shouldComponentUpdate(nextProps, nextState) {
       return "details" === nextProps.maintabs_active;
    }
    render() {
       if("details" !== this.props.maintabs_active){
            return false;
       }
	return React.createElement(DetailsContainer, {...this.props,
						      tabs: DetailsTabInfo(this.props.assembly)});
    }
}

class ExpressionPlotTab extends React.Component{
    shouldComponentUpdate(nextProps, nextState) {
       return "expression" === nextProps.maintabs_active;
    }

    render() {
	if("expression" !== this.props.maintabs_active){
            return false;
        }
        return React.createElement(ExpressionPlot, this.props);
    }
}

class TFTab extends React.Component {
    render() { return (<TFDisplay />); }
}

class ActivityProfileTab extends React.Component {
    render() { return <ActivityProfile key="aprofile" />;}
}

const MainTabInfo = (parsedQuery, globals) => {
    let gene = null;
    if(parsedQuery.genes.length > 0){
	gene = parsedQuery.genes[0].approved_symbol;
    }
    let geTitle = gene ? gene + " Expression" : "";

    let resultsTitle = isCart() ? "cREs in Cart" : "cRE Search Results";

    return {results : {title: resultsTitle, visible: true, f: ResultsTab},
	    bedupload : {title: "Bed Upload", visible: true, f: BedUploadTab},
	    configgb: {title: "Configure Genome Browser", visible: false,
		       f: ConfigureGenomeBrowser},
	    expression: {title: geTitle, visible: !!gene, f: ExpressionPlotTab},
	    aprofile: {title: "Activity Profile", visible: false,
		       f: ActivityProfileTab},
	    ct_tree: {title: "Cell Type Clustering", visible: false, f: TreeTab},
	    tf_enrichment: {title: "TF Enrichment", visible: false, f: TFTab},
	    details: {title: "cRE Details", visible: false, f: DetailsTab}
    };
}

export default MainTabInfo;
