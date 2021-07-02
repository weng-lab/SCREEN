/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useEffect, useMemo, useState } from 'react';

import Ztable from '../../../common/components/ztable/ztable';
import * as ApiClient from '../../../common/api_client';

import GeneExp from '../../geneexp/components/gene_exp';
import Rampage from '../components/rampage';
import MiniPeaks from '../components/minipeaks';

import { CSVLink } from 'react-csv';

import HelpIcon from '../../../common/components/help_icon';

import {TopTissuesTables, NearbyGenomicTable, LinkedGenesTable, ChromHMMTables,
        TfIntersectionTable, OrthologTable, FantomCatTable, FunctionalValidationTable,
	CistromeIntersectionTable, GroundLevelTables } from './details_tables';

import loading from '../../../common/components/loading';

import * as Render from '../../../common/zrenders';
import { GraphQLImportanceTrack } from 'bpnet-ui';
import { RulerTrack, DenseBigBed, EmptyTrack, GraphQLTranscriptTrack, StackedTracks, SquishTranscriptTrack } from 'umms-gb';
import { Loader, Menu } from 'semantic-ui-react';
import { associateBy, groupBy } from "queryz";
import { linearTransform } from 'jubilant-carnival';

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

    UNSAFE_componentWillReceiveProps(nextProps){
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

const TISSUE_ORDER = [
    "forebrain",
    "midbrain",
    "hindbrain",
    "neural tube",
    "heart",
    "liver",
    "lung",
    "kidney",
    "stomach",
    "intestine",
    "limb",
    "embryonic facial prominence"
];

const COLOR_ORDER = [
    "#95c79f",
    "#6ab368",
    "#3f834e",
    "#183c12",
    "#cf2786",
    "#e3272e",
    "#7b5026",
    "#dbc0f7",
    "#ab76ea",
    "#7658a2",
    "#3854cd",
    "#a8bef7"
];

const TISSUE_ORDER_MAP = ( () => {
    const r = {};
    TISSUE_ORDER.forEach( (x, i) => { r[x] = i; });
    return r;
})();

const COLOR_CCRE_MAP = {
    dELS: "#ffcd00",
    PLS: "#ff0000",
    pELS: "#ffa700"
};

const ChromHMMView = props => {
    const [ page, setPage ] = useState(1);
    const grouped = useMemo( () => groupBy(props.data.chromhmm[1] || [], x => x.tissue, x => x), [ props ]);
    const tissues = useMemo( () => [ ...new Set((props.data.chromhmm[1] || []).map(x => x.tissue)) ].sort( (a, b) => {
        const aa = a.split(" ");
        const bb = b.split(" ");
        return TISSUE_ORDER_MAP[aa.slice(0, aa.length - 1).join(" ")] - TISSUE_ORDER_MAP[bb.slice(0, bb.length - 1).join(" ")] + aa[aa.length - 1].localeCompare(bb[bb.length - 1]) * 0.1
    }), [ props ]);
    const timepoints = useMemo( () => groupBy(
        props.data.chromhmm[1] || [],
        x => x.tissue.split(" ").slice(0, x.tissue.split(" ").length - 1).join(" "),
        x => x.tissue.split(" ")[x.tissue.split(" ").length - 1]
    ), [ props.data ]);
    const tissueCounts = useMemo( () => {
        const c = {};
        tissues.forEach( x => {
            const t = x.split(" ").slice(0, x.split(" ").length - 1).join(" ");
            c[t] = c[t] ? c[t] + 1 : 1;
        });
        return c;
    }, [ tissues ]);
    const states = useMemo( () => [ ...new Set((props.data.chromhmm[1] || []).map(x => x.name)) ].sort(), [ props ]);
    const colormap = useMemo( () => associateBy((props.data.chromhmm[1] || []), x => x.name, x => x.color), [ props ]);
    const tissueOffsets = useMemo( () => TISSUE_ORDER.reduce((v, c) => [ ...v, v[v.length - 1] + 6 * tissueCounts[c] ], [ 33 ]), [ tissues, tissueCounts ]);
    const range = useMemo( () => props.data.chromhmm[1] ? ({ start: Math.min(...props.data.chromhmm[1].map(x => x.cdStart)), end: Math.max(...props.data.chromhmm[1].map(x => x.cdEnd)) }) : ({ start: 1, end: 2 }), [ props.data ]);
    const l = linearTransform(range, { start: 0, end: 1000 });
    const [ transcriptHeight, setTranscriptHeight ] = useState(0);

    return (
        <>
            <Menu pointing secondary>
                <Menu.Item active={page === 1} onClick={() => setPage(1)} style={{ fontSize: "1.2em" }}>Browser View</Menu.Item>
                <Menu.Item active={page === 0} onClick={() => setPage(0)} style={{ fontSize: "1.2em" }}>Table View</Menu.Item>
            </Menu>
            { page === 0 ? (
                props.data.chromhmm[0] && tabEles(props.globals, { "chromhmm": props.data.chromhmm[0] }, ChromHMMTables(props.globals, props.assembly), 1)
            ) : (
                <>
                    <svg width="100%" viewBox="0 0 1250 60">
                        { states.map( (s, i) => (
                            <g transform={`translate(${250 + 75 * (i % 9)},${i >= 9 ? 30 : 0})`}>
                                <rect y={5} height={15} width={15} fill={colormap.get(s)} />
                                <text x={20} y={17} fontSize="12px" color={colormap.get(s)}>{s}</text>
                            </g>
                        ))}
                    </svg>
                    <svg width="100%" viewBox="0 0 1250 600">
                        {TISSUE_ORDER.map( (t, i) => (
                            <g transform={`translate(0,${tissueOffsets[i] + transcriptHeight})`}>
                                <text y={tissueCounts[t] * 6 / 2} x={188} textAnchor="end" fontSize="14px">{t}</text>
                                <text y={tissueCounts[t] * 6 / 2 + 10} x={188} textAnchor="end" fontSize="9px">({[ ...new Set(timepoints.get(t)) ].sort().join(", ")})</text>
                                <line y1={0} y2={tissueCounts[t] * 6} x1={196} x2={196} stroke={COLOR_ORDER[i]} strokeWidth={6} />
                            </g>
                        ))}
                        <g transform="translate(250,0)">
                            <StackedTracks onHeightChanged={x => setTranscriptHeight(x - 30)}>
                                <RulerTrack
                                    width={1000}
                                    height={30}
                                    domain={{ chromosome: props.active_cre.chrom, start: range.start, end: range.end }}
                                />
                                <EmptyTrack height={20} width={1000} transform="" id="" />
                                <GraphQLTranscriptTrack
                                    assembly="mm10"
                                    endpoint="https://ga.staging.wenglab.org/graphql"
                                    id=""
                                    transform=""
                                    domain={{ ...range, chromosome: props.active_cre.chrom }}
                                >
                                    <SquishTranscriptTrack
                                        rowHeight={15}
                                        width={1000}
                                        domain={range}
                                        id=""
                                        transform=""
                                    />
                                </GraphQLTranscriptTrack>
                                <EmptyTrack height={10} width={1000} transform="" id="" />
                                <StackedTracks>
                                    { tissues.map((t, i) => (
                                        <g transform={`translate(0,${i * 6})`} key={i}>
                                            <DenseBigBed
                                                domain={range}
                                                data={grouped.get(t)}
                                                width={1000}
                                                height={10}
                                                key={i}
                                            />
                                        </g>
                                    ))}
                                </StackedTracks>
                            </StackedTracks>
                            <rect fill={COLOR_CCRE_MAP[props.active_cre.pct] || "#0000ff"} width={7} height={7} x={l(props.active_cre.start) - 50} y={35} />
                            <text x={l(props.active_cre.start) - 38} y={42} style={{ fontSize: "11px" }}>{props.active_cre.accession}</text>
                            <rect fill={COLOR_CCRE_MAP[props.active_cre.pct] || "#0000ff"} fillOpacity={0.5} y={48} x={l(props.active_cre.start)} width={l(props.active_cre.start + props.active_cre.len) - l(props.active_cre.start)} height={420 + transcriptHeight} />
                        </g>
                    </svg>
                </>
            )}
        </>
    );
}

class ChromHMMTab extends ReTabBase{
    constructor(props) {
	    super(props, "chromhmm");
        this.doRender = (globals, assembly, data) => {
            return <ChromHMMView globals={globals} assembly={assembly} data={data} active_cre={props.active_cre} key={props.active_cre.accession} />;
        }
    }
}

class FunctionalValidationTab extends ReTabBase{
    constructor(props) {
	super(props, "functionalValidation");
        this.doRender = (globals, assembly, data) => {
            return (
                <div style={{ marginTop: "1em" }}>
                    {tabEles(globals, { "functional_validation": data["functional_validation"], "starr": data["starr"]["results"] }, FunctionalValidationTable(globals, assembly, data["starr"]["reads"] < 10.0 ? "No STARR-seq peaks were identified at this cCRE, but local read depth is insufficient to be confident in a true negative." : "No STARR-seq peaks were identified at this cCRE."), 2)}
                </div>
            );
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

const DATA_QUERY = `
query q($requests: [BigRequest!]!) {
    bigRequests(requests: $requests) {
        data
    }
}
`;

const TFMotifTab = props => {
    const [ data, setData ] = useState([]);
    const [ loading, setLoading ] = useState(true);
    useEffect( () => {
        fetch("https://ga.staging.wenglab.org/graphql", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ "query": DATA_QUERY, variables: { requests: [{
                url: "gs://gcp.wenglab.org/all-conserved-motifs.merged.bigBed",
                chr1: props.active_cre.chrom,
                start: props.active_cre.start,
                chr2: props.active_cre.chrom,
                end: props.active_cre.start + props.active_cre.len
            }]} })
        }).then(x => x.json()).then(x => {
            setData(x.data.bigRequests[0].data);
            setLoading(false);
        });
    }, []);
    return loading ? <Loader active>Loading...</Loader> : (
        <svg width="100%" viewBox="0 0 1000 600">
            <RulerTrack
                width={1000}
                height={30}
                domain={{ chromosome: props.active_cre.chrom, start: props.active_cre.start, end: props.active_cre.start + props.active_cre.len }}
            />
            <EmptyTrack
                width={1000}
                height={30}
                text="TF Motif Occurrences"
                transform="translate(0,40)"
                id=""
            />
            <DenseBigBed
                domain={{ chromosome: props.active_cre.chrom, start: props.active_cre.start, end: props.active_cre.start + props.active_cre.len }}
                width={1000}
                height={20}
                transform="translate(0,70)"
                data={data}
            />
            <EmptyTrack
                width={1000}
                height={30}
                text="Sequence Scaled by PhyloP 100-way"
                transform="translate(0,110)"
                id=""
            />
            <g transform="translate(0,140)">
                <GraphQLImportanceTrack
                    width={1000}
                    height={100}
                    endpoint="https://ga.staging.wenglab.org"
                    signalURL="gs://gcp.wenglab.org/hg38.phyloP100way.bigWig"
                    sequenceURL="gs://gcp.wenglab.org/hg38.2bit"
                    coordinates={{ chromosome: props.active_cre.chrom, start: props.active_cre.start, end: props.active_cre.start + props.active_cre.len }}
                />
            </g>
        </svg>
    );
};

const DetailsTabInfo = (assembly) => {
    return {
        topTissues : {title: Render.tabTitle(["In Specific", "Biosamples"]),
                      enabled: true, f: TopTissuesTab},
        nearbyGenomic: {title: Render.tabTitle(["Nearby", "Genomic Features"]),
                        enabled: true, f: NearbyGenomicTab},
        tfIntersection: {title: Render.tabTitle(["TF and His-mod", "Intersection"]),
                         enabled: true, f: TfIntersectionTab},
        tfIntersectionA: {title: Render.tabTitle(["TF Motifs and", "Sequence Features"]),
                        enabled: true, f: props => <TFMotifTab key={props.active_cre.accession} {...props} />},
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
