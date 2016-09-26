import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import ReactDOM from 'react-dom'

import {FacetCreator} from '../helpers/create_facet'
import {ADD_FACETBOX} from '../reducers/root_reducer'

class FacetBox extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var display = (this.props.visible ? "block" : "none");
	return (<div className="panel-group facet" style={{display: display}}>
	            <div className="panel panel-primary">
	                <div className="panel-heading">{this.props.title}</div>
	                <div className="panel-body" ref="facet_container">
	                </div>
	            </div>
	        </div>);
    }

    componentDidMount() {
	var facets = this.props.facets;
	var store = this.props.store;
	var create_facet = this.props.create_facet;
	ReactDOM.render((
	    <div>
		{Object.keys(facets).map((key) => {
		    var Retval = create_facet(key, facets[key]);
		    return <Retval key={key} store={store} />
		})}
	    </div>
	), this.refs.facet_container);
    }
    
};
export default FacetBox;

const add_facetbox = (key, {visible, title, facets, display_map}) => {
    return {
	type: ADD_FACETBOX,
	key, visible, title, facets, display_map
    };
};

const state_props_map = (store, key) => (state) => {
    return {
	visible: state.facet_boxes[key].visible,
	title: state.facet_boxes[key].title,
	facets: state.facet_boxes[key].facets,
	store,
	create_facet: FacetCreator(store, key)
    };
}

export const FacetboxCreator = (store) => (key, props) => {
    store.dispatch(add_facetbox(key, props));
    return connect(state_props_map(store, key))(FacetBox);
}
