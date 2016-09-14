var React = require('react')

import {RANGE_FACET, CHECKLIST_FACET, LIST_FACET} from '../helpers/create_facet'
import {FacetboxCreator} from './facetbox'

import es_connect, {RangeQueryMap, RangeAggMap} from '../helpers/es_connect'

const facetboxes = {
    "assembly": {
	title: "Assembly",
	visible: true,
	facets: {
	    "assembly": {
		type: LIST_FACET,
		visible: true,
		title: "",
		state: {
		    items: [{
			value: "hg19",
			n: 1000000
		    }],
		    selection: 0
		}
	    }
	}
    },
    "chromosome": {
	title: "Chromosome",
	visible: true,
	facets: {
	    "chromosome": {
		type: LIST_FACET,
		visible: true,
		title: "",
		state: {
		    items: [
			{value: "chr1", n: 10000},
			{value: "chr2", n: 10000},
			{value: "chr3", n: 10000},
			{value: "chrX", n: 10000},
			{value: "chrY", n: 10000}
		    ],
		    selection: null
		}
	    }
	}
    },
    "TFs": {
	title: "TF intersection",
	visible: true,
	facets: {
	    "TF": {
		type: CHECKLIST_FACET,
		visible: true,
		title: "",
		state: {
		    items: []
		}
	    }
	}
    },
    "gene_distance": {
	title: "Distance to Genes",
	visible: true,
	facets: {
	    "gene-distance.pc": {
		type: RANGE_FACET,
		visible: true,
		title: "Protein coding",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: {top: 1, bottom: 1, left: 1, right: 1},
		    h_interval: 10
		}
	    },
	    "gene-distance.all": {
		type: RANGE_FACET,
		visible: true,
		title: "All",
		state: {
		    range: [0, 20000],
		    selection_range: [0, 20000],
		    h_margin: {top: 1, bottom: 1, left: 1, right: 1},
		    h_interval: 10
		}
	    },
	}
    }
};

const render_order = [
    "assembly",
    "chromosome",
    "TFs",
    "gene_distance"
];

class FacetApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var store = this.props.store;
	var CreateFacetbox = FacetboxCreator(store);
	return (<div>
		{render_order.map((k) => {
		    var Retval = CreateFacetbox(k, facetboxes[k]);
		    return <Retval key={k} store={store} />;
		})}
		</div>);
    }

    componentDidMount() {
	var dispatch = this.props.store.dispatch;
	var es_gd_connect = es_connect("gene_distance");
	dispatch(es_gd_connect("gene-distance.pc", [RangeQueryMap, RangeAggMap], "gene-distance.pc"));
	dispatch(es_gd_connect("gene-distance.all", [RangeQueryMap, RangeAggMap], "gene-distance.all"));
    }
    
}
export default FacetApp;
