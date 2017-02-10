import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import Pie from '../components/pie'
import Table from '../components/table'
import loading from '../../../common/components/loading'

import ResultsTableContainer from '../../search/components/results_app'

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
            url: "/gwasJson",
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

    doRenderWrapper({gwas_study, accessions, actions}){
	if(this.state.selectStudy){
            return (<div>
                    {"Please choose a study on left"}
                    </div>);
        }

        // 		actions.setAccessions(r[gwas_study].accessions);

        if(gwas_study in this.state){
	    var data = this.state[gwas_study];
            var creTable = (accessions ?
		            <ResultsTableContainer /> :
                            "");
            return (<div>
		    <h2>{gwas_study}</h2>

		    <div className="container-fluid">
		    <div className="row">
		    <div className="col-md-6">
		    <Pie data={data.pie} />
		    </div>
		    <div className="col-md-6">
		    <Table
		    header={data.table.header}
		    rows={data.table.rows} />
		    </div>
		    </div>
		    </div>

                    {creTable}

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
