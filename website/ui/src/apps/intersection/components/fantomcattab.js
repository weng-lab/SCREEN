import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading'
import HelpIcon from '../../../common/components/help_icon'

import Histogram from '../../../plots/components/histogram';
import PieChart from '../../../plots/components/piechart';
import Boxplot from '../../../plots/components/boxplot';

let o = ["non-coding", "coding", "", "pseudogenes", "protein coding mRNAs", "sense overlap RNAs", "uncertain coding", "small RNAs", "lncRNA, intergenic", "lncRNA, antisense", "lncRNA, divergent"];

class FantomCatTab extends React.Component{

    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: false, isError: false, data: null};
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
	this.loadData = this.loadData.bind(this);
    }

    componentDidMount(){
        this.loadData(this.props);
    }

    componentWillReceiveProps(nextProps){
        this.loadData(nextProps);
    }

    loadData({actions}){
        var q = {GlobalAssembly, name: "fantomcat"};
        var jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/dataws/global_object",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
		this._qsets = {};
		Object.keys(r.classes).map((k => {
		    return this._qsets[k] = r.classes[k].quartiles;
		}).bind(this));
		this.setState({data: r, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    _render_histograms(q) {
	return (<div><div className="row">
		<div className="col-md-6"><h3>cREs per kb, non-coding RNA</h3></div>
		<div className="col-md-6"><h3>cREs per kb, coding RNA</h3></div>
		</div>
		<div className="row">
	  	<div style={{height: "300px"}} className="col-md-6">
		    <Histogram x={Array.from(Array(100).keys()).map(x => x / 20.0)} y={q.classes["non-coding"].bins}
		       viewBox={{width: 400, height: 150}}
		       margin={{left: 5, bottom: 5, top: 0, right: 5}} />
		</div>
		<div style={{height: "300px"}} className="col-md-6">
		    <Histogram x={Array.from(Array(100).keys()).map(x => x / 20.0)} y={q.classes.coding.bins}
		       viewBox={{width: 400, height: 150}}
		       margin={{left: 5, bottom: 5, top: 0, right: 5}} />
		</div>
		</div></div>);
    }

    _render_boxplot(o) {
	if (!this._qsets) return <div />;
	return (<div><div className="row">
		<div className="col-md-6"><h3>cREs per kb</h3></div>
		<div className="col-md-6" />
		</div>
		<div className="row">
		<div style={{height: "600px"}} className="row-md-6">
		    <Boxplot viewBox={{width: 600, height: 450}} useiqr={true}
		        margin={{left: 5, bottom: 5, top: 0, right: 5}}
		        qsets={this._qsets} qsetorder={o} />
		</div>
		<div className="col-md-6" />
		</div>
		</div>);
    }

    _render_piecharts(q) {
	return (<div><div className="row">
		<div className="col-md-6"><h3>intersecting cREs, non-coding RNA</h3></div>
		<div className="col-md-6"><h3>intersecting cREs, coding RNA</h3></div>
		</div>
		<div className="row">
	  	<div style={{height: "300px"}} className="col-md-6">
		    <PieChart viewBox={{width: 400, height: 400}} radius={200} stroke="#000"
		        slices={[ {pct: q.classes["non-coding"].intersecting / q.classes["non-coding"].total, fill: "#fff"},
				  {pct: 1.0 - q.classes["non-coding"].intersecting / q.classes["non-coding"].total, fill: "#444"} ]} />
		</div>
		<div style={{height: "300px"}} className="col-md-6">
		    <PieChart viewBox={{width: 400, height: 400}} radius={200} stroke="#000"
		        slices={[ {pct: q.classes.coding.intersecting / q.classes.coding.total, fill: "#fff"},
				  {pct: 1.0 - q.classes.coding.intersecting / q.classes.coding.total, fill: "#444"} ]} />
		</div>
		</div></div>);
    }
    
    doRenderWrapper({data, actions}){
	if (!data) return <div />;
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-12">
		        {this._render_piecharts(data)}
	                {this._render_histograms(data)}
	                {this._render_boxplot(o)}
                    </div>
                </div>
            </div>);
    }

    render(){
        if (!this.state.data) return loading(this.state);
        return (
            <div style={{"width": "100%"}} >
                {this.doRenderWrapper({...this.props, data: this.state.data})}
            </div>
	);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(FantomCatTab);
