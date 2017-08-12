import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import $ from 'jquery';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading'

import Hg38TabsC from './hg38/hg38tabs';

/*global GlobalAssembly */
/*eslint no-undef: "error"*/

class Hg38Tab extends React.Component{

    constructor(props) {
        super(props);
        this.state = { jq: null, isFetching: false, isError: false, data: null};
	this.loadData = this.loadData.bind(this);
    }

    componentDidMount(){
        this.loadData(this.props);
    }

    componentWillReceiveProps(nextProps){
        this.loadData(nextProps);
    }

    _process_cistrome(r) {
	let interval = 1.0 / r.cistrome_encode_hg19.length;
	let data = {cistrome: []};
	r.cistrome_encode_hg19.map( (_, i) => {
	    data.cistrome.push({
		name: Math.round(interval * i * 100) / 100,
		"lifted over ENCODE hg19 cREs": r.cistrome_encode_hg19[i],
		"ENCODE and Cistrome hg38 cREs": r.cistrome_encode_hg38[i]
	    });
	} );
	return data;
    }
    
    _process_hg19(r) {
	let data = {hg19: [], hg38: []};
	let interval = 1.0 / r.hg19_hg38.all.length;
	r.hg19_hg38.all.map( (_, i) => {
	    data.hg19.push({
		name: Math.round(interval * i * 100) / 100,
		"original hg19 cREs": r.hg19_hg19.all[i],
		"lifted over hg38 cREs": r.hg38_hg19.all[i],
		"hg19 high DNase": r.hg19_hg19.DNase[i],
		"hg19 high H3K4me3": r.hg19_hg19.H3K4me3[i],
		"hg19 high H3K27ac": r.hg19_hg19.H3K27ac[i],
		"hg19 high CTCF": r.hg19_hg19.CTCF[i]
	    });
	    data.hg38.push({
		name: Math.round(interval * i * 100) / 100,
		"original hg38 cREs": r.hg38_hg38.all[i],
		"lifted over hg19 cREs": r.hg19_hg38.all[i],
		"hg38 high DNase": r.hg38_hg38.DNase[i],
		"hg38 high H3K4me3": r.hg38_hg38.H3K4me3[i],
		"hg38 high H3K27ac": r.hg38_hg38.H3K27ac[i],
		"hg38 high CTCF": r.hg38_hg38.CTCF[i]
	    });
	} );
	return data;
    }

    _process_saturation(r) {
	let data = {
	    data: r.saturation,
	    qsets: r.saturation,
	    qset_order: {}
	};
	Object.keys(r.saturation).map( k => {
	    data.qset_order[k] = Object.keys(r.saturation[k]).sort( (a, b) => (+a - +b) );
	} );
	return data;
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
            url: "/dataws/global_liftover",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
		let data = {
		    hg19intersect: this._process_hg19(r),
		    saturation: this._process_saturation(r),
		    cistromeintersect: this._process_cistrome(r)
		};
		this.setState({data, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    render() {
        if (!this.state.data) { return loading(this.state); }
        return (<div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
		            <Hg38TabsC data={this.state.data} actions={this.props.actions} />
                        </div>
                    </div>
                </div>);
    }
    
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(Hg38Tab);
