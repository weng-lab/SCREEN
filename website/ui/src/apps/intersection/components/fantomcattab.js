import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import $ from 'jquery';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading'

import FantomCatTabs from './fantomcat/fantomcattabs';

/*global GlobalAssembly */
/*eslint no-undef: "error"*/

let o = ["non-coding", "coding", "", "pseudogenes", "protein coding mRNAs", "sense overlap RNAs", "uncertain coding", "lncRNA, intergenic", "lncRNA, antisense", "lncRNA, divergent"];

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
        var q = {GlobalAssembly};
        var jq = JSON.stringify(q);
        if(this.state.jq === jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        this.setState({jq, isFetching: true});
        $.ajax({
            url: "/dataws/global_fantomcat",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
		this._qsets = {main: {}, twokb: {}}; //, bymaxz: {}};
		Object.keys(r.main.classes).map((k => {
		    return this._qsets.main[k] = r.main.classes[k].quartiles;
		}));
		Object.keys(r.fantomcat_2kb.classes).map((k => {
		    return this._qsets.twokb[k] = r.fantomcat_2kb.classes[k].quartiles;
		}));
		/* Object.keys(r.fantomcat_bymaxz).map((a => {
		   this._qsets.bymaxz[a] = {};
		   return Object.keys(r.fantomcat_bymaxz[a].classes).map((k => {
		   return this._qsets.bymaxz[a][k] = r.fantomcat_bymaxz[a].classes[k].quartiles;
		   }).bind(this))
		   }).bind(this)); */
		this.setState({data: r, isFetching: false, isError: false});
            }.bind(this)
        });
    }
    
    doRenderWrapper({data, actions}){
	if (!data) return <div />;
	let tabdata = {
	    piecharts: {
		data: data.main
	    },
	    perkb: {
		data: data.main,
		qsets: this._qsets.main,
		qset_order: o
	    },
	    piecharts_twokb: {
		data: data.fantomcat_2kb
	    },
	    perkb_twokb: {
		data: data.fantomcat_2kb,
		qsets: this._qsets.twokb,
		qset_order: o
	    } //,
	    /*perkbz: {
		data: data.fantomcat_bymaxz,
		qsets: this._qsets.bymaxz,
		qset_order: o
	    } */
	};
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-12">
		        <FantomCatTabs data={tabdata} />
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
