import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import REComponent from '../../../common/components/re_component'
import loading from '../../../common/components/loading'

import LargeHorizontalBars from '../components/large_horizontal_bars'

class ExpressionBoxplot extends React.Component {
    constructor(props) {
        super(props);
        this.state = { isFetching: true, isError: false };
        this.loadGene = this.loadGene.bind(this);
    }

    componentDidMount() {
	this.componentDidUpdate();
    }

    componentDidUpdate() {
	var width = 800;
	var barheight = "15";
        if(!this.state.isFetching){
	    render(React.createElement(LargeHorizontalBars,
                                       {...this.props, width, barheight}),
	           this.refs.bargraph);
        }
    }

    componentWillReceiveProps(nextProps){
        // only check/get data if we will become active tab...
        console.log("will receive", nextProps);
        if("gene_expression" == nextProps.maintabs_active){
            this.loadGene(nextProps);
        }
    }

    loadGene({gene}){
        console.log("loadGene....", gene, this.state);
        if(gene in this.state){
            return;
        }
        var q = {GlobalAssembly, gene};
        var jq = JSON.stringify(q);
        console.log("loadGene....", jq);
        this.setState({isFetching: true});
        $.ajax({
            url: "/dataws/gene_exp",
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

    render() {
	return (<div>
 	        <span style={{fontSize: "18pt"}}>
                {this.props.gene} <span ref="help_icon" />
                </span>
                {loading(this.state)}
		<div style={{"width": "100%"}} ref="bargraph" />
		</div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(ExpressionBoxplot);
