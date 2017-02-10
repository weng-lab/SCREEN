const React = require('react');

import ResultsTable from '../../../common/components/results_table'
import BarGraphTable from '../components/bar_graph_table'

import GeneExp from '../../geneexp/components/gene_exp'
import ExpressionHeatmapSet from '../components/expression_heatmap'
import TSSExpressionPlot from '../components/tss'
import LargeHorizontalBars from '../../geneexp/components/large_horizontal_bars'
import MiniPeaks from '../components/minipeaks'

import {TopTissuesTables, TargetGeneTable, NearbyGenomicTable,
        TfIntersectionTable, OrthologTable} from './details_tables'

import loading from '../../../common/components/loading'

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
    if (!data || !table) {
	return (<div className={"col-md-" + (12/numCols)} key={key} />);
    }
    return (<div className={"col-md-" + (12/numCols)} key={key}>
	    <h4>{table.title}</h4>
	    {makeTable(data, key, table)}<br/>
	    </div>);
}

function tabEles(data, tables, numCols){
    var cols = [];
    for(var key of Object.keys(tables)){
        var _data = (key in data ? data[key] : []);
	cols.push(tabEle(_data, key, tables[key], numCols));
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
        this.state = { isFetching: true, isError: false };
        this.loadCRE = this.loadCRE.bind(this);
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
    }

    componentWillReceiveProps(nextProps){
        // only check/get data if we will become active tab...
        if(this.key == nextProps.re_details_tab_active){
            this.loadCRE(nextProps);
        }
    }

    loadCRE({cre_accession_detail, forcereload, extras}){
        if(!forcereload && cre_accession_detail in this.state){
            return;
        }
        var q = {GlobalAssembly, "accession" : cre_accession_detail, extras};
        var jq = JSON.stringify(q);
        //console.log("loadCRE....", jq);
        this.setState({isFetching: true});
        $.ajax({
            url: this.url,
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({...r, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    doRenderWrapper(){
        let accession = this.props.cre_accession_detail;
        if(accession in this.state){
            return this.doRender(this.state[accession]);
        }
	//console.log(this.props);
        return loading({...this.state, message: this.props.message});
    }

    render(){
        return (<div style={{"width": "100%"}} >
                {this.doRenderWrapper()}
                </div>);
    }
};

class TopTissuesTab extends ReTabBase{
    constructor(props) {
	super(props, "topTissues");
        this.doRender = (data) => {
            return tabEles(data, TopTissuesTables, 2);
        }
    }
}

class NearbyGenomicTab extends ReTabBase{
    constructor(props) {
	super(props, "nearbyGenomic");
        this.doRender = (data) => {
            return tabEles(data, NearbyGenomicTable, 4);
        }
    }
}

class TargetGeneTab extends ReTabBase{
    constructor(props) {
	super(props, "targetGene");
        this.doRender = (data) => {
            return (<div>hi!</div>);
            return tabEles(data, TargetGeneTable, 1);
        }
    }
}

class OrthologTab extends ReTabBase {
    constructor(props) {
	super(props, "ortholog");
	this.doRender = (data) => {
	    return tabEles(data, OrthologTable, 1);
	};
    }
}

class TfIntersectionTab extends ReTabBase{
    constructor(props) {
	super(props, "tfIntersection");
        this.doRender = (data) => {
            return tabEles(data, TfIntersectionTable, 2);
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

class AssocTssTab extends ReTabBase{
    constructor(props) {
	super(props, "assocTSS");
        this.doRender = (data) => {
	    if (data.no_nearby_tss) {
		return <div><br />{"No gene expression data found for this cRE"}</div>;
	    }
	    if (data.genename.startsWith("ENSG")) {
		return <div><br />{"No gene expression data found for this cRE"}</div>;
	    }
            return (<div>
		    <h2><em>{data.genename}</em></h2>
		    {React.createElement(LargeHorizontalBars, {...data, width: 800, barheight: "15"})}
		    </div>);
            return (<TSSExpressionPlot />);
        }
    }
}

class SimilarREsTab extends ReTabBase{
    _onchange(v) {
	this.loadCRE({cre_accession_detail: this.props.cre_accession_detail,
		      forcereload: true, extras: {assay: v}});
    }
    constructor(props) {
	super({...props, message: "This computation may take several minutes."}, "similarREs");
	this._onchange = this._onchange.bind(this);
        this.doRender = (data) => {
            return (<MiniPeaks data={data} onAssayChange={this._onchange} />);
        }
    }
}

const DetailsTabInfo = {
    topTissues : {title: "Top Tissues", enabled: true,
                  f: TopTissuesTab},
    targetGene : {title: "Candidate Target Genes",
                  enabled: 0 && "mm10" != GlobalAssembly, f: TargetGeneTab},
    nearbyGenomic: {title: "Nearby Genomic Features", enabled: true,
                    f: NearbyGenomicTab},
    tfIntersection: {title: "TF and His-mod Intersection", enabled: true,
                     f: TfIntersectionTab},
    relatedGene: {title: "Related Gene Expression", enabled: false,
                  f: RelatedGeneTab},
    assocTSS: {title: "Associated Gene Expression", enabled: true,
               f: AssocTssTab},
    ortholog: {title: "Orthologous cREs in " + (GlobalAssembly == "mm10" ? "hg19" : "mm10"), enabled: true, f: OrthologTab},
    similarREs: {title: (GlobalAssembly == "mm10" ? "Similar cREs" : "Activity Profile"), enabled: false,
                 f: SimilarREsTab}
};

export default DetailsTabInfo;
