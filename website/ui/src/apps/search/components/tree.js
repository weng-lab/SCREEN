import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Tree from '../../../common/components/tree'
import {invalidate_results, invalidate_tree_comparison} from '../helpers/invalidate_results'
import {SET_TREE_FIELDS} from '../reducers/root_reducer'

import REComponent from '../../../common/components/re_component'

import {primary_cell_label_formatter} from '../config/colors'

import * as Actions from '../actions/main_actions';

const default_label_formatter = (l) => {
    return {
	name: l
    };
};

class ResultsTree extends React.Component { //REComponent {

    constructor(props) {
	super(props);
        this.state = { isFetching: false, isError: false}
    }

    componentWillReceiveProps(nextProps){
        //console.log("in componentWillReceiveProps");
        if("ct_tree" == nextProps.maintabs_active){
	    this.loadTrees(nextProps);
	}
    }

    loadTrees({tree_rank_method}){
	if(tree_rank_method in this.state){
	    return;
	}
	var q = {GlobalAssembly, tree_rank_method}
        var jq = JSON.stringify(q);
        this.setState({isFetching: true});
        $.ajax({
            url: "/dataws/trees",
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

    makeTree(tree_rank_method, tr, k, _formatter){
	var formatter = (k == "primary cell" ?
			 primary_cell_label_formatter : _formatter);
	var data = this.state[tree_rank_method];
	var labels = (data.labels ? data.labels.map(formatter) : null);
	var height = (labels ? labels.length * 15 : 0);
	return (<div ref="container">
		<h2>{k}</h2>
		<Tree data={data.tree} width={2000} height={height}
		labels={labels} onClick={this._on_click} />
		</div>);
    }

    render() {
	var title = "";
	var actions = this.props.actions;

	return (<div>
		<select onChange={() => {
		    actions.setTreeRankMethod(this.refs.field.value)}}
		ref="field">
		<option value="dnase">DNase</option>
		<option value="promoter$H3K4me3-Only">H3K4me3 Only</option>
		<option value="promoter$DNase+H3K4me3">H3K4me3 and DNase</option>
		<option value="enhancer$H3K27ac-Only">H3K27ac Only</option>
		<option value="enhancer$DNase+H3K27ac">H3K27ac and DNase</option>
		<option value="ctcf$CTCF-Only">CTCF Only</option>
		<option value="ctcf$DNase+CTCF">CTCF and DNase</option>
		</select>
		<h1>{title}</h1>
		<span ref="help_icon" />
		</div>);
    }
};

const mapStateToProps = (state) => ({
        ...state
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ResultsTree);
