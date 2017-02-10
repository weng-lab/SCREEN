import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import TableWithCart from './table_with_cart';
import {getCommonState} from '../../../common/utility';

class ResultsTableContainer extends React.Component {
    constructor(props) {
	super(props);
        this.state = { cres: [], total: 0, isFetching: true, isError: false,
                       jq : null}
    }

    componentWillReceiveProps(nextProps){
        //console.log("in componentWillReceiveProps");
        this.loadCREs(nextProps);
    }

    loadCREs(props){
        var q = getCommonState(props);
        var jq = JSON.stringify(q);
	var setrfacets = this.props.actions.setrfacets;
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadCREs....", this.state.jq, jq);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/dataws/cre_table",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({cres: [], total: 0,
                               jq, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({cres: r["cres"], total: r["total"], nodnase: !r["rfacets"].includes("dnase"),
                               jq, isFetching: false, isError: false});
		setrfacets(r["rfacets"]);
            }.bind(this)
        });
    }

    render() {
	return (<TableWithCart
                actions={this.props.actions}
                data={this.state.cres}
                total={this.state.total}
                cart_accessions={this.props.cart_accessions}
                isFetching={this.state.isFetching}
		jq={this.state.jq}
		nodnase={this.state.nodnase}
                />);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)
(ResultsTableContainer);

