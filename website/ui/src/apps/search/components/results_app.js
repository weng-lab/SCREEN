import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import TableWithCart from './table_with_cart'

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

    loadCREs({accessions, coord_chrom, coord_start, coord_end,
              gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
              rank_dnase_start, rank_dnase_end,
              rank_promoter_start, rank_promoter_end,
              rank_enhancer_start, rank_enhancer_end,
              rank_ctcf_start, rank_ctcf_end,
              cellType}){
        var q = {GlobalAssembly,
                 accessions, coord_chrom, coord_start, coord_end,
                 gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
                 rank_dnase_start, rank_dnase_end,
                 rank_promoter_start, rank_promoter_end,
                 rank_enhancer_start, rank_enhancer_end,
                 rank_ctcf_start, rank_ctcf_end, cellType};
        var jq = JSON.stringify(q);
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
                this.setState({cres: r["cres"], total: r["total"],
                               jq, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    render() {
	return (<TableWithCart
                actions={this.props.actions}
                data={this.state.cres}
                total={this.state.total}
                cart_accessions={this.props.cart_accessions}
                fetching={this.state.isFetching}
                />);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)
(ResultsTableContainer);

