import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import CelltypeView from '../components/celltype_view'

import loading from '../../../common/components/loading'
import {arrowNote} from '../../../common/utility'
import ResultsTable from '../../../common/components/results_table'
import HelpIcon from '../../../common/components/help_icon'

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
        //console.log("componentWillReceiveProps", nextProps);
        this.loadGwas(nextProps);
    }

    componentWillUnmount(){
        // clear store state for next user choice
        this.props.actions.setStudy(null);
        this.props.actions.setGwasCellTypes(null);
    }

    loadGwas({gwas_study, actions}){
	if(!gwas_study){
	    return;
	}
        var q = {GlobalAssembly, gwas_study};
        var jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadGene....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/gwasJson/main",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({...r, isFetching: false, isError: false});
                actions.setGwasCellTypes(r[gwas_study].topCellTypes);
            }.bind(this)
        });
    }

    doRenderWrapper({gwas_study, cellType, actions}){
	var data = this.state[gwas_study];
        var ctView = (cellType ? <CelltypeView /> :
                      arrowNote("Please choose a cell type.")
        );
        let mainTable = (<ResultsTable
                             data={data.mainTable}
                             cols={[
                                 {title: "Total LD blocks",
                                  data: "totalLDblocks",
                                  orderable: false},
                                 {title: "# of LD blocks overlapping cREs",
                                  data: "numLdBlocksOverlapFormat",
                                  orderable: false},
                                 {title: "# of overlapping cREs",
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
