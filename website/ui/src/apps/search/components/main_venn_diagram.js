var React = require('react');
var $ = require('jquery');

import {connect} from 'react-redux'

import VennDiagram from '../../../common/components/venn_diagram'
import Slider from '../../../common/components/slider'
import {invalidate_venn} from '../helpers/invalidate_results'

import {SET_VENN_CELL_LINE} from '../reducers/root_reducer'

class MainVennDiagram extends React.Component {

    onchange() {
	if (this.props.onChange) {
	    this.props.onChange(this.refs.cell_line.value,
				this.refs.ranks.value,
				this.props.rank);
	}
    }

    onSlide(value) {
	if (this.props.onChange) {
	    this.props.onChange(this.props.cell_line,
				this.props.rank_type,
				value);
	}		     
    }
    
    constructor(props) {
	super(props);
	this.onchange = this.onchange.bind(this);
	this.onSlide = this.onSlide.bind(this);
    }
    
    render() {
	//console.log("./apps/search/components/venn.js this.props", this.props);
	return (
		<div ref="container">
		    <select ref="cell_line" onChange={this.onchange} defaultValue={this.props.cell_line}>
		        {this.props.cell_lines.map((cell_line) => (
	  		    <option value={cell_line.value} key={cell_line.value}>{cell_line.value}</option>
		        ))}
		    </select>
		    <select ref="ranks" onChange={this.onChange} defaultValue={this.props.rank_type}>
		        <option value="ranks.dnase.%s.rank">DNase</option>
  		        <option value="ranks.enhancer.%s.H3K27ac-Only.rank">Enhancer</option>
		        <option value="ranks.promoter.%s.H3K4me3-Only.rank">Promoter</option>
		        <option value="ranks.ctcf.%s.CTCF-Only.rank">CTCF</option>
		    </select>
		    <br/><br/>
		    <div style={{width: "50%"}}>
		        <Slider range={[0, 100000]} value={+this.props.rank} onChange={this.onSlide} />
		    </div>
 		<VennDiagram sets={this.props.sets} overlaps={this.props.overlaps} width="800px" height="500px" />
		</div>
	       );
    }
    
}
export default MainVennDiagram;

const props_map = (f) => (_state) => {
    //console.log(_state);
    var state = f(_state);
    return {
	cell_lines: state.cell_lines,
	sets: state.sets,
	overlaps: state.overlaps,
	rank: state.rank,
	rank_type: state.rank_type,
	cell_line: state.cell_line
    };
};

const dispatch_map = (f, store) => (_dispatch) => {
    var dispatch = f(_dispatch);
    return {
	onChange: (cell_line, rank_type, rank) => {dispatch(
	    invalidate_venn({cell_line, rank_type, rank}, store.getState())
	)}
    };
};

export const MainVennConnector = (store) => (pf, df) => connect(props_map(pf), dispatch_map(df, store));
