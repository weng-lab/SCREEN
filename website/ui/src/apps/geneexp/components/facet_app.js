var React = require('react')

import {FacetboxCreator} from './facetbox'

import {facetboxes, facetbox_render_order, es_links} from '../config/facetboxes'

import {invalidate_results} from '../helpers/invalidate_results'
import ParsedQueryMap from '../helpers/parsed_query_map'

class FacetApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var store = this.props.store;
	//console.log("FacetApp", "store", store);
	var fc = FacetboxCreator(store);
	//console.log("FacetApp", "FacetboxCreator", fc);
	var boxes = ParsedQueryMap(this.props.pquery, facetboxes());
	//console.log("FacetApp", "n_facetboxes", n_facetboxes);
	return (<div>
		{facetbox_render_order.map((k) => {
		    var Retval = fc(k, boxes[k]);
		    return <Retval key={k} store={store} />;
		})}
		</div>);
    }

}

export default FacetApp;
