import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Tree from '../../../common/components/tree'

import REComponent from '../../../common/components/re_component'
import AssayDropdown from './assaydropdown'

import * as Actions from '../actions/main_actions';
import loading from '../../../common/components/loading'

import {asum} from '../../../common/common'

import {primary_cell_colors, infer_primary_type, TissueColors} from '../config/colors'

const get_children = (node) => {
    if (!node.children) {
        return [node.data.key];
    }
    return asum(node.children.map(get_children));
};

const default_label_formatter = (l) => {
    return {
	key: l.key ? l.key : l,
	name: (l.name ? l.name : l),
	style: {fill: TissueColors[l.tissue]}
    };
};

const primary_cell_formatter = (l) => {
    var retval = default_label_formatter(l);
    if (!l.name) return retval;
    retval.style.fill = primary_cell_colors[infer_primary_type(l.name, l.tissue)];
    return retval;
};

class AssayDropdownStatic extends React.Component {
    constructor(props) {
	super(props);
	this._onchange = this._onchange.bind(this);
    }

    _onchange() {
	if (this.props.onChange) {
	    this.props.onChange(this.refs.mainselect.value);
	}
    }
    
    render() {
	return (<select onChange={this._onchange} ref="mainselect">
		<option value="H3K27ac">H3K27ac Only</option>
		<option value="DNase">DNase</option>
		<option value="CTCF">CTCF Only</option>
		<option value="H3K4me3">H3K4me3 Only</option>
		</select>);
    }
}

class ResultsTree extends React.Component { //REComponent {

    constructor(props) {
	super(props);
        this.state = { isFetching: false, isError: false}
    }

    componentWillReceiveProps(nextProps){
        //console.log("in componentWillReceiveProps");
        if("ct_tree" == nextProps.maintabs_active){
	    //this.loadTrees(nextProps);
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

    makeTree(data, k, _formatter, actions){
	k = k.replace(/_/g, " ");
	var formatter = (k == "primary cell" ?
			 primary_cell_formatter : _formatter);
	var labels = (data.labels ? data.labels.map(formatter) : null);
	var height = (labels ? labels.length * 15 : 0);
	return (<div ref="container">
		<h2>{k}</h2>
		{"(" + data.numCellTypes + " experiments)"}
		<Tree
                data={data.tree}
                width={2000}
                height={height}
		labels={labels}
                onClick={(d) => {
	            var left = get_children(d.children[0]);
	            var right = get_children(d.children[1]);
                    actions.setMainTab("tf_enrichment");
                    actions.setTreeNodesCompare(left, right);
                }}
                />
		</div>);
    }

    doRenderWrapper(actions){
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
                        return this.makeTree(trees[k], k, _formatter, actions);
                    })}
                    </div>);
        }
        return loading(this.state);
    }

    doRenderWrapperStatic(actions){
        let tree_rank_method = this.props.tree_rank_method;
	let imgs = {DNase : "Mouse.DNase.Embryo.Tree.png",
		    CTCF : "Mouse.CTCF.Tissue.Tree.png",
		    H3K27ac : "Mouse.H3K27ac.Tissue.Tree.png",
		    H3K4me3 : "Mouse.H3K4me3.Tissue.Tree.png"}
	let scale = {DNase : "50%",
		     CTCF : "25%",
		     H3K27ac : "50%",
		     H3K4me3 : "50%"}
	let fn = imgs[tree_rank_method];
	let url = "http://bib7.umassmed.edu/~purcarom/encyclopedia/Version-4/ver9/mm10/public_html/" + fn;

        return (<div>
		<h1>{tree_rank_method}</h1>
		<img src={url} alt={"static"} style={{width: scale[tree_rank_method]}} />
                </div>);
    }

    render() {
	var actions = this.props.actions;

	return (<div>
		<AssayDropdownStatic onChange={(v) => {actions.setTreeRankMethod(v);}} />
                {this.doRenderWrapperStatic(actions)}
		<span ref="help_icon" />
		</div>);
    }
};

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch) });
export default connect(mapStateToProps, mapDispatchToProps)(ResultsTree);
