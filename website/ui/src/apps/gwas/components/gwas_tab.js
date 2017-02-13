import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import Table from '../components/table'
import CelltypeView from '../components/celltype_view'

import loading from '../../../common/components/loading'
import ResultsTable from '../../../common/components/results_table'

class GwasTab extends React.Component{
    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: false, isError: false,
                       selectStudy: true };
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

    loadGwas({gwas_study, actions}){
	if(null == gwas_study){
	    this.setState({selectStudy: true})
	    return;
	}
        var q = {GlobalAssembly, gwas_study};
        var jq = JSON.stringify(q);
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadGene....", this.state.jq, jq);
        this.setState({jq, isFetching: true, selectStudy: false});
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
            }.bind(this)
        });
    }

    doRenderWrapper({gwas_study, cellType, actions}){
	if(this.state.selectStudy){
            return (<div>
                    {"Please choose a study on left"}
                    </div>);
        }

        if(gwas_study in this.state){
	    var data = this.state[gwas_study];
            var ctView = (cellType ?
                          <CelltypeView
                          data={data.accs}
                          /> :
                          "");
            console.log(data);
            return (<div>
		    <h2>{data.gwas_study.trait}</h2>

		    <div className="container-fluid">
		    <div className="row">

		    <div className="col-md-6">
                    <ResultsTable
                    data={data.mainTable}
                    cols={[
                        {title: "Total LD blocks",
                         data: "totalLDblocks", className: "dt-right"},
                        {title: "# of LD blocks overlapping cREs",
                         data: "numLdBlocksOverlap", className: "dt-right"}
	            ]}
                    paging={false}
                    />
		    </div>

		    <div className="col-md-6">
                    <ResultsTable
                    data={data.topCellTypes}
                    cols={[
                        {title: "Cell Type",
                         data: "biosample_term_name", className: "dt-right"},
                        {title: "-log(FDR)",
                         data: "neglogfdr", className: "dt-right"}
	            ]}
                    paging={false}
                    />
		    </div>

		    </div>
		    </div>

                    {ctView}

		    </div>);
        }
        return loading(this.state);
    }

    render(){
        return (<div style={{"width": "100%"}} >
                {this.doRenderWrapper(this.props)}
                </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(GwasTab);
