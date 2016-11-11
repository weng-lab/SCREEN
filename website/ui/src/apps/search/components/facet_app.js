var React = require('react')

import {FacetboxCreator} from './facetbox'

import es_connect from '../elasticsearch/es_connect'

import {invalidate_results} from '../helpers/invalidate_results'
import ParsedQueryMap from '../helpers/parsed_query_map'

class FacetApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var store = this.props.store;
	var fc = FacetboxCreator(store);
	var n_facetboxes = ParsedQueryMap(this.props.pquery, this.props.facetboxes);
	return (<div>
		{this.props.facetbox_render_order.map((k) => {
		    var Retval = fc(k, n_facetboxes[k], this.props.invalidator);
		    return <Retval key={k} store={store} />;
		})}
		</div>);
    }

    componentDidMount() {

	var es_links = this.props.es_links;
	
	for (var k in es_links) {
	    var connector = es_connect(k);
	    for (var i in es_links[k]) {
		var obj = es_links[k][i];
		this.props.store.dispatch(connector(i, obj.f_query, obj.f_results, obj.field, obj.agg_map, obj.st_map));
	    }
	}
	this.props.store.dispatch(this.props.invalidator(this.props.store.getState()));

    }

}
export default FacetApp;
