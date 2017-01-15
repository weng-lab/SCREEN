const React = require('react');

import {render_int, render_cell_type} from './results_table'

import ExpressionHeatmapSet from '../components/expression_heatmap'
import TSSExpressionPlot from '../components/tss'
import MiniPeaks from '../components/minipeaks'

import {TopTissuesTables, TargetGeneTable, NearbyGenomicTable,
        TfIntersectionTable} from './details_tables'

import {render_support, render_length, render_supporting_cts} from '../../geneexp/components/candidate_res'

const render_factorbook_link_tf = (d) => (
    '<a href="http://beta.factorbook.org/human/chipseq/tf/' + d + '" target="_blank">' + d + '</a>');

const render_factorbook_link_histone = (d) => (
    '<a href="http://beta.factorbook.org/human/chipseq/histone/' + d + '" target="_blank">' + d + '</a>');

const render_snp_link = (d) => (
    // TODO: support mouse SNPs!
    '<a href="http://ensembl.org/Homo_sapiens/Variation/Explore?vdb=variation;v=' + d + '" target="_blank">' + d + '</a>');

const render_gene_link = (d) => (
    '<a href="http://www.genecards.org/cgi-bin/carddisp.pl?gene=' + d + '" target="_blank">' + d + '</a>');

const render_re_link = (d) => ('<a>' + d + '</a>');

const render_position = (pos) => (pos.chrom + ":" + pos.start + "-" + pos.end);

function chunkArr(arr, chunk){
    // from https://jsperf.com/array-splice-vs-underscore
    var i, j, temparray = [];
    for (i = 0, j = arr.length; i < j; i += chunk) {
	temparray.push(arr.slice(i, i + chunk));
    }
    return temparray;
}

function makeTable(data, key, table){
    var _data = (data[key] ? data[key] : []);
    if(table.bar_graph){
        return React.createElement(BarGraphTable, {data, ...table,
                                                   bLengthChange: false,
                                                   rank_f: bg_rank_f});
    }
    return React.createElement(ResultsTable, {data, ...table,
                                              bLengthChange: true});
}

function tabEle(data, key, table, numCols) {
    return (<div className={"col-md-" + (12/numCols)} key={key}>
	    <h4>{table.title}</h4>
	    {makeTable(data, key, table)}<br/>
	    </div>);
}

function tabEles(data, tables, numCols = 4){
    var cols = [];
    for(var key of Object.keys(tables)){
	cols.push(tabEle(data, key, tables[key], numCols));
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

class TopTissuesTab extends React.Component{
    render(){
        return tabEles({}, TopTissuesTables, 2);
    }
}

class TargetGeneTab extends React.Component{
    render(){
        return tabEles({}, TargetGeneTable, 1);
    }
}

class NearbyGenomicTab extends React.Component{
    render(){
        return tabEles({}, NearbyGenomicTable, 4);
    }
}

class TfIntersectionTab extends React.Component{
    render(){
        return tabEles({}, TfIntersectionTable, 2);
    }
}

class RelatedGeneTab extends React.Component{
    render(){
	return (<ExpressionHeatmapSet />);
    }
}

class AssocTssTab extends React.Component{
    render(){
        return (<TSSExpressionPlot />);
    }
}

class SimilarREsTab extends React.Component{
    render(){
        return (<MiniPeaks />);
    }
}

const DetailsTabInfo = {
    topTissues : {title: "Top tissues", enabled: true, f: TopTissuesTab},
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
    similarREs: {title: "Similar REs", enabled: true, f: SimilarREsTab}
};

export default DetailsTabInfo;