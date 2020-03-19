/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as ApiClient from '../../../common/api_client';

import CelltypeView, {ConnAllCTView} from '../components/celltype_view';

import loading from '../../../common/components/loading';
import {arrowNote} from '../../../common/utility';
import Ztable from '../../../common/components/ztable/ztable';
import Legend from '../../search/components/legend';

class GwasTab extends React.Component{
    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: false, isError: false};
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
        this.loadGwas = this.loadGwas.bind(this);
    }

    componentDidMount(){
	this.loadGwas(this.props);
    }

    componentWillReceiveProps(nextProps){
        this.loadGwas(nextProps);
    }

    componentWillUnmount(){
        // clear store state for next user choice
        this.props.actions.setStudy(null);
        this.props.actions.setGwasCellTypes(null);
    }

    loadGwas({assembly, gwas_study, actions}){
	if(!gwas_study){
	    return;
	}
        const q = {assembly, gwas_study};
        const jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
	ApiClient.getByPost(jq, "/gwasws/main",
			    (r) => {
				this.setState({...r, isFetching: false, isError: false});
				actions.setGwasCellTypes(r[gwas_study].topCellTypes);
			    },
			    (msg) => {
				console.log("err loading cres for table");
				this.setState({isFetching: false, isError: true});
			    });
    }

    doRenderWrapper({gwas_study, cellType, actions}){
	var data = this.state[gwas_study];
	var ctView;
	if (data.topCellTypes.length === 0) {
	    ctView = <ConnAllCTView globals={this.props.globals} rdata={data.mainTable[0]} data={data.cres._all} />;
	} else {						   
            ctView = (cellType || data.topCellTypes.length === 0 ? <CelltypeView globals={this.props.globals}
		      rdata={data.mainTable[0]} forcect={data.topCellTypes.length === 0 ? data.cres._all : false} /> :
                      arrowNote("Please choose a cell type.")
		     );
	}
        let mainTable = (<Ztable
                             data={data.mainTable}
                             cols={[
                                 {title: "Total LD blocks",
                                  data: "totalLDblocks",
                                  orderable: false},
                                 {title: "# of LD blocks overlapping cCREs",
                                  data: "numLdBlocksOverlapFormat",
                                  orderable: false},
                                 {title: "# of overlapping cCREs",
                                  data: "numCresOverlap",
                                  orderable: false}
	                     ]}
                             paging={false}
                         />);

        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-12">
		        <h3>
                            {data.gwas_study.trait}
                        </h3>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
		{mainTable}
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12">
                {ctView}
	    		<Legend {...this.props} />
                    </div>
                </div>
            </div>);
    }

    render(){
	if(!this.props.gwas_study){
            return arrowNote("Please choose a study.");
        }
        if(!(this.props.gwas_study in this.state)){
            return loading(this.state);
        }
        return (
            <div style={{"width": "100%"}} >
                {this.doRenderWrapper(this.props)}
            </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(GwasTab);
