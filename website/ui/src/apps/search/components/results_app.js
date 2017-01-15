import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import TableWithCart from './table_with_cart'
import ResultsTableColumns, {table_order} from '../config/results_table'

import * as Actions from '../actions/facetboxen_actions';

class ResultsApp extends React.Component {
    constructor(props) {
	super(props);
        this.state = { cres: [], isFetching: true, isError: false,
                       jq : null}
    }

    componentDidMount(){
        this.loadCREs(this.props);
    }

    componentWillReceiveProps(nextProps){
        this.loadCREs(nextProps);
    }

    loadCREs({accessions, coord_chrom, coord_start, coord_end,
              gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
              rank_dnase_start, rank_dnase_end,
              rank_promoter_start, rank_promoter_end,
              rank_enhancer_start, rank_enhancer_end,
              rank_ctcf_start, rank_ctcf_end,
              cellType}){
        var q = {"action": "cre_table", GlobalAssembly,
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
        console.log("loadCREs....", q);
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/dataws",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for table");
                this.setState({cres: [], jq, isFetching: false, isError: true});
            },
            success: function(cres) {
                this.setState({cres, jq, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    render() {
	return (<TableWithCart data={this.state.cres}
                total={0}
                fetching={this.state.isFetching}
                order={table_order} cols={ResultsTableColumns} />);
    }
}

const mapStateToProps = (state) => ({
        ...state
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ResultsApp);

