import React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import * as Actions from '../actions/main_actions';
import LargeHorizontalBars from '../components/large_horizontal_bars'

class ExpressionBoxplot extends React.Component {
    componentDidMount() {
	this.componentDidUpdate();
    }

    componentDidUpdate() {
	var width = 1200;
	var barheight = "15";
	//console.log("ExpressionBoxplot componentDidUpdate");
	render(React.createElement(LargeHorizontalBars,
                                   {...this.props.data, width, barheight}),
	       this.refs.bargraph);
    }

    _bb() {
	let gclick = this.gclick.bind(this);
	return <button type="button" className="btn btn-default btn-xs" onClick={() => {gclick("UCSC");}}>UCSC</button>;
    }

    gclick(name) {
	this.props.actions.showGenomeBrowser({
	    title: this.props.gene,
	    start: this.props.data.coords.start,
	    len: this.props.data.coords.len,
	    chrom: this.props.data.coords.chrom
	}, name, "gene");
    }
    
    render() {
	return (
            <div>
 	        <span style={{fontSize: "18pt"}}>
                <em>{this.props.gene}</em> {this._bb()} <span ref="help_icon" />
                </span>
		<div style={{"width": "100%"}} ref="bargraph" />
	    </div>);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(ExpressionBoxplot);
