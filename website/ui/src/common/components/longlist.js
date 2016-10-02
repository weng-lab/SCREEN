import ResultsTable from './results_table'
import {ListItem} from './list'

var React = require('react');
var ReactDOM = require('react-dom');

class LongListFacet extends React.Component {

    constructor(props) {
	super(props);
	this._td_handler = this._td_handler.bind(this);
	this._clear = this._clear.bind(this);
    }
    
    _td_handler(k) {
	if (this.props.onTdClick) this.props.onTdClick(k._source.value);
    }

    _clear() {
	if (this.props.onTdClick) this.props.onTdClick(null);
    }
    
    render() {
	if (this.props.selection == null)
	    return (<ResultsTable cols={this.props.cols} data={this.props.data} order={this.props.order}
	                onTdClick={this._td_handler} />);
	return (<ListItem value={this.props.selection} selected="true" n="0"
		    onclick={this._clear} />);
    }
    
}
export default LongListFacet;
