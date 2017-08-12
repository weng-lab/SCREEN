import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import RangeFacet from '../../../common/components/range'
import ListFacet from '../../../common/components/list'
import LongListFacet from '../../../common/components/longlist'
import LongChecklistFacet from '../../../common/components/longchecklist'

import {default_margin} from '../config/constants'

import * as Render from '../../../common/zrenders'

import {CHECKLIST_MATCH_ALL} from '../../../common/components/checklist'

import {panelize, isCart} from '../../../common/utility'

/*global Globals */
/*eslint no-undef: "error"*/

const rangeBox = (title, range, start, end, action, _f, _rf, nohistogram) => {
    return (
	<RangeFacet
	    title={title}
	    range={range}
	    selection_range={[start, end]}
	    h_margin={default_margin}
	    h_interval={(end - start) / 500}
	    onchange={(se) => { action(se[0], se[1])}}
	    rendervalue={_f}
	    reversevalue={_rf}
	    nohistogram={nohistogram}
        />);
}

const make_ct_friendly = (ct) => (Globals.byCellType[ct][0]["name"]);

const accessionsBox = ({accessions, actions}) => {
    if(0 === accessions.length){
        return (<div />);
    }
    let box = (
	<LongChecklistFacet
	title={""}
	cols={[{
	    title: "Assay", data: "key",
	    className: "dt-right",
	    render: Render.upperCase
	}]}
	data={accessions.map((d) => {
	    return {key: d, selected: true}})}
	order={[]}
	buttonsOff={true}
	match_mode_enable={true}
	onTdClick={(accs) => { actions.setAccessions(accs) }}
	onModeChange={(accs) => { actions.setAccessions(accs) }}
	mode={CHECKLIST_MATCH_ALL}
	/>);
    return panelize("Accessions", box);
}

const cellTypesBox = ({cellType, actions}) => {
    let box = (
	<LongListFacet
	title={""}
	data={Globals.cellTypeInfoArr}
	cols={[
	    { title: "", data: "name",
	      orderable: false,
	      render: () => ("<input type='radio' />")},
	    { title: "cell type", data: "name",
	      className: "dt-right"},
	    { title: "tissue", data: "tissue",
	      className: "dt-right" },
	    { title: "", data: "cellTypeName",
	      className: "dt-right dcc",
	      render: Render.assayIcon,
	      orderable: false }
	]}
	order={[]}
	buttonsOff={true}
	selection={cellType}
	friendlySelectionLookup={make_ct_friendly}
	onTdClick={(value, td, cellObj) => {
	    if(td){
		if (td.className.indexOf("dcc") === -1) {
		    actions.setCellType(value);
		}
	    } else {
		actions.setCellType(value);
	    }
	}}
        />);
    return panelize("Cell types", box, "CellTypeFacet");
}

const chromBox = ({coord_chrom, actions}) => {
    let box = (
	<ListFacet
	title={""}
	items={Globals.chromCounts}
	selection={coord_chrom}
	onchange={(chrom) => { actions.setChrom(chrom) }}
        />);
    return panelize("Chromosome", box);
}

const startEndBox = ({coord_chrom, coord_start, coord_end, actions}) => {
    if(!coord_chrom){
        return (<div />);
    }
    var chromLen = Globals.chromLens[coord_chrom];
    var histBins = Globals.creHistBins[coord_chrom];
    let title = coord_chrom + ":" + coord_start + "-" + coord_end;
    let box = (
	<RangeFacet
	    title={""}
	    h_data={histBins}
	    range={[0, chromLen]}
	    selection_range={[coord_start, coord_end]}
	    h_margin={default_margin}
	    h_interval={chromLen / histBins.numBins}
	    onchange={(se) => { actions.setCoords(se[0], se[1]) }}
        />);
    return panelize("Coordinates: " + title, box, "CoordinateFacet");
}

/* const tfBox = ({actions}) => {
 *     let box = (
 * 	<LongChecklistFacet
 * 	    title={""}
 * 	    data={Globals.tfs.map((tf) => {return {key: tf,
 * 						   selected: false}})}
 * 	    cols={[{
 * 		    title: "Assay", data: "key",
 * 		    className: "dt-right"
 * 		}]}
 * 	    order={[]}
 * 	    buttonsOff={true}
 * 	    match_mode_enable={true}
 * 	    onTdClick={(tf) => { actions.toggleTf(tf) } }
 * 	    onModeChange={(mode) => { actions.setTfsMode(mode) }}
 * 	    mode={CHECKLIST_MATCH_ALL}
 *         />);
 *     return panelize("Intersect TF/histone/DNase peaks", box);
 * }
 * */

