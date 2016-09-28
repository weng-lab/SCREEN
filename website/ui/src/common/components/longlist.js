import ResultsTable from './results-table'
import ListItem from './list'

var React = require('react');
var ReactDOM = require('react-dom');

class LongListFacet extends React.Component {

    constructor(props) {
	super(props);
	this.click_handler = this.click_handler.bind(this);
    }
    
    _td_handler(k) {
	if (this.props.onTdClick) this.props.onTdClick(k);
    }

    _clear() {
	if (this.props.onTdClick) this.props.onTdClick(null);
    }
    
    render() {
	return (this.props.selection == null
		? <ResultsTable cols={this.props.cols} data={data} order={this.props.order}
	              onTdClick={this._td_handler} />
		: <ListItem value={this.props._source.cell_line} n={this.props.selection._source.n} selected=true
		      onclick={this._clear} />
	       );
    }
    
}
export default LongListFacet;
