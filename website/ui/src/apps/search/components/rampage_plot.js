/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Rampage from '../components/rampage';

import * as Actions from '../actions/main_actions';
import * as ApiClient from '../../../common/api_client';
import loading from '../../../common/components/loading';

class RampagePlot extends React.Component {
    key = "rampage";
    url = "/dataws/rampage"
    state = { jq: null, isFetching: true, isError: false };
    
    shouldComponentUpdate(nextProps, nextState) {
	if(this.key === nextProps.maintabs_active){
	    return true;
	}
    	return false;
    }

    componentDidMount(){
	if(this.key === this.props.maintabs_active){
	    this.loadCRE(this.props);
	}
    }

    componentWillReceiveProps(nextProps){
	if(this.key === nextProps.maintabs_active){
	    this.loadCRE(nextProps);
	}
    }

    loadCRE = ({assembly, gene}) => {
        if(!gene || gene in this.state){
            return;
        }
        const q = {assembly, gene}
        const jq = JSON.stringify(q);
	if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	ApiClient.getByPost(jq, this.url,
			    (r) => {
				this.setState({...r, isFetching: false,
					       isError: false});
			    },
			    (msg) => {
				console.log("err loading cre details");
				console.log(msg);
				this.setState({jq: null, isFetching: false,
					       isError: true});
			    });
    }

    doRenderWrapper = () => {
        const doit = (globals, assembly, keysAndData) => {
            let data = keysAndData.tsss;
	    
	    if(0 === data.length) {
		return <div><br />{"No RAMPAGE data found for this cCRE"}</div>;
	    }
	    
            return (
                    <div className={"container"} style={{paddingTop: "10px"}}>
		    {React.createElement(Rampage,
                                         {globals, assembly, keysAndData,
                                          width: 800,
                                          barheight: "15"})}
                </div>);
        }
	
        const gene = this.props.gene;
        if(gene in this.state){
            return doit(this.props.globals, this.props.assembly, this.state[gene]);
        }
        return loading({...this.state, message: this.props.message});
    }

    render(){
	if(this.key !== this.props.maintabs_active){
            return false;
        }
        return (
            <div style={{"width": "100%"}} >
                {this.doRenderWrapper()}
            </div>);
    }
};

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(RampagePlot);
