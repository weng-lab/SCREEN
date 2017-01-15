import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import TableWithCart from './table_with_cart'
import ResultsTableColumns, {table_order} from '../config/results_table'

import * as Actions from '../actions/facetboxen_actions';

class ResultsApp extends React.Component {
    constructor(props) {
	super(props);
        this.state = { cres: [],
                       isFetching: true}
    }

    componentDidMount(){
        this.loadCREs(this.props);
    }

    componentDidUpdate(){
        this.loadCREs(this.props);
    }

    loadCREs({accessions, coord_chrom, coord_start, coord_end,
              gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
              rank_dnase_start, rank_dnase_end,
              rank_promoter_start, rank_promoter_end,
              rank_enhancer_start, rank_enhancer_end,
              rank_ctcf_start, rank_ctcf_end,
              cellType}){
        var q = {accessions, coord_chrom, coord_start, coord_end,
                 gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
                 rank_dnase_start, rank_dnase_end,
                 rank_promoter_start, rank_promoter_end,
                 rank_enhancer_start, rank_enhancer_end,
                 rank_ctcf_start, rank_ctcf_end, cellType};
        console.log(q);
        $.ajax({
            url: "/my-comments.json",
            dataType: 'json',
            success: function(cres) {
                this.setState({cres,
                               isFetching: false});
            }.bind(this)
        });
    }

    render() {
	return (<TableWithCart data={[]}
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

