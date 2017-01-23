import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Tree from '../../../common/components/tree'

import REComponent from '../../../common/components/re_component'

import {primary_cell_label_formatter} from '../config/colors'

import * as Actions from '../actions/main_actions';
import loading from '../../../common/components/loading'

import {asum} from '../../../common/common'

const get_children = (node) => {
    if (!node.children) return [node.data.name];
    return asum(node.children.map(get_children));
};

const default_label_formatter = (l) => {
    return {
	name: l
    };
};

const tree_comparison_done = (response) => {
    return {
	type: "TREE_COMPARISON_DONE"
    };
};

const set_tree_comparison = (response) => {
    return {
	type: "SET_TREE_COMPARISON",
	response
    };
};

class ResultsTree extends React.Component { //REComponent {

    constructor(props) {
	super(props);
        this.state = { isFetching: false, isError: false}
	this._on_click = this._on_click.bind(this);
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
                console.log("err loading tree");
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({...r, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    _on_click(d) {
	var data = {
	    left: get_children(d.children[0]),
	    right: get_children(d.children[1]),
	    action: "tfenrichment",
	    GlobalAssembly
	};
	var f_success = (response, status, jqxhr) => {
	    this.props.dispatch(tree_comparison_done(response));
	    this.props.dispatch(set_tree_comparison(response));
	};
	$.ajax({
	    url: "/dataws/tfenrichment",
	    type: "POST",
	    data: JSON.stringify(data),
	    dataType: "json",
	    contentType: "application/json",
	    error: ((jqxhr, status, error) => {
		console.log("error fetching TF enrichment");
	    }).bind(this),
	    success: f_success.bind(this)
	});
    }

    makeTree(data, k, _formatter){
	var formatter = (k == "primary cell" ?
			 primary_cell_label_formatter : _formatter);
	var labels = (data.labels ? data.labels.map(formatter) : null);
	var height = (labels ? labels.length * 15 : 0);
	return (<div ref="container">
		<h2>{k}</h2>
		<Tree data={data.tree} width={2000} height={height}
		labels={labels} onClick={this._on_click} />
		</div>);
    }

    doRenderWrapper(){
        let tree_rank_method = this.props.tree_rank_method;
        if(tree_rank_method in this.state){
            let title = this.state[tree_rank_method].title;
            let trees = this.state[tree_rank_method].trees;
            var _formatter = (this.props.label_formatter ?
                              this.props.label_formatter :
                              default_label_formatter);
            return (<div>
		    <h1>{title}</h1>
                    {Object.keys(trees).map((k) => {
                        return this.makeTree(trees[k], k, _formatter); })}
                    </div>);
        }
        return loading(this.state);
    }

    render() {
	var actions = this.props.actions;

	return (<div>
		<select onChange={() => {
                    actions.setTreeRankMethod(this.refs.field.value)}}
		ref="field">
		<option value="DNase">DNase</option>
		<option value="H3K4me3">H3K4me3 Only</option>
		<option value="Promoter">H3K4me3 and DNase</option>
		<option value="H3K27ac">H3K27ac Only</option>
		<option value="Enhancer">H3K27ac and DNase</option>
		<option value="CTCF">CTCF Only</option>
		<option value="Insulator">CTCF and DNase</option>
		</select>
                {this.doRenderWrapper()}
		<span ref="help_icon" />
		</div>);
    }
};

const mapStateToProps = (state) => ({
        ...state
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch),
    dispatch
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ResultsTree);
