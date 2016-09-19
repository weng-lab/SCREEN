var React = require('react')

import {FacetboxCreator} from './facetbox'

import es_connect from '../elasticsearch/es_connect'
import {facetboxes, facetbox_render_order, es_links} from '../config/facetboxes'

class FacetApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var store = this.props.store;
	var CreateFacetbox = FacetboxCreator(store);
	return (<div>
		{facetbox_render_order.map((k) => {
		    var Retval = CreateFacetbox(k, facetboxes[k]);
		    return <Retval key={k} store={store} />;
		})}
		</div>);
    }

    componentDidMount() {

	for (var k in es_links) {
	    var connector = es_connect(k);
	    for (var i in es_links[k]) {
		var obj = es_links[k][i];
		this.props.store.dispatch(connector(i, obj.f, obj.field));
	    }
	}

    }

}
export default FacetApp;
