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
    
    _td_handler(r, k) {
	if (this.props.onTdClick) this.props.onTdClick(k.value);
    }

    _clear() {
	if (this.props.onTdClick) this.props.onTdClick(null);
	$(this.refs.container).empty();
    }
    
    render() {
	var table_display = (this.props.selection == null ? "block" : "none");
	var sdisplay = (this.props.selection == null ? "none" : "block");
	var friendly_selection = (this.props.selection == null ? null : this.props.selection.replace(/_/g, " "));
	return (<div>
		    <div style={{display: table_display}}>
		        <ResultsTable cols={this.props.cols} data={this.props.data} order={this.props.order}
	                    onTdClick={this._td_handler} bFilter={true} bLengthChange={false} />
		    </div>
		    <div style={{display: sdisplay}}>
		        <ListItem value={friendly_selection} selected="true" n="0"
		            onclick={this._clear} />
		    </div>
		</div>);
    }
    
}
export default LongListFacet;
