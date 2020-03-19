import React from 'react';

import BedUpload from '../components/bed_upload';
import ConfigureGenomeBrowser from '../components/configure_genome_browser';
import DetailsContainer from '../components/details_container';
import DetailsTabInfo from './details';
import GeneExp from '../../geneexp/components/gene_exp';
import RampagePlot from '../components/rampage_plot';
import ResultsTableContainer from '../components/results_table_container';

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
	const gene = this.props.genes[0].approved_symbol;
	return React.createElement(GeneExp, {...this.props, gene});
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

const MainTabInfo = (parsedQuery, globals) => {
    const assembly = parsedQuery.assembly;

    let gene = null;
    if(parsedQuery.genes.length > 0){
	gene = parsedQuery.genes[0].approved_symbol;
    }
    const geTitle = gene ? Render.tabTitle([gene, "Gene Expression"]) : "";
    const rTitle = gene ? Render.tabTitle([gene, "RAMPAGE"]) : "";

    const showRampage = ("mm10" !== assembly) && (!!gene);

    let resultsTitle = isCart() ? "cCREs in Cart" : Render.tabTitle(["cCRE", "Search Results"]);

    return {results : {title: resultsTitle, visible: true, f: ResultsTab},
	    /*bedupload : {title: Render.tabTitle(["Bed", "Upload"]),
			 visible: true, f: BedUploadTab},*/
	    expression: {title: geTitle, visible: !!gene, f: GeBigTab},
	    rampage: {title: rTitle,  visible: showRampage, f: RampageBigTab},
	    details: {title: Render.tabTitle(["cCRE", "Details"]), visible: false,
		      f: DetailsTab},
	    configgb: {title: Render.tabTitle(["Configure", "Genome Browser"]), 
		       visible: false, f: ConfigureGenomeBrowser}
    };
}

export default MainTabInfo;
