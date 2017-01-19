const React = require('react');

import ResultsTable from '../../../common/components/results_table'
import BarGraphTable from '../components/bar_graph_table'

import ExpressionHeatmapSet from '../components/expression_heatmap'
import TSSExpressionPlot from '../components/tss'
import MiniPeaks from '../components/minipeaks'

import {TopTissuesTables, TargetGeneTable, NearbyGenomicTable,
        TfIntersectionTable} from './details_tables'

import loading from '../components/loading'

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

    loadCRE({cre_accession_detail}){
        if(cre_accession_detail in this.state){
            return;
        }
        var q = {GlobalAssembly, "accession" : cre_accession_detail};
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
        return loading(this.state);
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

class TfIntersectionTab extends ReTabBase{
    constructor(props) {
	super(props, "tfIntersection");
        this.doRender = (data) => {
            return (<div>hi!</div>);
            return tabEles(data, TfIntersectionTable, 2);
        }
    }
}

class RelatedGeneTab extends ReTabBase{
    constructor(props) {
	super(props, "relatedGene");
        this.doRender = (data) => {
            return (<div>hi!</div>);
	    return (<ExpressionHeatmapSet />);
        }
    }
}

class AssocTssTab extends ReTabBase{
    constructor(props) {
	super(props, "assocTSS");
        this.doRender = (accession) => {
            return (<div>hi!</div>);
            return (<TSSExpressionPlot />);
        }
    }
}

class SimilarREsTab extends ReTabBase{
    constructor(props) {
	super(props, "similarREs");
        this.doRender = (data) => {
            return (<MiniPeaks data={data} />);
        }
    }
}

const DetailsTabInfo = {
    topTissues : {title: "Top tissues", enabled: true,
                  f: TopTissuesTab},
    targetGene : {title: "Candidate Target Genes",
                  enabled: "mm10" != GlobalAssembly, f: TargetGeneTab},
    nearbyGenomic: {title: "Nearby Genomic Features", enabled: true,
                    f: NearbyGenomicTab},
    tfIntersection: {title: "TF and Histone Intersection", enabled: true,
                     f: TfIntersectionTab},
    relatedGene: {title: "Related Gene Expression", enabled: true,
                  f: RelatedGeneTab},
    assocTSS: {title: "Associated TSS Expression", enabled: true,
               f: AssocTssTab},
    similarREs: {title: "Similar REs", enabled: true,
                 f: SimilarREsTab}
};

export default DetailsTabInfo;
