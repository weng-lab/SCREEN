import React from 'react';

import Ztable from '../../../common/components/ztable/ztable';
import * as ApiClient from '../../../common/api_client';

import GeneExp from '../../geneexp/components/gene_exp';
import Rampage from '../components/rampage';
import MiniPeaks from '../components/minipeaks';

import { CSVLink } from 'react-csv';

import HelpIcon from '../../../common/components/help_icon';

import {TopTissuesTables, NearbyGenomicTable, LinkedGenesTable, ChromHMMTables,
        TfIntersectionTable, OrthologTable, FantomCatTable, FunctionalValidationTable,
	CistromeIntersectionTable, GroundLevelTables} from './details_tables';

import loading from '../../../common/components/loading';

import * as Render from '../../../common/zrenders';

function chunkArr(arr, chunk){
    // from https://jsperf.com/array-splice-vs-underscore
    var i, j, temparray = [];
    for (i = 0, j = arr.length; i < j; i += chunk) {
	temparray.push(arr.slice(i, i + chunk));
    }
    return temparray;
}

function makeTable(data, key, table){
    return React.createElement(Ztable, {data, ...table});
}

function tabEle(globals, data, key, table, numCols) {
    let helpicon = (table && table.helpkey ?
		    <HelpIcon globals={globals} helpkey={table.helpkey} />
		  : "");
    if(table && "typ" in table){
        return (<div className={"col-md-" + (12/numCols)} key={key}>
	    <h4>{table.title} {helpicon}</h4>
	    {React.createElement(table.typ, {data, table})}
	    <br/>
	</div>);
    }
    if (!data || !table) {
	return (<div className={"col-md-" + (12/numCols)} key={key} />);
    }
    return (<div className={"col-md-" + (12/numCols)} key={key}>
	    <h4>{table.title} {helpicon}</h4>
	    {table.csv ? <CSVLink data={data} separator={"\t"}>TSV</CSVLink> : null}
	    {makeTable(data, key, table)}<br/>
    </div>);
}

function tabEles(globals, data, tables, numCols){
    var cols = [];
    for(var key of Object.keys(tables)){
        var _data = (key in data ? data[key] : []);
        let table = tables[key];
	cols.push(tabEle(globals, _data, key, table, numCols));
    };
    if(0 === numCols){
	return cols;
    }
    var chunks = chunkArr(cols, numCols);
    var ret = []
    for(var i = 0; i < chunks.length; i++) {
	var chunk = chunks[i];
	ret.push(<div className="row" key={"chunk" + i}>{chunk}</div>);
    }
    return (<div>{ret}</div>);
}

class ReTabBase extends React.Component{
    constructor(props, key) {
	//console.log(props);
	super(props);
        this.key = key;
	this.loadData = true; // inner component will dynamically load its own data
        this.url = "/dataws/re_detail/" + key;
        this.state = { jq: null, isFetching: true, isError: false };
    }

    shouldComponentUpdate(nextProps, nextState) {
	if("details" === nextProps.maintabs_active){
            if(this.key === nextProps.re_details_tab_active){
		return true;
	    }
	}
	return false;
    }

    componentDidMount(){
	if("details" === this.props.maintabs_active){
            if(this.key === this.props.re_details_tab_active){
		this.loadCRE(this.props);
	    }
	}
    }

    componentWillReceiveProps(nextProps){
	if("details" === nextProps.maintabs_active){
            if(this.key === nextProps.re_details_tab_active){
		this.loadCRE(nextProps);
	    }
	}
    }

    loadCRE = ({assembly, cre_accession_detail}) => {
	if(!this.loadData){
	    return;
	}
        if(!cre_accession_detail || cre_accession_detail in this.state){
            return;
        }
        var q = {assembly, "accession" : cre_accession_detail};
        var jq = JSON.stringify(q);
	if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	ApiClient.getByPost(jq, this.url,
			    (r) => {
				this.setState({...r, isFetching: false, isError: false});
			    },
			    (msg) => {
				console.log("err loading cre details");
				console.log(msg);
				this.setState({jq: null, isFetching: false, isError: true});
			    });
    }

