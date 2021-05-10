/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';

import * as ApiClient from './api_client';

const MyLocation = () => {
    // FIXME: switch to location hook...
    // const location = useLocation();
    const location = window.location.search;
    const values = queryString.parse(location);
    return values;
}

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
 
    UNSAFE_componentWillReceiveProps(nextProps, state){
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

	const queryRaw = MyLocation();
	const query = Object.keys(queryRaw).reduce((curr, key) => {
		curr[key] = decodeURIComponent(queryRaw[key]);
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

	const queryRaw = MyLocation();
	const query = Object.keys(queryRaw).reduce((curr, key) => {
		curr[key] = decodeURIComponent(queryRaw[key]);
		return curr;
	}, {});

	ApiClient.globals(query.assembly,
			  (r) => {
			      console.log("r:", r);
			      this.setState({globals: r, isFetchingGlobals: false, isError: false});
			  },
			  (err) => {
			      console.log("err searching ");
			      console.log(query);
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
							   globals: this.state.globals})}
		</div>);
	}
	return (<div />);
    }
}

export default AppPageBase;
