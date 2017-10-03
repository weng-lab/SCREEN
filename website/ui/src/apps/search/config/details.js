import React from 'react';

import Ztable from '../../../common/components/ztable/ztable';
import BarGraphTable from '../components/bar_graph_table';
import * as ApiClient from '../../../common/api_client';

import LargeHorizontalBars from '../../geneexp/components/large_horizontal_bars';
import Rampage from '../components/rampage';
import MiniPeaks from '../components/minipeaks';

import HelpIcon from '../../../common/components/help_icon';

import {TopTissuesTables, NearbyGenomicTable, LinkedGenesTable,
        TfIntersectionTable, OrthologTable, FantomCatTable, CistromeIntersectionTable} from './details_tables';

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
    if(table.bar_graph){
        return React.createElement(BarGraphTable, {data, ...table});
    }
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
        this.url = "/dataws/re_detail/" + key;
        this.state = { jq: null, isFetching: true, isError: false };
        this.loadCRE = this.loadCRE.bind(this);
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
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

    loadCRE({assembly, cre_accession_detail}){
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

    doRenderWrapper(){
        let accession = this.props.cre_accession_detail;
        if(accession in this.state){
            return this.doRender(this.props.globals, this.props.assembly, this.state[accession]);
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
            return tabEles(globals, data, TopTissuesTables(globals, assembly), 2);
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

class FantomCatTab extends ReTabBase {
    constructor(props) {
	super(props, "fantom_cat");
	this.doRender = (globals, assembly, data) => {
	    return tabEles(globals, data, FantomCatTable(globals, assembly, this.props.actions), 1);
	}
    }
}

class OrthologTab extends ReTabBase {
    constructor(props) {
	super(props, "ortholog");
	this.doRender = (globals, assembly, data) => {
            let d = data.ortholog;
	    if(d.length > 0) {
	        return tabEles(globals, data, OrthologTable(globals, assembly), 1);
	    }
            return <div><br />{"No orthologous cRE identified."}</div>;
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
    gclick(name, data) {
	this.props.actions.showGenomeBrowser({
	    title: data.genename,
	    start: data.start,
	    len: data.stop - data.start,
	    chrom: data.chrom
	}, name, "gene");
    }
    constructor(props) {
	super(props, "ge");
	
        this.doRender = (globals, assembly, data) => {
	    let gene = data.genename;
	    let gclick = this.gclick.bind(this);
	    return (
		<div>
		    <h4>
			Gene Expression Profiles by RNA-seq
			<HelpIcon globals={this.props.globals} helpkey={"GeneExpression"} />
		    </h4>
		    <h2 style={{display: "inline"}}>
			<em>{data.genename}</em>
		    </h2>{" "}
		    <button type="button" className="btn btn-default btn-xs" onClick={() => {gclick("UCSC", data)}}>UCSC</button><br />
                    {data.ensemblid_ver}
		    {Render.openGeLink(gene)}
		    <br />
		    {React.createElement(LargeHorizontalBars,
					 {...data, width: 800, barheight: "15",
					 isFetching: false})}
		</div>);
        }
    }
}

class RampageTab extends ReTabBase{
    constructor(props) {
	super(props, "rampage");

        this.doRender = (globals, assembly, keysAndData) => {
            let data = keysAndData.tsss;

	    if(0 === data.length) {
		return <div><br />{"No RAMPAGE data found for this cRE"}</div>;
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

const DetailsTabInfo = (assembly) => {
    const otherAssembly = assembly === "mm10" ? "hg19" : "mm10";

    return {
        topTissues : {title: Render.tabTitle(["Top", "Tissues"]),
                      enabled: true, f: TopTissuesTab},
        nearbyGenomic: {title: Render.tabTitle(["Nearby", "Genomic Features"]),
                        enabled: true, f: NearbyGenomicTab},
        tfIntersection: {title: Render.tabTitle(["TF and His-mod", "Intersection"]),
                         enabled: true, f: TfIntersectionTab},
	cistromeIntersection: {title: Render.tabTitle(["Cistrome", "Intersection"]),
                         enabled: assembly === "mm10" || assembly === "hg38", f: CistromeIntersectionTab},
	fantom_cat: {title: Render.tabTitle(["FANTOM CAT", "Intersection"]),
		    enabled: assembly === "hg19", f: FantomCatTab},
        ge: {title: Render.tabTitle(["Associated", "Gene Expression"]),
             enabled: true, f: GeTab},
        rampage: {title: Render.tabTitle(["Associated", "RAMPAGE Signal"]),
                  enabled: "mm10" !== assembly,
                  f: RampageTab},
        ortholog: {title: Render.tabTitle(["Orthologous cREs", "in " + otherAssembly]),
	           enabled: true, f: OrthologTab},
        similarREs: {title: Render.tabTitle(["Signal", "Profile"]),
                     enabled: true, f: MiniPeaks},
	linkedGenes: {title: Render.tabTitle(["Linked", "Genes"]),
		      enabled: true, f: LinkedGenesTab}
    };
}

export default DetailsTabInfo;
