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

const cellTypesBox = (cellType, actions) => {
    return (<div className="panel-group facet">
	    <div className="panel panel-primary">
	    <div className="panel-heading">Cell types</div>
	    <div className="panel-body">
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
            />
	    </div>
	    </div>
	    </div>);
}

const chromBox = (coord_chrom, actions) => {
    return (<div className="panel-group facet">
	    <div className="panel panel-primary">
	    <div className="panel-heading">Chromosome</div>
	    <div className="panel-body">
            <MainListFacet visible={true}
            title={""}
            items={GlobalChromCounts}
            selection={coord_chrom}
            onchange={(chrom) => { actions.setChrom(chrom) }}
            />
	    </div>
	    </div>
	    </div>);
}

const startEndBox = (coord_start, coord_end, actions) => {
    return (<div className="panel-group facet">
	    <div className="panel panel-primary">
	    <div className="panel-heading">Coordinates</div>
	    <div className="panel-body">
            <MainRangeFacet visible={true}
            title={""}
	    range={[0, 200000000]}
	    selection_range={[coord_start, coord_end]}
	    h_margin={default_margin}
	    h_interval={200000}
	    h_width={200}
            onchange={null}
            />
	    </div>
	    </div>
	    </div>);
}

const FacetBoxen = ({coord_chrom, coord_start, coord_end,
                     cellType, actions}) => {
    return (<div>
            {cellTypesBox(cellType, actions)}
            {chromBox(coord_chrom, actions)}
            {startEndBox(coord_start, coord_end, actions)}

            {/* TFs */}
	    <div className="panel-group facet">
	    <div className="panel panel-primary">
	    <div className="panel-heading">Intersect TF/histone/DNase peaks</div>
	    <div className="panel-body">
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
            />
	    </div>
	    </div>
	    </div>

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
