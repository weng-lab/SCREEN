import React from 'react';

import * as ApiClient from './api_client';

class AppPageBase extends React.Component {
    constructor(props, url, innerClass, extraProps = {}) {
	super(props);
	this.url = url;
	this.innerClass = innerClass;
	this.extraProps = extraProps;
	this.state = { isFetching: false, isFetchingGlobals: false, isError: false };
    }

    componentDidMount(){
	this.search(this.props);
	this.globals(this.props);
    }

    componentWillReceiveProps(nextProps){
	this.search(nextProps);
	this.globals(nextProps);
    }
    
    search(nextProps){
	if("search" in this.state){
	    return;
	}
	if(this.state.isFetching){
	    return;
	}
	this.setState({isFetching: true});
	const jq = JSON.stringify({...nextProps.location.query,
				   ...this.extraProps});
	ApiClient.appPageBaseInit(jq, this.url,
				  (r) => {
				      this.setState({search: r, isFetching: false, isError: false});
				  },
				  (err) => {
				      console.log("err searching ");
				      console.log(nextProps.location.query);
				      console.log(err);
				      this.setState({isFetching: false, isError: true});
				  });
    }
    
    globals(nextProps){
	if("globals" in this.state){
	    return;
	}
	if(this.state.isFetchingGlobals){
	    return;
	}
	this.setState({isFetchingGlobals: true});
	ApiClient.globals(nextProps.location.query.assembly,
			  (r) => {
			      this.setState({globals: r, isFetchingGlobals: false, isError: false});
			  },
			  (err) => {
			      console.log("err searching ");
			      console.log(nextProps.location.query);
			      console.log(err);
			      this.setState({isFetchingGlobals: false, isError: true});
			  });
    }
    
    render() {
	if("search" in this.state && "globals" in this.state){
	    return (
		<div>
		    {React.createElement(this.innerClass, {uuid: this.props.uuid,
							   search: this.state.search,
							   globals: this.state.globals})}
		</div>);
	}
	return (<div />);
    }
}

export default AppPageBase;
