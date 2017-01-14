var React = require('react');
var ReactDOM = require('react-dom');

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {SET_VALUE} from '../reducers/searchbox'

import * as Actions from '../actions/searchbox_actions';

class SearchBox extends React.Component {

    render() {
        const doSubmit = (e) => {
            e.preventDefault();
            this.props.actions.makeSearchQuery(this.refs.input.value);
        }

	return (<form action="search" method="get" onSubmit={doSubmit}
                className="navbar-collapse navbar-searchform">

	        <input className="searchbox" type="text" size="100" name="q"
                ref="input" value={this.props.value}/>&nbsp;

                <a className="btn btn-primary btn-lg searchButton" onClick={doSubmit} role="button">Search</a>

		</form>);
    }

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
)(SearchBox);
