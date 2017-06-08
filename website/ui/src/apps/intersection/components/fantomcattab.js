import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading'
import HelpIcon from '../../../common/components/help_icon'

import FantomCatTabs from './fantomcat/fantomcattabs';

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
    
    doRenderWrapper({data, actions}){
	if (!data) return <div />;
	let tabdata = {
	    piecharts: {
		data
	    },
	    perkb: {
		data,
		qsets: this._qsets,
		qset_order: o
	    }
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