    doRenderWrapper = () => {
        let accession = this.props.cre_accession_detail;
        if(!this.loadData || accession in this.state){
            return this.doRender(this.props.globals, this.props.assembly, 
				 this.state[accession]);
        }
        return loading({...this.state, message: this.props.message});
    }

    render(){
	if("details" === this.props.maintabs_active){
            if(this.key !== this.props.re_details_tab_active){
                return false;
            }
        }
        return (
            <div style={{"width": "100%"}} >
                {this.doRenderWrapper()}
            </div>);
    }
};

class TopTissuesTab extends ReTabBase{
    constructor(props) {
	super(props, "topTissues");
        this.doRender = (globals, assembly, data) => {
            return tabEles(globals, data, TopTissuesTables(globals, assembly), 1);
        }
    }
}

class NearbyGenomicTab extends ReTabBase{
    constructor(props) {
	super(props, "nearbyGenomic");
        this.doRender = (globals, assembly, data) => {
            return tabEles(globals, data, NearbyGenomicTable(globals, assembly), 3);
        }
    }
}

class ChromHMMTab extends ReTabBase{
    constructor(props) {
	super(props, "chromhmm");
        this.doRender = (globals, assembly, data) => {
            return tabEles(globals, data, ChromHMMTables(globals, assembly), 1);
        }
    }
}

class FunctionalValidationTab extends ReTabBase{
    constructor(props) {
	super(props, "functionalValidation");
        this.doRender = (globals, assembly, data) => {
            return tabEles(globals, data, FunctionalValidationTable(globals, assembly), 1);
        }
    }
}

class FantomCatTab extends ReTabBase {
    constructor(props) {
	super(props, "fantom_cat");
	this.doRender = (globals, assembly, data) => {
	    return (
		<div>
		  <div style={{fontSize: '12pt', margin: '10px', backgroundColor: 'rgb(255,165,136)'}} className="interpretation panel">
		      This tab displays the intersection between cCREs and external datasets produced by the&nbsp;
		      <a href='http://fantom.gsc.riken.jp/' target='_blank' rel="noopener noreferrer">FANTOM Consortium</a>.
		      For more information on FANTOM data intersected below, see&nbsp;
		      <a href='https://www.ncbi.nlm.nih.gov/pubmed/28241135' target='_blank' rel="noopener noreferrer">PMID 28241135</a> for RNAs,&nbsp;&nbsp;
		      <a href='https://www.ncbi.nlm.nih.gov/pubmed/24670763' target='_blank' rel="noopener noreferrer">PMID 24670763</a> for enhancers,&nbsp;
		      and <a href='https://www.ncbi.nlm.nih.gov/pubmed/24670764' target='_blank' rel="noopener noreferrer">PMID 24670764</a> for CAGE peaks / promoters.
		      The data used in this intersection and descriptions of the fields presented below are available at the&nbsp;
		      <a href='http://fantom.gsc.riken.jp/5/data/' target='_blank' rel="noopener noreferrer">FANTOM5 website</a>.
		  </div>
		  {tabEles(globals, data, FantomCatTable(globals, assembly, this.props.actions), 1)}
		</div>
	    );
	}
    }
}

class OrthologTab extends ReTabBase {
    constructor(props) {
	super(props, "ortholog");
	this.doRender = (globals, assembly, data) => {
	    return tabEles(globals, data, OrthologTable(globals, assembly,
							this.props.uuid), 1);
	}
    }
}

class TfIntersectionTab extends ReTabBase{
    constructor(props) {
	super(props, "tfIntersection");
        this.doRender = (globals, assembly, data) => {
            return tabEles(globals, data, TfIntersectionTable(globals, assembly), 2);
        }
    }
}

