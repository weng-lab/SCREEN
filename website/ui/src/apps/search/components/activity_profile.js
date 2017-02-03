import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import MiniPeaks from './minipeaks'
import loading from '../../../common/components/loading';

class ActivityProfileContainer extends React.Component {
    constructor(props) {
	super(props);
        this.state = { cres: [], total: 0, isFetching: true, isError: false,
                       jq : null}
	this._onchange = this._onchange.bind(this);
    }

    _onchange(assay) {
	this.loadCREs({...this.props, assay});
    }
    
    componentWillReceiveProps(nextProps){
        //console.log("in componentWillReceiveProps")
	if ("aprofile" == nextProps.maintabs_active)
            this.loadCREs(nextProps);
    }

    loadCREs({accessions, coord_chrom, coord_start, coord_end,
              gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
              rank_dnase_start, rank_dnase_end,
              rank_promoter_start, rank_promoter_end,
              rank_enhancer_start, rank_enhancer_end,
              rank_ctcf_start, rank_ctcf_end,
              cellType, assay}){
	if (!assay) assay = "dnase";
        var q = {GlobalAssembly,
                 accessions, coord_chrom, coord_start, coord_end,
                 gene_all_start, gene_all_end, gene_pc_start, gene_pc_end,
                 rank_dnase_start, rank_dnase_end,
                 rank_promoter_start, rank_promoter_end,
                 rank_enhancer_start, rank_enhancer_end,
                 rank_ctcf_start, rank_ctcf_end, cellType, withpeaks: assay};
        var jq = JSON.stringify(q);
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadCREs....", this.state.jq, jq);
        this.setState({jq, isFetching: true, assay});
        $.ajax({
            url: "/dataws/cre_table",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading cres for minipeaks");
                this.setState({cres: [], total: 0,
                               jq, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({cres: r["cres"], total: r["total"], peakdata: r["peakdata"],
                               jq, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    render() {
	if (this.state.isFetching) return loading(this.state);
	if ("aprofile" != this.props.maintabs_active) return <div />;
	let header = (this.state.total < 20 ? "" : "Displaying first 20 of " + this.state.total + " cREs");
	console.log(this.state.peakdata);
	let mpk = (this.state.peakdata
		   ? <MiniPeaks
		      assay={this.state.assay}
		      onAssayChange={this._onchange}
                      actions={this.props.actions}
                      data={this.state.peakdata}
                      fetching={this.state.isFetching} />
		   : <div />);
	return (<div>{header}<br />{mpk}</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)
(ActivityProfileContainer);

