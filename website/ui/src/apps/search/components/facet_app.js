var React = require('react')

import {FacetboxCreator} from './facetbox'

import es_connect from '../elasticsearch/es_connect'
import {facetboxes, facetbox_render_order, es_links} from '../config/facetboxes'

import {invalidate_results} from '../helpers/invalidate_results'
import ParsedQueryMap from '../helpers/parsed_query_map'

class FacetApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var store = this.props.store;
	var CreateFacetbox = FacetboxCreator(store);
	var n_facetboxes = ParsedQueryMap(this.props.pquery, facetboxes);
	return (<div>
		{facetbox_render_order.map((k) => {
		    var Retval = CreateFacetbox(k, n_facetboxes[k]);
		    return <Retval key={k} store={store} />;
		})}
		</div>);
    }

    componentDidMount() {

	for (var k in es_links) {
	    var connector = es_connect(k);
	    for (var i in es_links[k]) {
		var obj = es_links[k][i];
		this.props.store.dispatch(connector(i, obj.f_query, obj.f_results, obj.field, null, obj.st_map));
	    }
	}
	this.props.store.dispatch(invalidate_results(this.props.store.getState()));

    }

}
export default FacetApp;
