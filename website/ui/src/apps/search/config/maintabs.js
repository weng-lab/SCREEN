import React from 'react';

import ResultsTableContainer from '../components/results_table_container';
import ResultsTree from '../components/tree';
import DetailsContainer from '../components/details_container';
import TFDisplay from '../components/tf_display';
import ActivityProfile from '../components/activity_profile';
import GeneExp from '../../geneexp/components/gene_exp';
import RampagePlot from '../components/rampage_plot';
import ConfigureGenomeBrowser from '../components/configure_genome_browser';
import DetailsTabInfo from './details';
import BedUpload from '../components/bed_upload';

import * as Render from '../../../common/zrenders';
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

class GeBigTab extends React.Component{
    shouldComponentUpdate(nextProps, nextState) {
       return "expression" === nextProps.maintabs_active;
    }

    render() {
	if("expression" !== this.props.maintabs_active){
            return false;
        }
	return React.createElement(GeneExp, {...this.props});
    }
}

class RampageBigTab extends React.Component{
    shouldComponentUpdate(nextProps, nextState) {
       return "rampage" === nextProps.maintabs_active;
    }

    render() {
	if("rampage" !== this.props.maintabs_active){
            return false;
        }
	let gene = null;
	const genes = this.props.search.parsedQuery.genes;
	if(genes.length > 0){
	    gene = genes[0].approved_symbol;
	}
        return React.createElement(RampagePlot, {...this.props, gene});
    }
}

class TFTab extends React.Component {
    render() { return (<TFDisplay />); }
}

class ActivityProfileTab extends React.Component {
    render() { return <ActivityProfile key="aprofile" />;}
}

const MainTabInfo = (parsedQuery, globals) => {
    const assembly = parsedQuery.assembly;

    let gene = null;
    if(parsedQuery.genes.length > 0){
	gene = parsedQuery.genes[0].approved_symbol;
    }
    const geTitle = gene ? Render.tabTitle([gene, "Gene Expression"]) : "";
    const rTitle = gene ? Render.tabTitle([gene, "RAMPAGE"]) : "";

    const showRampage = ("mm10" !== assembly) && (!!gene);

    let resultsTitle = isCart() ? "cREs in Cart" : Render.tabTitle(["cRE", "Search Results"]);

    return {results : {title: resultsTitle, visible: true, f: ResultsTab},
	    bedupload : {title: Render.tabTitle(["Bed", "Upload"]), visible: true, 
			 f: BedUploadTab},
	    configgb: {title: Render.tabTitle(["Configure", "Genome Browser"]), 
		       visible: false, f: ConfigureGenomeBrowser},
	    expression: {title: geTitle, visible: !!gene, f: GeBigTab},
	    rampage: {title: rTitle,  visible: showRampage, f: RampageBigTab},
	    aprofile: {title: "Activity Profile", visible: false,
		       f: ActivityProfileTab},
	    ct_tree: {title: "Cell Type Clustering", visible: false, f: TreeTab},
	    tf_enrichment: {title: "TF Enrichment", visible: false, f: TFTab},
	    details: {title: Render.tabTitle(["cRE", "Details"]), visible: false,
		      f: DetailsTab}
    };
}

export default MainTabInfo;
