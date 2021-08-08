/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useRef, useMemo, useState, useCallback } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import { ApolloClient, ApolloProvider, gql, InMemoryCache, useQuery } from '@apollo/client';

import * as Actions from '../actions/main_actions';
import * as ApiClient from '../../../common/api_client';
import DefaultTracks, { tracks } from './DefaultTracks';
import BiosampleTracks from './BiosampleTracks';
import CytobandView from './Cytobands';

import { Loader } from 'semantic-ui-react';
import { EmptyTrack, GenomeBrowser, PackTranscriptTrack, SquishTranscriptTrack, RulerTrack, UCSCControls } from 'umms-gb';

import TableWithCart from './table_with_cart';
import {getCommonState, orjoin, toParams, isCart } from '../../../common/utility';
import { associateBy } from 'queryz';
import { Menu } from 'semantic-ui-react';

export const CCRE_FIELDS = gql`
fragment CCREFields on CCRE {
    accession
    coordinates {
        chromosome
        start
        end
    }
    rDHS
    group
    dnaseZ: maxZ(assay: "dnase")
    h3k4me3Z: maxZ(assay: "h3k4me3")
    h3k27acZ: maxZ(assay: "h3k27ac")
    ctcfZ: maxZ(assay: "ctcf")
}
`;

export const QUERY = gql`
${CCRE_FIELDS}
query q($chromosome: String, $start: Int, $end: Int, $assembly: String!, $name: [String]) {
  gene(chromosome: $chromosome, start: $start, end: $end, assembly: $assembly) {
    name
    strand
    transcripts {
      name
      strand
      exons {
          coordinates {
              chromosome
              start
              end
          }
      }
      coordinates {
        chromosome
        start
        end
      }
    }
  }
  queriedGene: gene(name: $name, assembly: $assembly) {
    transcripts {
      associated_ccres_pls {
        intersecting_ccres {
          ...CCREFields
        }
      }
    }
  }
  queriedTranscript: transcript(name: $name, assembly: $assembly) {
    associated_ccres_pls {
      intersecting_ccres {
        ...CCREFields
      }
    }
  }
  ccREBiosampleQuery(assembly: $assembly) {
	biosamples {
	  name
	  dnase: experimentAccession(assay: "DNase")
	  h3k4me3: experimentAccession(assay: "H3K4me3")
	  h3k27ac: experimentAccession(assay: "H3K27ac")
	  ctcf: experimentAccession(assay: "CTCF")
	  dnase_signal: fileAccession(assay: "DNase")
	  h3k4me3_signal: fileAccession(assay: "H3K4me3")
	  h3k27ac_signal: fileAccession(assay: "H3K27ac")
	  ctcf_signal: fileAccession(assay: "CTCF")
	}
  }
}
`;

export function expandCoordinates(coordinates, l = 20000) {
    return {
        chromosome: coordinates.chromosome,
        start: coordinates.start - l < 0 ? 0 : coordinates.start - l,
        end: coordinates.end + l
    };
}

export function capRange(range) {
	if (range.end - range.start > 1000000) {
		const m = Math.floor((range.end + range.start) / 2);
		return { start: m - 500000, end: m + 500000 };
	}
	return range;
}