class CistromeIntersectionTab extends ReTabBase {
    constructor(props) {
	super(props, "cistromeIntersection");
	this.doRender = (globals, assembly, data) => {
	    return tabEles(globals, data, CistromeIntersectionTable(globals, assembly), 2);
	}
    }
}

class GeTab extends ReTabBase{
    constructor(props) {
	super(props, "ge");
	this.loadData = false;
	
        this.doRender = (globals, assembly, data) => {
	    const gene = this.props.active_cre.genesallpc.pc[0];
	    return React.createElement(GeneExp, {...this.props, gene});
	}
    }
}

export class RampageTab extends ReTabBase{
    constructor(props) {
	super(props, "rampage");

        this.doRender = (globals, assembly, keysAndData) => {
            let data = keysAndData.tsss;

	    if(0 === data.length) {
		return <div><br />{"No RAMPAGE data found for this cCRE"}</div>;
	    }

            return (
                <div className={"container"} style={{paddingTop: "10px"}}>
		    {React.createElement(Rampage,
                                         {globals, assembly, keysAndData,
                                          width: 800,
                                          barheight: "15"})}
                </div>);
        }
    }
}

class LinkedGenesTab extends ReTabBase{
    constructor(props) {
	super(props, "linkedGenes");
        this.doRender = (globals, assembly, data) => {
            return tabEles(globals, data, LinkedGenesTable(globals, assembly), 1);
        }
    }
}

class GroundLevelTab extends ReTabBase {
    constructor(props) {
	super(props, "groundLevel");
	this.doRender = (globals, assembly, data) => {
	    return tabEles(globals, data, GroundLevelTables(globals, assembly), 1);
	}
    }
}

const DetailsTabInfo = (assembly) => {
    const otherAssembly = assembly === "mm10" ? "hg19" : "mm10";
    
    return {
        topTissues : {title: Render.tabTitle(["In Specific", "Biosamples"]),
                      enabled: true, f: TopTissuesTab},
        nearbyGenomic: {title: Render.tabTitle(["Nearby", "Genomic Features"]),
                        enabled: true, f: NearbyGenomicTab},
        tfIntersection: {title: Render.tabTitle(["TF and His-mod", "Intersection"]),
                         enabled: true, f: TfIntersectionTab},
	/* cistromeIntersection: {title: Render.tabTitle(["Cistrome", "Intersection"]),
                               enabled: assembly === "mm10" || assembly === "GRCh38", f: CistromeIntersectionTab}, */
	fantom_cat: {title: Render.tabTitle(["FANTOM", "Intersection"]),
		     enabled: assembly === "hg19", f: FantomCatTab},
        ge: {title: Render.tabTitle(["Associated", "Gene Expression"]),
             enabled: true, f: GeTab},
        rampage: {title: Render.tabTitle(["Associated", "RAMPAGE Signal"]),
                  enabled: "mm10" !== assembly,
                  f: RampageTab},
        ortholog: {title: Render.tabTitle(["Linked cCREs in", "other Assemblies"]),
	           enabled: true, f: OrthologTab},
	functionalValidation: { title: Render.tabTitle([ "Functional", "Data" ]), enabled: true, f: FunctionalValidationTab },
	chromhmm: { title: Render.tabTitle([ "ChromHMM", "States" ]), enabled: assembly === "mm10", f: ChromHMMTab },
	/* groundLevel: {title: Render.tabTitle(["Ground", "Level"]),
		      enabled: assembly !== "mm10", f: GroundLevelTab, enabled: assembly !== "mm10"}, */
        miniPeaks: {title: Render.tabTitle(["Signal", "Profile"]),
                     enabled: true, f: MiniPeaks},
	linkedGenes: {title: Render.tabTitle(["Linked", "Genes"]),
		      enabled: assembly !== "mm10", f: LinkedGenesTab}
    };
}

export default DetailsTabInfo;
