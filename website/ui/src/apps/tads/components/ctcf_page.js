import React from 'react'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import $ from 'jquery';

import * as Actions from '../actions/main_actions';

import loading from '../../../common/components/loading'

/*global GlobalAssembly */
/*eslint no-undef: "error"*/

class CTCFPage extends React.Component{
    
    constructor(props) {
        super(props);
        this.state = {
	    jq: null, selectChr: false, selectBiosample: false,
	    isFetching: true, isError: false, isDone: false
        };
        this.doRenderWrapper = this.doRenderWrapper.bind(this);
        this.loadChr = this.loadChr.bind(this);
    }

    componentDidMount() {
        this.loadChr(this.props);
    }

    componentWillReceiveProps(nextProps) {
	this.loadChr(nextProps);
    }

    loadChr({ chr, biosample, actions }) {
	
        if (null === chr) {
            this.setState({ selectChr: true });
            return;
        }
	if (null === biosample) {
	    this.setState({ selectBiosample: true });
	    return;
	}
	
	actions.setloading();
        var jq = JSON.stringify({ GlobalAssembly, chr, biosample });
        if (this.state.jq === jq) { return; }
        this.setState({ jq, isFetching: true, selectChr: false, selectBiosample: false, isDone: false });
	
	$.ajax({
	    url: "/dataws/ctcfdistr",
	    type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: ( (jqxhr, status, error) => {
                console.log("ERROR: CTCF distribution failed to load");
                this.setState({
		    data: null, jq,
                    isDone: true, isFetching: false, isError: true
		});
            } ),
            success: ( r => {
                this.setState({
		    data: r["data"], jq, isDone: true,
                    isFetching: false, isError: false
		});
            } )
	});
	
    }

    doRenderWrapper() {
	if (this.state.selectChr || this.state.selectBiosample) {
	    return (
		<div><strong>Please select a chromosome and biosample at left</strong></div>
	    );
	} else if (this.state.isDone && !this.state.isFetching) {
	    let rows = [], rowheight = 200, rowwidth = 1500;
	    for (let i = 0; i <= this.state.data.results.length / rowwidth; ++i) {
		let slice = this.state.data.results.slice(i * rowwidth, (i + 1) * rowwidth);
		let range = [Math.min(...slice), Math.max(...slice)];
		let scale = rowheight / (range[1] - range[0]);
		let _y = y => (-y + range[1]) * scale;
		rows.push(<g transform={"translate(0," + (rowheight * i) + ")"}>
			      {slice.map( (x, i) => (
		                  <rect x={i} y={x < 0 ? _y(0) : _y(x)} fill="#000" width="1"
				    height={x < 0 ? _y(x) - _y(0) : _y(0) - _y(x)} />
			      ) )}
			  </g>);
	    }
	    let tads = [];
	    console.log(this.state.data.tads);
	    this.state.data.tads.map(t => {
		tads.push(<rect x={t[0] % rowwidth} y={rowheight * (Math.floor(t[0] / rowwidth) + 1) - 5} fill="#f00" width="1" height="5" />);
		tads.push(<rect x={t[1] % rowwidth} y={rowheight * (Math.floor(t[1] / rowwidth) + 1) - 5} fill="#f00" width="1" height="5" />);
		if (Math.floor(t[0] / rowwidth) === Math.floor(t[1] / rowwidth)) {
		    tads.push(<rect x={t[0] % rowwidth} y={rowheight * (Math.floor(t[0] / rowwidth) + 1)} fill="#00f" width={t[1] % rowwidth - t[0] % rowwidth} height="1" />);
		    return null;
		}
		tads.push([<rect x={t[0] % rowwidth} y={rowheight * (Math.floor(t[0] / rowwidth) + 1)} fill="#00f" width={rowwidth - (t[0] % rowwidth)} height="1" />]);
		for (let i = Math.floor(t[0] / rowwidth) + 1; i < Math.floor(t[1] / rowwidth); ++i) {
		    tads.push(<rect x={0} y={rowheight * (i + 1)} fill="#00f" width={rowwidth} height="1" />);
		}
		tads.push(<rect x={0} y={rowheight * (Math.floor(t[1] / rowwidth) + 1)} fill="#00f" width={t[1] % rowwidth} height="1" />);
		return null;
	    });
            return (
		<div>
		    <svg width={rowwidth} height={rowheight * (this.state.data.results.length / rowwidth + 1)}>{rows}{tads}</svg>
                </div>
	    );
        }
        return loading(this.state);
    }

    render(){
        return (
            <div style={{"width": "100%"}}>
                {this.doRenderWrapper()}
            </div>
	);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(CTCFPage);
