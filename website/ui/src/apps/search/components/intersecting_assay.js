import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import * as Render from '../../../common/renders'

import ResultsTable from '../../../common/components/results_table'

class IntersectingAssay extends React.Component {
    constructor(props) {
	super(props);
        this.state = { target: null, isFetching: true, isError: false,
                       jq : null}
        this.loadTarget = this.loadTarget.bind(this);
    }

    componentWillReceiveProps(nextProps){
        //console.log("in componentWillReceiveProps");
        this.loadTarget(nextProps);
    }

    loadTarget({cre_accession_detail}, target){
        if(target in this.state){
            return;
        }
        let q = {GlobalAssembly, accession: cre_accession_detail, target};
        var jq = JSON.stringify(q);
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadTarget....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/dataws/cre_tf_dcc",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading target for table");
                this.setState({target: null,
                               jq, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({target, ...r,
                               jq, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    render() {
        let data = this.props.data
        let table = this.props.table;
        let onTdClick = (i, d) => {
            this.loadTarget(this.props, d.name);
        };

        let details = "";
        let target = this.state.target;
        if(target && target in this.state){
            let table = {title: target + " Experiments",
	                 cols: [
	                     {title: "cell type", data: "biosample_term_name"},
                             {title: "experiment", data: "expID",
	                      render: Render.factorbook_link_tf }
                             ],
	                 order: [[0, "asc"]]
                        }
            details = React.createElement(ResultsTable,
                                          {data : this.state[target], ...table});
        }

	return (<div>
                {React.createElement(ResultsTable, {data, ...table, onTdClick})}
                {details}
                </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)
(IntersectingAssay);

