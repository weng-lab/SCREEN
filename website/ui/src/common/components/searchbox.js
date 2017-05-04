var React = require('react');

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import AutocompleteBox from '../../apps/index/components/autocompletebox'

import * as Actions from '../actions/searchbox_actions';

class SearchBox extends React.Component {
    constructor(props, key) {
	super(props);
        this.state = { jq: null };
    }

    _autocomplete_success(r, assembly, userQuery, actions, _autocomplete) {
	let params = jQuery.param({q: userQuery, assembly});
	let url = "/search/?" + params;
	window.location.href = url;
    }
    
    makeVal(p) {
        let r = "";
        if(p.coord_chrom && p.coord_start && p.coord_end){
            r += p.coord_chrom + ":" + p.coord_start + "-" + p.coord_end + " ";
        } else if(p.coord_start && p.coord_end){
            r += p.coord_start + "-" + p.coord_end + " ";
        }

        if(p.cellType){
            r += p.cellType;
        }

        return r;
    }

    componentWillReceiveProps(nextProps){
	var val = this.makeVal(nextProps);
	var jq = JSON.stringify(val);
	if(this.state.jq != jq){
	    //this.refs.input.value = val;
	    this.setState({jq});
	}
    }

    render() {
        const doSubmit = (e) => {
            e.preventDefault();
            // this.props.actions.makeSearchQuery(this.refs.input.value);
        }

	return (<form action="search" method="get" onSubmit={doSubmit}
                className="navbar-collapse navbar-searchform">

	        <AutocompleteBox defaultvalue={this.makeVal(this.props)} id="acnav"
		    name="q" hideerr="true" actions={this.props.actions} size={100}
		    className="searchbox" searchsuccess={this._autocomplete_success}
		    assemblies={[GlobalAssembly]} />&nbsp;

                <a className="btn btn-primary btn-lg searchButton"
                onClick={doSubmit} role="button">Search</a>

		</form>);
    }
}
/*
<input className="searchbox" type="text" size="100" name="q"
                ref="input" defaultValue={this.makeVal(this.props)}/>
*/

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
