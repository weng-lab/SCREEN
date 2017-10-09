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

const biosamplesBox = ({cellType, actions, globals}) => {
    let box = (
	<LongListFacet
	    title={""}
	    data={globals.cellTypeInfoArr}
	    cols={[
		{ title: "", data: "name",
		  orderable: false,
		  render: () => (<input type='radio' />)},
		{ title: "cell type", data: "name",
		  className: "dt-right"},
		{ title: "tissue", data: "tissue",
		  className: "dt-right" },
		{ title: "", data: "cellTypeName",
		  className: "dt-right dcc",
		  render: Render.assayIcon(globals),
		  orderable: false }
	    ]}
	    order={[]}
	    buttonsOff={true}
	    selection={cellType}
	    friendlySelectionLookup={make_ct_friendly(globals)}
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
		     ? '' : <br />}
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
