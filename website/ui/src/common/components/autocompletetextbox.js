import React from 'react';
import Autosuggest from 'react-autosuggest';

import * as ApiClient from '../api_client';

class AutocompleteBox extends React.Component {
    
    constructor(props) {
	super(props);
	this.onChange = this.onChange.bind(this);
	this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
	this.getSuggestionValue = this.getSuggestionValue.bind(this);
	this.renderSuggestion = this.renderSuggestion.bind(this);
	this.loadSuggestion = this.loadSuggestion.bind(this);
	
	this.userQueries = {}; // cache
	this.handleKeyPress = this.handleKeyPress.bind(this);
	this._onchange = this._onchange.bind(this);

	this.state = {value: '', suggestions: []}
    }

    onSuggestionsClearRequested(){
    }
    
    onChange = (event, { newValue }) => {
	this.setState({
	    value: newValue
	});
    };

    // Autosuggest will call this function every time you need to clear suggestions.
    onSuggestionsClearRequested = () => {
	this.setState({
	    suggestions: []
	});
    };

    // When suggestion is clicked, Autosuggest needs to populate the input
    // based on the clicked suggestion. Teach Autosuggest how to calculate the
    // input value for every given suggestion.
    getSuggestionValue(suggestion){
	return suggestion;
    }

    // Use your imagination to render suggestions.
    renderSuggestion(suggestion){
	return (
	    <div>
		{suggestion}
	    </div>);
    }


    handleKeyPress = (event) => {
	if('Enter' === event.key){
	    if (this.props.onEnter){
		this.props.onEnter(this.refs.searchBox.value);
	    }
	}
    }

    _onchange() {
	if (this.props.onChange) {
	    this.props.onChange(this.refs.searchBox.value);
	}
    }
    
    loadSuggestion({ value }){
	let q = {userQuery: value};
	if (this.props.assemblies) {
	    q.assemblies = this.props.assemblies;
	}
	const jq = JSON.stringify(q);
	ApiClient.autocompleteBoxSuggestions(jq,
					     (r) => {
						 this.setState({
						     suggestions: r
						 })
					     },
					     (msg) => {
						 console.log("err during load");
					     });
    }

    render() {
	const { value, suggestions } = this.state;

	// Autosuggest will pass through all these props to the input.
	const inputProps = {
	    placeholder: 'Type a programming language',
	    value,
	    onChange: this.onChange
	};
	
	return <Autosuggest
		   suggestions={suggestions}
		   onSuggestionsFetchRequested={this.loadSuggestion}
		   onSuggestionsClearRequested={this.onSuggestionsClearRequested}
		   getSuggestionValue={this.getSuggestionValue}
		   renderSuggestion={this.renderSuggestion}
		   inputProps={inputProps}
	       />;
    }
    
}

export default AutocompleteBox;
