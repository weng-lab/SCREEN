import React from 'react'

import ResultsTable from '../../../common/components/results_table'
import BarGraphTable from '../components/bar_graph_table'

import GeneExp from '../../geneexp/components/gene_exp'
import LargeHorizontalBars from '../../geneexp/components/large_horizontal_bars'
import Rampage from '../components/rampage'
import MiniPeaks from '../components/minipeaks'

import HelpIcon from '../../../common/components/help_icon'

import {TopTissuesTables, TargetGeneTable, NearbyGenomicTable,
        TfIntersectionTable, OrthologTable, FantomCatTable, CistromeIntersectionTable} from './details_tables'

import loading from '../../../common/components/loading'

import * as Render from '../../../common/renders'

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
    return React.createElement(ResultsTable, {data, ...table});
}

function tabEle(data, key, table, numCols) {
    let helpicon = (table && table.helpkey ? <HelpIcon helpkey={table.helpkey} /> : "");
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

function tabEles(data, tables, numCols){
    var cols = [];
    for(var key of Object.keys(tables)){
        var _data = (key in data ? data[key] : []);
        let table = tables[key];
	cols.push(tabEle(_data, key, table, numCols));
    };
    if(0 == numCols){
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

    loadCRE({cre_accession_detail}){
        if(!cre_accession_detail || cre_accession_detail in this.state){
            return;
        }
        var q = {GlobalAssembly, "accession" : cre_accession_detail};
        var jq = JSON.stringify(q);
	if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadCREs....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: this.url,
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cre details");
		console.log(error);
                this.setState({jq: null, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({...r, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    doRenderWrapper(){
        let accession = this.props.cre_accession_detail;
        if(accession in this.state){
	    //console.log("doRenderWrapper", this.key);
            return this.doRender(this.state[accession]);
        }
	//console.log(this.props);
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
        this.doRender = (data) => {
            return tabEles(data, TopTissuesTables(), 2);
        }
    }
}

class NearbyGenomicTab extends ReTabBase{
    constructor(props) {
	super(props, "nearbyGenomic");
        this.doRender = (data) => {
            return tabEles(data, NearbyGenomicTable(), 3);
        }
    }
}

class FantomCatTab extends ReTabBase {
    constructor(props) {
	super(props, "fantom_cat");
	this.doRender = (data) => {
	    return tabEles(data, FantomCatTable(this.props.actions), 1);
	}
    }
}

class TargetGeneTab extends ReTabBase{
    constructor(props) {
	super(props, "targetGene");
        this.doRender = (data) => {
            return (<div>hi!</div>);
            return tabEles(data, TargetGeneTable(), 1);
        }
    }
}

class OrthologTab extends ReTabBase {
    constructor(props) {
	super(props, "ortholog");
	this.doRender = (data) => {
            let d = data.ortholog;
	    if(d.length > 0) {
	        return tabEles(data, OrthologTable(), 1);
	    }
            return <div><br />{"No orthologous cRE identified."}</div>;
	}
    }
}

class TfIntersectionTab extends ReTabBase{
    constructor(props) {
	super(props, "tfIntersection");
        this.doRender = (data) => {
            return tabEles(data, TfIntersectionTable(), 2);
        }
    }
}

class CistromeIntersectionTab extends ReTabBase {
    constructor(props) {
	super(props, "cistromeIntersection");
	this.doRender = (data) => {
	    return tabEles(data, CistromeIntersectionTable(), 2);
	}
    }
}

class RelatedGeneTab extends ReTabBase{
    constructor(props) {
	super(props, "relatedGene");
        this.doRender = (data) => {
            return (<div></div>);
	    return (<ExpressionHeatmapSet />);
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
	
        this.doRender = (data) => {
	    let gene = data.genename;
	    let gclick = this.gclick.bind(this);
	    return (
		<div>
		    <h4>
			Gene Expression Profiles by RNA-seq
			<HelpIcon helpkey={"GeneExpression"} />
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

        this.doRender = (keysAndData) => {
            let sortedKeys = keysAndData.sortedKeys;
            let data = keysAndData.tsss;

	    if(0 == data.length) {
		return <div><br />{"No RAMPAGE data found for this cRE"}</div>;
	    }

            return (
                <div className={"container"} style={{paddingTop: "10px"}}>
		    {React.createElement(Rampage,
                                         {keysAndData,
                                          width: 800,
                                          barheight: "15"})}
                </div>);
        }
    }
}

const DetailsTabInfo = () => {
    let otherAssembly = GlobalAssembly == "mm10" ? "hg19" : "mm10";

    let off = {
        targetGene : {title: "Candidate Target Genes",
                      enabled: 0 && "mm10" != GlobalAssembly, f: TargetGeneTab},
        relatedGene: {title: "Related Gene Expression", enabled: false,
                      f: RelatedGeneTab}};

    return {
        topTissues : {title: Render.tabTitle(["Top", "Tissues"]),
                      enabled: true, f: TopTissuesTab},
        nearbyGenomic: {title: Render.tabTitle(["Nearby", "Genomic Features"]),
                        enabled: true, f: NearbyGenomicTab},
        tfIntersection: {title: Render.tabTitle(["TF and His-mod", "Intersection"]),
                         enabled: true, f: TfIntersectionTab},
	cistromeIntersection: {title: Render.tabTitle(["Cistrome", "Intersection"]),
                         enabled: GlobalAssembly == "mm10" || GlobalAssembly == "hg38", f: CistromeIntersectionTab},
	fantom_cat: {title: Render.tabTitle(["FANTOM CAT", "Intersection"]),
		    enabled: true, f: FantomCatTab},
        ge: {title: Render.tabTitle(["Associated", "Gene Expression"]),
             enabled: true, f: GeTab},
        rampage: {title: Render.tabTitle(["Associated", "RAMPAGE Signal"]),
                  enabled: "mm10" != GlobalAssembly,
                  f: RampageTab},
        ortholog: {title: Render.tabTitle(["Orthologous cREs", "in " + otherAssembly]),
	           enabled: true, f: OrthologTab},
        similarREs: {title: Render.tabTitle(["Signal", "Profile"]),
                     enabled: true, f: MiniPeaks}
    };
}

export default DetailsTabInfo;
