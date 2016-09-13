var React = require('react')

import {RANGE_FACET, CHECKLIST_FACET, LIST_FACET} from '../helpers/create_facet'
import {FacetboxCreator} from './facetbox'

const facetboxes = [
    {
	title: "Assembly",
	visible: true,
	facets: {
	    "assembly": {
		type: LIST_FACET,
		visible: true,
		title: "",
		items: [{
		    value: "hg19",
		    n: 1000000
		}],
		selection: 0
	    }
	}
    },
    {
	title: "Chromosome",
	visible: true,
	facets: {
	    "chromosome": {
		type: LIST_FACET,
		visible: true,
		title: "",
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
    },
    {
	title: "TF intersection",
	visible: true,
	facets: {
	    "TF": {
		type: CHECKLIST_FACET,
		visible: true,
		title: "",
		items: []
	    }
	}
    },
    {
	title: "Distance to Genes",
	visible: true,
	facets: {
	    "gene-distance.pc": {
		type: RANGE_FACET,
		visible: true,
		title: "Protein coding",
		range: [0, 20000],
		selection_range: [0, 20000],
		h_margin: {top: 1, bottom: 1, left: 1, right: 1},
		h_interval: 10
	    },
	    "gene-distance.all": {
		type: RANGE_FACET,
		visible: true,
		title: "All",
		range: [0, 20000],
		selection_range: [0, 20000],
		h_margin: {top: 1, bottom: 1, left: 1, right: 1},
		h_interval: 10
	    },
	}
    }
];

const FacetApp = (store) => {
    console.log("creating app");
    var CreateFacetbox = FacetboxCreator(store);
    return (<div>
	    {facetboxes.map(function (v, k) {
		console.log(v);
		var Retval = CreateFacetbox(k, v);
		return <Retval key={k} store={store} />;
	    })}
	    </div>);
};
export default FacetApp;