const Browser = props => {
	const [ highlight, setHighlight ] = useState(null);
	// const history = useHistory();
	const expandedCoordinates = useMemo( () => expandCoordinates(props.coordinates), [ props.coordinates ]);
	const [ eCoordinates, setECoordinates ] = useState(expandedCoordinates);
	const client = useMemo( () => new ApolloClient({ uri: "https://ga.staging.wenglab.org/graphql", cache: new InMemoryCache() }), [] );
	const { data, loading } = useQuery(QUERY, { variables: { ...eCoordinates, assembly: props.assembly.toLocaleLowerCase(), name: props.gene || "undefined" }, client });
	const groupedBiosamples = useMemo( () => associateBy(data && data.ccREBiosampleQuery ? data.ccREBiosampleQuery.biosamples : [], x => x.name, x => x), [ data ]);
    const groupedTranscripts = useMemo( () => data && data.gene && data.gene.map(
        x => ({
            ...x,
            transcripts: x.transcripts.map(xx => ({ ...xx, color: (props.resolvedTranscript ? xx : x).name === props.gene ? "#880000" : "#aaaaaa" }))
        })
    ), [ data, props ]);
    const svgRef = useRef(null);
	const l = useCallback(c => (c - eCoordinates.start) * 1400 / (eCoordinates.end - eCoordinates.start), [ eCoordinates ]);
	return loading ? <Loader active>Loading...</Loader> : (
		<ApolloProvider client={client}>
			<CytobandView
				innerWidth={1000}
				height={15}
				chromosome={props.coordinates.chromosome}
				assembly={props.assembly}
				position={props.coordinates}
			/>
			<div style={{ marginTop: "1em", marginBottom: "0.75em", textAlign: "center" }}>
				<UCSCControls
					domain={eCoordinates}
					onDomainChanged={x => setECoordinates({ chromosome: props.coordinates.chromosome, ...capRange(x) })}
				/>
			</div>
			<GenomeBrowser
				key={props.cellType}
				svgRef={svgRef}
				domain={eCoordinates}
				innerWidth={1400}
				width="100%"
				noMargin
				onDomainChanged={x => setECoordinates({ chromosome: props.coordinates.chromosome, ...x })}
			>
				{ highlight && (
					<rect fill="#8ec7d1" fillOpacity={0.5} height={1000} x={l(highlight.start)} width={l(highlight.end) - l(highlight.start)} />
				)}
				<RulerTrack
					domain={eCoordinates}
					width={1400}
					height={30}
				/>
				<EmptyTrack height={30} width={1400} />
				{ eCoordinates.end - eCoordinates.start >= 500000 ? (
					<SquishTranscriptTrack
						rowHeight={20}
						width={1400}
						domain={eCoordinates}
						id="innergencode"
						data={groupedTranscripts}
					/>
				) : (
					<PackTranscriptTrack
						rowHeight={20}
						width={1400}
						domain={eCoordinates}
						id="innergencode"
						data={groupedTranscripts}
					/>
				)}
				{ props.cellType && props.assembly !== "mm10" && (
					<BiosampleTracks
						biosample={groupedBiosamples.get(props.cellType)}
						domain={eCoordinates}
						oncCREClicked={x => props.g.get(x) && props.actions.showReDetail(props.g.get(x))}
						oncCREMousedOver={x => x && setHighlight(x)}
						oncCREMousedOut={() => setHighlight(null)}
						assembly={props.assembly}
					/>
				)}
				<EmptyTrack height={20} width={1400} />
				<DefaultTracks
					tracks={tracks(props.assembly.toLocaleLowerCase(), eCoordinates)}
					domain={eCoordinates}
					cCREHighlight={eCoordinates}
					cCREHighlights={new Set([])} // props.facetState.gene_overlap.modes.find(x => x === "PROMOTER") ? associatedPromoters.map(x => x.accession) : [])}
					svgRef={svgRef}
					assembly={props.assembly.toLocaleLowerCase()}
					oncCREClicked={x => props.g.get(x) && props.actions.showReDetail(props.g.get(x))}
					oncCREMousedOver={x => x && setHighlight(x)}
					oncCREMousedOut={() => setHighlight(null)}
					actions={props.actions}
				/>
			</GenomeBrowser>
		</ApolloProvider>
	);
}

class ResultsTableContainer extends React.Component {
    state = { cres: [], rfacets: [], total: 0, cts: null,
              isFetching: true, isError: false, page: 0,
              jq : null}

    shouldComponentUpdate(nextProps, nextState) {
	return "results" === nextProps.maintabs_active;
    }

    componentDidMount(){
	if(this.props.maintabs_visible){
	    this.loadCREs(this.props);
	}
    }

    UNSAFE_componentWillReceiveProps(nextProps){
        this.loadCREs(nextProps);
    }

    loadCREs(props){
	var p = getCommonState(props);
	if (isCart()) {
	    delete p.coord_chrom;
	    delete p.coord_start;
	    delete p.coord_end;
	}
        var jq = JSON.stringify(p);
	var setrfacets = this.props.actions.setrfacets;
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	ApiClient.getByPost(jq, "/dataws/cre_table",
			    (r) => {
				this.setState({cres: r["cres"],
					       total: r["total"],
					       cts: r["cts"],
				      	       rfacets: r["rfacets"],
					       jq, isFetching: false, isError: false});
				setrfacets(r["rfacets"])},
			    (msg) => {
				console.log("err loading cres for table");
				console.log(msg);
				this.setState({cres: [], total: 0,
					       jq, isFetching: false, isError: true});
			    });

    }

    searchLinks(gene, useTss, tssDist, assembly, geneTitle){
	let dists = [1000, 2000, 5000, 10000, 25000, 50000];
	let distsRefs = orjoin(dists.map((d) => (
		<a href={"/search?promoter&" + toParams({q: gene,
							 tssDist: d,
							 assembly,
							 uuid: this.props.uuid})}
	    key={["dist", d]}>
		{d / 1000}{"kb"}
	    </a>))
	);

	let geneBody = "";
	if(useTss){
	    geneBody = (
		<li key={"geneBody"}>{"overlapping the "}
		    <a href={"/search?" + toParams({q: gene, assembly,
						    uuid: this.props.uuid})}>
			gene body
		    </a>{" of "}{geneTitle}
		</li>);
	}

	let firstLastTss = (
	    <li key={"firstLastTss"}>{"located between the "}
		<a href={"/search?tss&promoter&" + toParams({q: gene,assembly,
							     uuid: this.props.uuid})}>
		    first and last Transcription Start Sites (TSSs)
		</a>{" of "}{geneTitle}
	    </li>);
	if(useTss && !tssDist){
	    firstLastTss = "";
	}

	const tssUpstream = (
	    <li key={"tssUpstream"}>
		{"within "}{distsRefs}{" upstream of the TSSs"}
	    </li>);

	return (
	    <div>
		<ul>
		    {geneBody}
		    {firstLastTss}
		    {tssUpstream}
		</ul>
	    </div>);
    }

