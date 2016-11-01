var React = require('react');
var ReactDOM = require('react-dom');

import {connect} from 'react-redux'
import {SET_VALUE} from '../reducers/searchbox'

class SearchBox extends React.Component {

    constructor(props) {
	super(props);
	this.onchange = this.onchange.bind(this);
	this.submit = this.submit.bind(this);
    }

    onchange() {
	if (this.props.onChange) this.props.onChange(this.refs.input.value);
    }

    submit() {
	this.refs.form.submit();
    }

    render() {
	return (<form action="search" method="get" ref="form" className="navbar-collapse">
	           <input className="searchbox" type="text" size="100" name="q" ref="input" value={this.props.value} onChange={this.onchange} />
	           <a className="btn btn-primary btn-lg searchButton" href={this.submit} role="button">Search</a>
		</form>);
    }
    
}
export default SearchBox;

export const props_map = (f) => (_state) => {
    var state = f(_state);
    return {
	value: state.value
    }
};

export const dispatch_map = (f) => (_dispatch) => {
    var dispatch = f(_dispatch);
    return {
	onChange: (value) => {
	    dispatch({
		type: SET_VALUE,
		value
	    });
	}
    };
};

export const MainSearchBoxConnector = (pf, df) => connect(props_map(pf), dispatch_map(df));
