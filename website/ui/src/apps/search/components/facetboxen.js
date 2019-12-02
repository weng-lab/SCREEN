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

const rangeBox = (title, range, start, end, action, nohistogram) => {
    return (
	<RangeFacet
	    title={title}
	    range={range}
	    lvalue={start}
	    rvalue={end}
	    h_margin={default_margin}
	    h_interval={(end - start) / 500}
	    numDecimals={2}
	    onChange={(lvalue, rvalue) => { action(lvalue, rvalue)} }
	    nohistogram={nohistogram}
        />);
}

const make_ct_friendly = (globals) => (ct) => (globals.byCellType[ct][0]["name"]);

const accessionsBox = ({accessions, actions}) => {
    if(0 === accessions.length){
        return (<div />);
    }
    let box = (
	<LongChecklistFacet
	title={""}
	    cols={[{
		    title: "Assay", data: "key",
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

const getTissue = biosample => {
    if (!biosample || !biosample.includes) return "";
    if (biosample.includes("fibroblast") || biosample.includes("Fibroblast")) return "fibroblast";
    if (biosample.includes("22Rv1") || biosample === "C4-2B" || biosample === "VCaP") return "prostate";
    if (biosample === "ACHN") return "kidney";
    if (biosample.includes("adipose")) return "adipose";
    if (biosample === "AG10803") return "fibroblast";
    if (biosample.includes("arm bone")) return "limb";
    if (biosample.includes("aorta") || biosample.includes("artery")) return "blood vessel";
    if (biosample.includes("astrocyte")) return "brain";
    if (biosample.includes("CD4") || biosample === "SU-DHL-6") return "blood";
    if (biosample.includes("chorion")) return "chorion";
    if (biosample.includes("colon")) return "colon";
    if (biosample.includes("femur")) return "limb";
    if (biosample === "EL") return "spleen";
    if (biosample === "GM08714") return "blood";
    if (biosample === "HK-2") return "kidney";
    if (biosample.includes("islet")) return "pancreas";
    if (biosample.includes("kidney") || biosample.includes("renal")) return "kidney";
    if (biosample.includes("cardiac")) return "heart";
    if (biosample.includes("iris")) return "eye";
    if (biosample.includes("leg bone")) return "limb";
    if (biosample.includes("lung")) return "lung";
    if (biosample.includes("LNCAP") || biosample.includes("RWPE")) return "prostate";
    if (biosample.includes("MCF")) return "breast";
    if (biosample === "medulloblastoma") return "brain";
    if (biosample.includes("parathyroid") || biosample.includes("Parathyroid")) return "parathyroid";
    if (biosample.includes("putamen")) return "brain";
    if (biosample.includes("placenta")) return "placenta";
    if (biosample.includes("T helper") || biosample.includes("T-helper") || biosample.includes("T cell")) return "blood";
    if (biosample.includes("trophoblast")) return "trophoblast";
};

const biosamplesBox = ({cellType, actions, globals}) => {
    let box = (
	<LongListFacet
	    title={""}
	    data={globals.cellTypeInfoArr.map( x => ({ ...x, tissue: x.tissue || getTissue(x.name) }) )}
	    cols={[
		{ title: "", data: "name",
		  orderable: false,
		  render: () => (<input type='radio' />)},
		{ title: "cell type", data: "name"},
		{ title: "tissue", data: "tissue"},
		{ title: "", data: "cellTypeName",
		  className: "dcc",
		  render: Render.assayIcon(globals),
		  orderable: false },
		{ title: "synonyms", data: "synonyms", visible: false }
	    ]}
	    order={[]}
	    buttonsOff={true}
	    selection={cellType}
	    friendlySelectionLookup={make_ct_friendly(globals)}
	    onTdClick={(value, td, cellObj) => {
		    if(td){
			if (td.indexOf("dcc") === -1) {
			    actions.setCellType(value);
			}
		    } else {
			actions.setCellType(value);
		    }
		}}
        />);
    return panelize("Biosamples", box, "CellTypeFacet", globals);
}

const chromBox = ({coord_chrom, actions, globals}) => {
    let box = (
	<ListFacet
	    title={""}
	    items={globals.chromCounts}
	    selection={coord_chrom}
	    onchange={(chrom) => { actions.setChrom(chrom) }}
        />);
    return panelize("Chromosome", box);
}

const startEndBox = ({coord_chrom, coord_start, coord_end, actions, globals}) => {
    if(!coord_chrom){
        return (<div />);
    }
    var chromLen = globals.chromLens[coord_chrom];
    var histBins = globals.creHistBins[coord_chrom];
    if (coord_end > chromLen) {
	coord_end = chromLen;
	if (coord_start > coord_end) { coord_start = coord_end - 1; }
    }
    let title = coord_chrom + ":" + coord_start + "-" + coord_end;
    let box = (
	<RangeFacet
	    title={""}
	    h_data={histBins}
	    range={[0, chromLen]}
	    lvalue={coord_start}
	    rvalue={coord_end}
	    h_margin={default_margin}
	    h_interval={chromLen / histBins.numBins}
	    numDecimals={0}
	    onChange={(lvalue, rvalue) => { actions.setCoords(lvalue, rvalue); }}
        />);
    return panelize("Coordinates: " + title, box, "CoordinateFacet", globals);
}

const makeRankFacet = (rfacets, assay, title, start, end, action) => {
    const range = [-10, 10];
    if(!rfacets.includes(assay)){
        return "";
    }
    return rangeBox(title, range, start, end, action, true);
}

const zscoreBox = (p) => {
    const title =  (p.cellType ?
		  make_ct_friendly(p.globals)(p.cellType) :
		  "Maximum across cell types");
    
    const promoterTitle = "H3K4me3 Z-score";
    const enhancerTitle = "H3K27ac Z-score";
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
    const box = (
        <div>
            {sliders.map((s,i) =>
		<span key={i}>
		    {s}
		    {sliders.length - 1 === i
		     ? '' : <div style={{padding: "5px"}} />}
		</span>)}
        </div>);
    
    return panelize(title, box, "Z-scoreFacet", p.globals);
};

class FacetBoxen extends React.Component {
    componentDidMount() {
        if(!this.props.maintabs_visible){
            this.props.actions.showMainTabs(true);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const np = nextProps;
        const pp  = this.props;
	const unchanged = (pp.accessions === np.accessions) &&
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
		{biosamplesBox(this.props)}
		{chromBox(this.props)}
		{startEndBox(this.props)}
		{zscoreBox(this.props)}
            </div>);
    }
}

const mapStateToProps = (state) => ({...state});
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)});
export default connect(mapStateToProps, mapDispatchToProps)(FacetBoxen);