    firstLine(useTss, tssDist, geneTitle){
	const click = " Click to see candidate cis-Regulatory Elements:";
	if(useTss){
	    if(tssDist){
		return (
		    <span>
			{"This search is showing candidate cis-Regulatory Elements located between the first and last Transcription Start Sites (TSSs) of "}
			{geneTitle}{" and up to " + tssDist / 1000  + "kb upstream."}{click}
		    </span>);
	    } else {
		return (
		    <span>
			{"This search is showing cCREs with promoter-like signatures located between the first and last Transcription Start Sites (TSSs) of "}
			{geneTitle}{"."}{click}
		    </span>);
	    }
	}
	return (
	    <span>
		{"This search is showing cCREs overlapping the gene body of "}
		{geneTitle}{"."}{click}
	    </span>);
    }

    doInterpGene({gene, useTss, tssDist, assembly}){
        const geneTitle = (<em>{gene}</em>);
	return (
	    <div>
		{this.firstLine(useTss, tssDist, geneTitle)}
		<br />
		{this.searchLinks(gene, useTss, tssDist, assembly, geneTitle)}
	    </div>);
    }

    render() {
	if("results" !== this.props.maintabs_active){
            return false;
        }

	let cresWithChecks = this.state.cres;

	cresWithChecks.forEach( (cre) => {
	    cre["checked"] = false;
	    if(cre.info.accession=== this.props.gb_cres.accession){
		  cre["checked"] = true;
	    }
   	});

	const interp = this.props.interpretation;
	let interpBox = "";
	if(interp){
	    let interpMsb = interp.hasOwnProperty("msg") ? interp.msg : "";
	    let interpGene = interp.hasOwnProperty("gene") ?
			     this.doInterpGene(interp["gene"]) : "";
	    if(interp.hasOwnProperty("msg") || interp.hasOwnProperty("gene")){
		interpBox = (
		    <div className="interpretation panel"
		    style={{backgroundColor: "#ffa588", marginBottom: "0px"}}>
		        {interpMsb}
		        {interpGene}
	            </div>);
	    }
	}

	console.log(this.props, this.state);
	const grouped = associateBy(cresWithChecks, x => x.info.accession, x => ({ ...x, ...x.info }));
	return (
	    <div>
			<Menu secondary pointing style={{ fontSize: "1em", marginTop: "0.5em" }}>
				<Menu.Item active={this.state.page !== 1} onClick={() => this.setState({ page: 0 })}>Genome Browser View</Menu.Item>
				<Menu.Item active={this.state.page === 1} onClick={() => this.setState({ page: 1 })}>Table View</Menu.Item>
			</Menu>
			<div style={{ height: "0.5em" }} />
			{ this.state.page === 0 ? (
				<Browser
					coordinates={{ chromosome: this.props.coord_chrom || this.state.cres[0].coord_chrom, start: this.props.coord_start || this.state.cres[0].coord_start, end: this.props.coord_end || this.state.cres[0].coord_end }}
					cellType={this.props.cellType}
					actions={this.props.actions}
					g={grouped}
					gene={this.props.search && this.props.search.parsedQuery && this.props.search.parsedQuery.genes[0] && this.props.search.parsedQuery.genes[0].approved_symbol}
					assembly={this.props.assembly}
				/>
			) : (
				<React.Fragment>
					{interpBox}
							<TableWithCart
		    uuid={this.props.uuid}
		    assembly={this.props.assembly}
                    actions={this.props.actions}
		    cellType={this.props.cellType}
                    data={cresWithChecks}
                    total={this.state.total}
                    cart_accessions={this.props.cart_accessions}
                    isFetching={this.state.isFetching}
		    jq={this.state.jq}
		    rfacets={this.state.rfacets}
                    cts={this.state.cts}
	            hasct={this.props.cellType}
		    globals={this.props.globals}
	            make_ct_friendly={ct =>
			this.props.globals.byCellType[ct][0]["name"]}
		    gb_cres={this.props.gb_cres}
		    chrom = {this.props.coord_chrom}
		/>
				</React.Fragment>
			)}
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)(ResultsTableContainer);
