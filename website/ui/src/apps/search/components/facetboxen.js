var React = require('react')

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

class FacetBoxen extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div>
                {/* cell types */}
	        <div className="panel-group facet">
	            <div className="panel panel-primary">
	                <div className="panel-heading">Cell types</div>
	                <div className="panel-body" ref="facet_container">
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
                order={[]} selection={null} onTdClick={null} />
	        </div>
	        </div>
	        </div>

                {/* chroms */}
	        <div className="panel-group facet">
	            <div className="panel panel-primary">
	                <div className="panel-heading">Chromosome</div>
	                <div className="panel-body" ref="facet_container">
                <MainListFacet visible={true}
                title={""}
                items={{"chr1": 10000}}
                selection={"chr1"} onchange={null} />
	        </div>
	        </div>
	        </div>

                {/* coords */}
	        <div className="panel-group facet">
	            <div className="panel panel-primary">
	                <div className="panel-heading">Coordinates</div>
	                <div className="panel-body" ref="facet_container">
                <MainRangeFacet visible={true}
                title={""}
		range={[0, 200000000]}
		selection_range={[this.props.pquery.coord.start,
                                  this.props.pquery.coord.end]}
		h_margin={default_margin}
		h_interval={200000}
		h_width={200}
                onchange={null}
/>
	        </div>
	        </div>
	        </div>

                {/* TFs */}
	        <div className="panel-group facet">
	            <div className="panel panel-primary">
	                <div className="panel-heading">Intersect TF/histone/DNase peaks</div>
	                <div className="panel-body" ref="facet_container">
                <MainLongChecklistFacet visible={true}
                title={""}
                data={GlobalTfs.map ? GlobalTfs.map((tf) => {return {key: tf, selected: false}}) : []}
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

                {/*  */}
	        <div className="panel-group facet">
	            <div className="panel panel-primary">
	                <div className="panel-heading">Chromosome</div>
	                <div className="panel-body" ref="facet_container">
                <MainListFacet visible={true}
                title={""}
                items={{"chr1": 10000}}
                selection={null} onchange={null} />
	        </div>
	        </div>
	        </div>

                </div>);
    }
}

export default FacetBoxen;
