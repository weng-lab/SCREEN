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

	this.state = {value: '', suggestions: []}
    }

    onChange(event, { newValue }){
	this.setState({
	    value: newValue
	});
	if(this.props.onChange){
	    this.props.onChange(newValue);
	}
    }

    // Autosuggest will call this function every time you need to clear suggestions.
    onSuggestionsClearRequested(){
	this.setState({
	    suggestions: []
	});
    }

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
		this.props.onEnter();
	    }
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
	    placeholder: this.props.defaultvalue,
	    value,
	    onChange: this.onChange,
	    onKeyPress: this.handleKeyPress
	};

	let loadSugg = this.loadSuggestion;
	if(this.props.loadSugg){
	    loadSugg = this.props.loadSugg;
	}

	return (
	    <div style={this.props.style}>
		<Autosuggest
	    shouldRenderSuggestions={this.props.shouldRenderSuggestions}
		    suggestions={suggestions}
		    onSuggestionsFetchRequested={loadSugg}
		    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
		    getSuggestionValue={this.getSuggestionValue}
		    renderSuggestion={this.renderSuggestion}
		    inputProps={inputProps}
        theme={this.props.theme}
		/>
	    </div>);
    }
}

export default AutocompleteBox;
