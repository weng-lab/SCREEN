/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';
import { v4 as uuidv4 } from 'uuid';

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

    UNSAFE_componentWillReceiveProps(nextProps){
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
	const query = Object.keys(nextProps.location.query).reduce((curr, key) => {
		curr[key] = decodeURIComponent(nextProps.location.query[key]);
		return curr;
	}, {});

	const uuid = "uuid" in query ? query["uuid"] : uuidv4();
		
	const jq = JSON.stringify({...query,
				   uuid,
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

	    const uuid = "uuid" in this.props ? this.props.uuid : uuidv4();

	    return (
		<div>
		    {React.createElement(this.innerClass, {uuid,
							   search: this.state.search,
							   root: this.props,
							   globals: this.state.globals})}
		</div>);
	}
	return (<div />);
    }
}

export default AppPageBase;