/* const geneDistanceBox = (p) => {
 *     let range = [0, 500000];
 *     let box = (
 * 	<div>
 * 	    {rangeBox("Protein-coding genes", range,
 * 		      p.gene_pc_start, p.gene_pc_end,
 * 		      p.actions.setGenePcDistance)}
 * 	    {rangeBox("All genes", range,
 * 		      p.gene_all_start, p.gene_all_end,
 * 		      p.actions.setGeneAllDistance)}
 * 	</div>);
 *     
 *     return panelize("Distance to Genes", box);
 * }
 * */

const zscore_decimal = (v) => {
    if (isNaN(parseFloat(v)) || !isFinite(v)) return 0.0;
    let r = v / 100.0;
    if (Number.isInteger(r)) return r + ".";
    return r;
}
    
const zrdecimal = (s) => (+s * 100.0);

/* const _rankBox = ({element_type, actions, cellType}) => {
 *     let title = "cRE activity" + (cellType ?
 * 				  " in " + make_ct_friendly(cellType) : "");
 *     let box = (
 * 	<ListFacet
 * 	    title={""}
 * 	    items={[["chromatin-accessible", ""],
 * 		    ["promoter-like", ""],
 * 		    ["enhancer-like", ""],
 * 		    ["insulator-like", ""]]}
 * 	    selection={element_type}
 * 	    onchange={(e) => { actions.setType(e) }}
 *         />);
 *     return panelize(title, box);
 * }
 * */

const makeRankFacet = (rfacets, assay, title, start, end, action) =>
    {
	let range = [-1000, 1000];
        if(!rfacets.includes(assay)){
            return "";
        }
        return rangeBox(title, range, start, end,
		        action, zscore_decimal, zrdecimal, true);
    }

const rankBox = (p) => {
    let title =  (p.cellType ?
		  make_ct_friendly(p.cellType) :
		  "Maximum across cell types");
    
    let promoterTitle = "H3K4me3 Z-score";
    let enhancerTitle = "H3K27ac Z-score";
    let sliders = [makeRankFacet(p.rfacets, "dnase", "DNase Z-score",
                                 p.rank_dnase_start, p.rank_dnase_end,
			         p.actions.setRankDnase),
                   makeRankFacet(p.rfacets, "promoter", promoterTitle,
                                 p.rank_promoter_start, p.rank_promoter_end,
			         p.actions.setRankPromoter),
                   makeRankFacet(p.rfacets, "enhancer", enhancerTitle,
                                 p.rank_enhancer_start, p.rank_enhancer_end,
			         p.actions.setRankEnhancer),
                   makeRankFacet(p.rfacets, "ctcf", "CTCF Z-score",
                                 p.rank_ctcf_start, p.rank_ctcf_end,
			         p.actions.setRankCtcf)];
    sliders = sliders.filter((s) => s > "");
    
    // http://stackoverflow.com/a/34034296
    let box = (
        <div>
            {sliders.map((s,i) => <span>{s}{sliders.length - 1 === i
					  ? '' : <br />}</span>)}
        </div>);
    
    return panelize(title, box, "Z-scoreFacet");
};

class FacetBoxen extends React.Component {
    componentDidMount() {
        if(!this.props.maintabs_visible){
            this.props.actions.showMainTabs(true);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        let np = nextProps;
        let pp  = this.props;
	let unchanged = (pp.accessions === np.accessions) &&
                        (pp.cellType === np.cellType) &&
                        (pp.coord_chrom === np.coord_chrom) &&
                        (pp.coord_start === np.coord_start) &&
                        (pp.coord_end === np.coord_end) &&
                        (pp.rfacets === np.rfacets);
        return !unchanged;
    }

    render() {
	if(isCart()){
	    return <div />;
	}

        return (
	    <div>
		{accessionsBox(this.props)}
		{cellTypesBox(this.props)}
		{chromBox(this.props)}
		{startEndBox(this.props)}
		{rankBox(this.props)}
            </div>);
    }
}

const mapStateToProps = (state) => ({...state});
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)});
export default connect(mapStateToProps, mapDispatchToProps)(FacetBoxen);
