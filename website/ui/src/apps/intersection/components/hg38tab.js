import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line } from 'recharts';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading'
import HelpIcon from '../../../common/components/help_icon'

import LinePlot from '../../../plots/components/lineplot/container';
import PlottedLine from '../../../plots/components/lineplot/plottedline';
import PlotWithHeader from '../../../plots/components/plotwithheader';

const Hg19Hg38Plot = ({ width, height, data, keys }) => (
    <LineChart width={width} height={height} data={data}
      margin={{ top: 50, right: 50, left: 50, bottom: 50 }}>
        <XAxis dataKey="name" label="overlap fraction" />
        <YAxis label="% regions with overlap" domain={[0.0, 1.0]} />		
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Legend />
	{keys.map(k => (
	    <Line type="monotone" dataKey={k.text} stroke={k.color}
	      type={k.type ? k.type : "monotone"} />
	) )}
    </LineChart>
);

class Hg38Tab extends React.Component{

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
            url: "/dataws/global_liftover",
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                this.setState({isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
		let interval = 1.0 / r.hg19_hg38.all.length;
		let data = {hg19: [], hg38: []}
		r.hg19_hg38.all.map( (_, i) => {
		    data.hg19.push({
			name: Math.round(interval * i * 100) / 100,
			"original hg19 cREs": r.hg19_hg19.all[i],
			"lifted over hg38 cREs": r.hg19_hg38.all[i],
			"hg19 high DNase": r.hg19_hg19.DNase[i],
			"hg19 high H3K4me3": r.hg19_hg19.H3K4me3[i],
			"hg19 high H3K27ac": r.hg19_hg19.H3K27ac[i],
			"hg19 high CTCF": r.hg19_hg19.CTCF[i]
		    });
		    data.hg38.push({
			name: Math.round(interval * i * 100) / 100,
			"original hg38 cREs": r.hg38_hg38.all[i],
			"lifted over hg19 cREs": r.hg38_hg19.all[i],
			"hg38 high DNase": r.hg38_hg38.DNase[i],
			"hg38 high H3K4me3": r.hg38_hg38.H3K4me3[i],
			"hg38 high H3K27ac": r.hg38_hg38.H3K27ac[i],
			"hg38 high CTCF": r.hg38_hg38.CTCF[i]
		    });
		} );
		console.log(data.hg19);
		this.setState({data, isFetching: false, isError: false});
            }.bind(this)
        });
    }
    
    doRenderWrapper({data, actions}){
	if (!data) { return <div />; }
	
	let overview_row = (
            <div className="row">
                <div className="col-md-6">
	            <h3>hg38 lifted over to hg19</h3>
	            <Hg19Hg38Plot width={1000} height={600} data={data.hg19}
	              keys={[ {text: "original hg19 cREs", color: "#8884d8"},
		              {text: "lifted over hg38 cREs", color: "#d88488"} ]} />
                </div>
		<div className="col-md-6">
		    <h3>hg19 lifted over to hg38</h3>
		    <Hg19Hg38Plot width={1000} height={600} data={data.hg38}
	              keys={[ {text: "original hg38 cREs", color: "#8884d8"},
		              {text: "lifted over hg19 cREs", color: "#d88488"} ]} />
                </div>
            </div>
	);

	let ninestate_row = (
            <div className="row">
                <div className="col-md-6">
	            <h3>hg38 lifted over to hg19</h3>
	            <Hg19Hg38Plot width={1000} height={600} data={data.hg19}
	              keys={[ {text: "hg19 high DNase", color: "#06da93"},
			      {text: "hg19 high H3K4me3", color: "#ff0000"},
			      {text: "hg19 high H3K27ac", color: "#ffcd00"},
			      {text: "hg19 high CTCF", color: "#00b0f0"} ]} />
                </div>
		<div className="col-md-6">
		    <h3>hg19 lifted over to hg38</h3>
	            <Hg19Hg38Plot width={1000} height={600} data={data.hg38}
	              keys={[ {text: "hg38 high DNase", color: "#06da93"},
			      {text: "hg38 high H3K4me3", color: "#ff0000"},
			      {text: "hg38 high H3K27ac", color: "#ffcd00"},
			      {text: "hg38 high CTCF", color: "#00b0f0"} ]} />
                </div>
            </div>
	);
	
        return (
            <div className="container-fluid">
		{overview_row}
	        {ninestate_row}
            </div>
	);
	
    }

    render(){
        if (!this.state.data) { return loading(this.state); }
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
export default connect(mapStateToProps, mapDispatchToProps)(Hg38Tab);
