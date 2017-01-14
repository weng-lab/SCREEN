var React = require('react')

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {invalidate_results} from '../helpers/invalidate_results'
import ParsedQueryMap from '../helpers/parsed_query_map'

import MainRangeFacet from '../components/range'
import MainListFacet from '../components/list'
import MainChecklistFacet from '../components/checklist'
import MainLongListFacet from '../components/longlist'
import MainLongChecklistFacet from '../components/longchecklist'
import MainSliderFacet from '../components/slider'

import {default_margin} from '../config/constants'
import {render_int, render_cell_type} from '../config/results_table'

import {CHECKLIST_MATCH_ALL, CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'

export const render_histone_tf = (s) => (s.toUpperCase().replace(/9AC/g, "9ac").replace(/27AC/g, "27ac").replace(/ME1/g, "me1").replace(/ME2/g, "me2").replace(/ME3/g, "me3"));

import * as Actions from '../actions';

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

const accessionsBox = (accessions, actions) => {
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

const cellTypesBox = (cellType, actions) => {
    return panelize("Cell types",
                    <MainLongListFacet visible={true}
                    title={""}
                    data={GlobalCellTypes}
                    cols={[
		        {
		            title: "cell type",
		            data: "value",
		            className: "dt-right",
		            render: render_cell_type
		        },
		        {
		            title: "tissue",
		            data: "tissue",
		            className: "dt-right"
		        }
	            ]}
                    order={[]}
                    selection={cellType}
                    onTdClick={(ct) => { actions.setCellType(ct) }}
                    />);
}

const chromBox = (coord_chrom, actions) => {
    return panelize("Chromosome",
	            <MainListFacet visible={true}
                    title={""}
                    items={GlobalChromCounts}
                    selection={coord_chrom}
                    onchange={(chrom) => { actions.setChrom(chrom) }}
                    />);
}

const startEndBox = (coord_chrom, coord_start, coord_end, actions) => {
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

const tfBox = (actions) => {
    return panelize("Intersect TF/histone/DNase peaks",
                    <MainLongChecklistFacet visible={true}
                    title={""}
                    data={GlobalTfs.map((tf) => {return {key: tf, selected: false}})}
                    cols={[{
		        title: "Assay",
		        data: "key",
		        className: "dt-right",
		        render: render_histone_tf
	            }]}
                    order={[]}
                    match_mode_enable={true}
                    onTdClick={null}
                    onModeChange={null}
                    mode={CHECKLIST_MATCH_ALL}
                    />);
}

const geneDistanceBox = (gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
                         actions) => {
    return panelize("Distance to Genes",
                    (<div>
                     <MainRangeFacet visible={true}
                     title={"Protein-coding genes"}
		     range={[gene_pc_start, gene_pc_end]}
		     selection_range={[gene_pc_start, gene_pc_end]}
		     h_margin={default_margin}
		     h_interval={(gene_pc_end - gene_pc_start) / 500}
                     onchange={(se) => { actions.setGenePcDistance(se[0], se[1])}}
                     />
                     <MainRangeFacet visible={true}
                     title={"All genes"}
		     range={[gene_all_start, gene_all_end]}
		     selection_range={[gene_all_start, gene_all_end]}
		     h_margin={default_margin}
		     h_interval={(gene_all_end - gene_all_start) / 500}
                     onchange={(se) => { actions.setGeneAllDistance(se[0], se[1])}}
                     />
                    </div>))
}

const rankBox = (rank_dnase_start, rank_dnase_end,
                 rank_promoter_start, rank_promoter_end,
                 rank_enhancer_start, rank_enhancer_end,
                 rank_ctcf_start, rank_ctcf_end,
                 cellType, actions) => {
    if(null == cellType){
        return (<div />);
    }
    return panelize("Ranks",
                    (<div>
                     <MainRangeFacet visible={true}
                     title={"DNase"}
		     range={[rank_dnase_start, rank_dnase_end]}
		     selection_range={[rank_dnase_start, rank_dnase_end]}
		     h_margin={default_margin}
		     h_interval={(rank_dnase_end - rank_dnase_start) / 500}
                     onchange={(se) => { actions.setRankDnase(se[0], se[1])}}
                     />
                     <MainRangeFacet visible={true}
                     title={"promoter"}
		     range={[rank_promoter_start, rank_promoter_end]}
		     selection_range={[rank_promoter_start, rank_promoter_end]}
		     h_margin={default_margin}
		     h_interval={(rank_promoter_end - rank_promoter_start) / 500}
                     onchange={(se) => { actions.setRankPromoter(se[0], se[1])}}
                     />
                     <MainRangeFacet visible={true}
                     title={"enhancer"}
		     range={[rank_enhancer_start, rank_enhancer_end]}
		     selection_range={[rank_enhancer_start, rank_enhancer_end]}
		     h_margin={default_margin}
		     h_interval={(rank_enhancer_end - rank_enhancer_start) / 500}
                     onchange={(se) => { actions.setRankEnhancer(se[0], se[1])}}
                     />
                     <MainRangeFacet visible={true}
                     title={"CTCF"}
		     range={[rank_ctcf_start, rank_ctcf_end]}
		     selection_range={[rank_ctcf_start, rank_ctcf_end]}
		     h_margin={default_margin}
		     h_interval={(rank_ctcf_end - rank_ctcf_start) / 500}
                     onchange={(se) => { actions.setRankCtcf(se[0], se[1])}}
                     />
                     </div>));
};

const FacetBoxen = ({accessions, coord_chrom, coord_start, coord_end,
                     gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
                     rank_dnase_start, rank_dnase_end,
                     rank_promoter_start, rank_promoter_end,
                     rank_enhancer_start, rank_enhancer_end,
                     rank_ctcf_start, rank_ctcf_end,
                     cellType, actions}) => {
    return (<div>
            {accessionsBox(accessions, actions)}
            {cellTypesBox(cellType, actions)}
            {chromBox(coord_chrom, actions)}
            {startEndBox(coord_chrom, coord_start, coord_end, actions)}
            {tfBox(actions)}
            {geneDistanceBox(gene_all_start, gene_all_end, gene_pc_start, gene_pc_end, actions)}
            {rankBox(rank_dnase_start, rank_dnase_end,
                     rank_promoter_start, rank_promoter_end,
                     rank_enhancer_start, rank_enhancer_end,
                     rank_ctcf_start, rank_ctcf_end,
                     cellType, actions)}
            </div>);
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
