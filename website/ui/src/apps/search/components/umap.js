/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useState, useEffect } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as ApiClient from '../../../common/api_client';
import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/zrenders';

import Ztable from '../../../common/components/ztable/ztable';
import loading from '../../../common/components/loading';

import UmapPlot from './umap_plot';

export const getUmap = (jq, baseUrl, successF, errF) => {
    //const url = Config.UI.minipeakServer + baseUrl;
    const url = "https://cors-anywhere.herokuapp.com/https://users.wenglab.org/purcarom/dnase_umap2/EH38D2560869/EH38D2560869_20_0.25.json"
    
    fetch(url,
	  {
	      headers: {
		  'Accept': 'application/json',
		  'Content-Type': 'application/json'
	      },
	  })
	.then((response) => (response.json()))
	.then(successF)
	.catch(errF);
}

class Umap extends React.Component {
    state = {jq: null, isFetching: true, isError: false };
    key = "umap";
    
    shouldComponentUpdate(nextProps, nextState) {
	if("details" === nextProps.maintabs_active){
            if(this.key === nextProps.re_details_tab_active){
		return true;
	    }
	}
	return false;
    }

    UNSAFE_componentWillReceiveProps(nextProps){
        // only check/get data if we will become active tab...
	if("details" === nextProps.maintabs_active){
            if(this.key === nextProps.re_details_tab_active){
                this.loadPeaks(nextProps);
            }
        }
    }

    loadPeaks({assembly, cre_accession_detail}){
	const accession = cre_accession_detail;
	if(accession in this.state){
	    return;
	}
	const q = {assembly, accession};
        const jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	getUmap(jq, this.key,
		(r) => {
		    const b = {};
		    b[accession] = r;
		    this.setState({...b,
				   jq,
				   isFetching: false,
				   isError: false});
		},
		(msg) => {
		    console.log("err loading minipeaks");
		    console.log(msg);
		    this.setState({jq: null, isFetching: false,
				   isError: true});
		});
    }

    doRender(cCRE, rDHS){
	const data = this.state[cCRE];
	const nneighbors = 20;
	const min_dist = 0.25;
        return (
		<div>
		<h3>UMAP</h3>
		<UmapPlot {...{cCRE, rDHS, nneighbors, min_dist, data}} />
	    </div>);
    }

    render() {
	let accession = this.props.cre_accession_detail;
	if (!(accession in this.state)){
            return loading(this.state);
	}

	const cCRE = "EH38E1613450";
	const rDHS = "EH38D2560869";
	
	if(cCRE !== accession){
	    return (<div>{"wrong accession"}</div>);
	}

	return (
            <div className={"umap"}>
                {this.doRender(cCRE, rDHS)}
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(Umap);
