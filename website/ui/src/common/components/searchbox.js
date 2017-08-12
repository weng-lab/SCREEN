import React from 'react';

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import AutocompleteTextbox from './autocompletetextbox'

import * as Actions from '../actions/searchbox_actions';

/*global GlobalAssembly */
/*eslint no-undef: "error"*/

class SearchBox extends React.Component {
    constructor(props, key) {
	super(props);
        this.state = { jq: null, searchtext: this.makeVal(this.props) };
	this._search = this._search.bind(this);
    }
    
    _search() {
	console.log("/search/?q=" + this.state.searchtext + "&assembly=" + GlobalAssembly);
	window.location.href = "/search/?q=" + this.state.searchtext + "&assembly=" + GlobalAssembly;
	return false;
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

	return (<span className="navbar-collapse navbar-searchform">
	        <AutocompleteTextbox defaultvalue={this.state.searchtext} id="acnav"
		    name="q" hideerr="true" actions={this.props.actions} size={100}
		    className="searchbox" onChange={(t) => {this.setState({searchtext: t})}}
		    onEnter={this._search} assemblies={[GlobalAssembly]} />&nbsp;

                <a className="btn btn-primary btn-lg searchButton"
                    onClick={this._search} role="button">Search</a>

		</span>);
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
