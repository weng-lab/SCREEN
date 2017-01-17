import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import LongListFacet from '../../../common/components/longlist'

import MainRangeFacet from '../components/range'
import MainListFacet from '../components/list'
import MainChecklistFacet from '../components/checklist'
import MainLongListFacet from '../components/longlist'
import MainLongChecklistFacet from '../components/longchecklist'
import MainSliderFacet from '../components/slider'

import {default_margin} from '../config/constants'
import {render_int, render_cell_type} from '../config/results_table'

import {CHECKLIST_MATCH_ALL, CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'

const panelize = (title, facet) => {
    return (<div className="panel-group facet">
	    <div className="panel panel-primary">
	    <div className="panel-heading">{title}</div>
	    <div className="panel-body">
            {facet}
	    </div>
	    </div>
	    </div>);
};

const rangeBox = (title, start, end, action) => {
    return (<MainRangeFacet visible={true}
            title={title}
	    range={[start, end]}
	    selection_range={[start, end]}
	    h_margin={default_margin}
	    h_interval={(end - start) / 500}
            onchange={(se) => { action(se[0], se[1])}}
            />);
}

const accessionsBox = ({accessions, actions}) => {
    if(0 == accessions.length){
        return (<div />);
    }
    return panelize("Accessions",
                    <MainChecklistFacet
                    visible={true}
                    title={""}
                    items={accessions.map((d) => {return {value: d, checked: true}})}
                    match_mode_enabled={false}
                    mode={CHECKLIST_MATCH_ANY}
                    autocomplete_source={[]}
		    onchange={(accs) => { actions.setAccessions(accs) }}
		    onModeChange={null}
		    />);
}

const cellTypesBox = ({cellType, actions}) => {
    return panelize("Cell types",
                    <LongListFacet
                    title={""}
                    data={GlobalCellTypeInfoArr}
                    cols={[
		        {
		            title: "cell type",
		            data: "name",
		            className: "dt-right"
		        },
		        {
		            title: "tissue",
		            data: "tissue",
		            className: "dt-right"
		        }
	            ]}
                    order={[]}
                    selection={cellType}
                    friendlySelectionLookup={(value) => {
                        return GlobalCellTypeInfo[value]["name"] }}
                    onTdClick={(value) => { actions.setCellType(value) }}
                    />);
}

const chromBox = ({coord_chrom, actions}) => {
    return panelize("Chromosome",
	            <MainListFacet visible={true}
                    title={""}
                    items={GlobalChromCounts}
                    selection={coord_chrom}
                    onchange={(chrom) => { actions.setChrom(chrom) }}
                    />);
}

const startEndBox = ({coord_chrom, coord_start, coord_end, actions}) => {
    if(null == coord_chrom){
        return (<div />);
    }
    var chromLen = GlobalChromLens[coord_chrom];
    var histBins = GlobalCreHistBins[coord_chrom];
    return panelize("Coordinates",
                    <MainRangeFacet visible={true}
                    title={""}
                    h_data={histBins}
	            range={[0, chromLen]}
	            selection_range={[coord_start, coord_end]}
	            h_margin={default_margin}
	            h_interval={chromLen / histBins.numBins}
                    onchange={(se) => { actions.setCoords(se[0], se[1]) }}
                    />);
}

const tfBox = ({actions}) => {
    return panelize("Intersect TF/histone/DNase peaks",
                    <MainLongChecklistFacet visible={true}
                    title={""}
                    data={GlobalTfs.map((tf) => {return {key: tf,
                                                         selected: false}})}
                    cols={[{
		        title: "Assay",
		        data: "key",
		        className: "dt-right"
	            }]}
                    order={[]}
                    match_mode_enable={true}
                    onTdClick={(tf) => { actions.toggleTf(tf) } }
                    onModeChange={(mode) => { actions.setTfsMode(mode) }}
                    mode={CHECKLIST_MATCH_ALL}
                    />);
}

const geneDistanceBox = ({gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
                          actions}) => {
    return panelize("Distance to Genes",
                    (<div>
                     {rangeBox("Protein-coding genes", gene_pc_start, gene_pc_end,
                               actions.setGenePcDistance)}
                     {rangeBox("All genes", gene_all_start, gene_all_end,
                               actions.setGeneAllDistance)}
                     </div>))
}

const rankBox = ({rank_dnase_start, rank_dnase_end,
                  rank_promoter_start, rank_promoter_end,
                  rank_enhancer_start, rank_enhancer_end,
                  rank_ctcf_start, rank_ctcf_end,
                  cellType, actions}) => {
    if(null == cellType){
        return (<div />);
    }
    return panelize("Ranks",
                    (<div>
                     {rangeBox("DNase", rank_dnase_start, rank_dnase_end,
                               actions.setRankDnase)}
                     {rangeBox("promoter", rank_promoter_start, rank_promoter_end,
                               actions.setRankPromoter)}
                     {rangeBox("enhancer", rank_enhancer_start, rank_enhancer_end,
                               actions.setRankEnhancer)}
                     {rangeBox("CTCF", rank_ctcf_start, rank_ctcf_end,
                               actions.setRankCtcf)}
                     </div>));
};

class FacetBoxen extends React.Component {
    componentDidMount() {
        if(!this.props.maintabs_visible){
            this.props.actions.showMainTabs(true);
        }
    }

    doRender(p){
        return (<div>
                {accessionsBox(p)}
                {cellTypesBox(p)}
                {chromBox(p)}
                {startEndBox(p)}
                {tfBox(p)}
                {geneDistanceBox(p)}
                {rankBox(p)}
                </div>);
    }

    render() {
        return this.doRender(this.props)
    }
}

const mapStateToProps = (state) => ({
        ...state
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FacetBoxen);
