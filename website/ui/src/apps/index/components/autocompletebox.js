import React from 'react'
import * as Actions from '../actions'

class AutocompleteBox extends React.Component {
    
    constructor(props) {
	super(props);
	this.userQueries = {}; // cache
	this.state = { userQueryErr : null };
	this.loadSearch = this.loadSearch.bind(this);
	this.searchHg19 = this.searchHg19.bind(this);
	this.searchMm10 = this.searchMm10.bind(this);
	this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    loadSearch(assembly, userQuery, actions) {
	this.setState({userQueryErr : (<i className="fa fa-refresh fa-spin"
				          style={{fontSize : "24px"}}></i>)});
	let jq = JSON.stringify({assembly, userQuery});
	$.ajax({
	    url: "/autows/search",
	    type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType : "application/json",
	    error: function(jqxhr, status, error) {
		this.setState({userQueryErr : "err during load"});
	    }.bind(this),
	    success: (r) => (this.props.searchsuccess(r, assembly, userQuery, actions, this))
	});
    }

    searchHg19() {
	let userQuery = this.refs.searchBox.value;
	this.loadSearch("hg19", userQuery, this.props.actions);
    }

    searchMm10() {
	let userQuery = this.refs.searchBox.value;
	this.loadSearch("mm10", userQuery, this.props.actions);
    }

    handleKeyPress = (event) => {
	if(event.key == 'Enter'){
	    this.searchHg19();
	}
    }

    componentDidMount(){
	const loadAuto = (userQuery, callback_f) => {
	    let qobj = {userQuery};
	    if (this.props.assemblies) qobj.assemblies = this.props.assemblies;
	    let jq = JSON.stringify(qobj);
	    if(jq in this.userQueries){
		callback_f(this.userQueries[jq]);
		return;
	    }
	    $.ajax({
		url: "/autows/suggestions",
		type: "POST",
		data: jq,
		dataType: "json",
		contentType : "application/json",
		error: function(jqxhr, status, error) {
                    console.log("err during load");
		}.bind(this),
		success: function(r){
		    this.userQueries[jq] = r;
		    callback_f(r);
		}.bind(this)
	    });
	}

	let sb = $("#" + this.props.id);
	sb.autocomplete({
	    source: function (userQuery, callback_f) {
                // http://stackoverflow.com/a/15977052
                //let endIdx = sb[0].selectionStart;
		loadAuto(userQuery.term, callback_f)
	    },
	    select: function(event, ui) {
		sb.val(ui.item.value);
		return false;
	    },
	    change: function() {
	    }
	});
    }

    render() {
	let input = <input ref="searchBox" id={this.props.id}
	                type={"text"} defaultValue={this.props.defaultvalue}
	                onKeyPress={this.handleKeyPress} name={this.props.name}
   	                className={this.props.className} size={this.props.size} />;
	if (this.props.hideerr) return input;
	let err = "";
	if (this.state.userQueryErr && !this.props.hideerr) {
	    err = (<span>
		       <span className={"mainPageErr"}>
		           {this.state.userQueryErr}
		       </span>
		       <br />
		   </span>);
	}
	return (<span>
		    {err}
		    {input}
		</span>);
    }
    
}
export default AutocompleteBox;
