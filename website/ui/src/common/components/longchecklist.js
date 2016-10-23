import ResultsTable from './results_table'
import {ListItem} from './list'

var React = require('react');
var ReactDOM = require('react-dom');

import * as toggleswitch from './toggleswitch'
import {CHECKLIST_MATCH_ALL, CHECKLIST_MATCH_ANY} from './checklist'

class LongChecklistFacet extends React.Component {

    constructor(props) {
	super(props);
	this._td_handler = this._td_handler.bind(this);
	this._render_checkbox = this._render_checkbox.bind(this);
	this.modeChange = this.modeChange.bind(this);
    }

    _render_checkbox(d) {
	return (d
		? '<input type="checkbox" checked />'
		: '<input type="checkbox" />'
	       );
    }
    
    _td_handler(r, k) {
	if (this.props.onTdClick) this.props.onTdClick(k.key);
    }

    modeChange() {
	if (this.props.onModeChange) this.props.onModeChange(this.refs.mode.value);
    }
    
    componentDidMount() {
	$(this.refs.mode).toggleSwitch({
	    highlight: true,
	    width: 25,
	    change: this.modeChange
	});
    }
    
    render() {
	var checks = (!this.props.match_mode_enabled ? ""
		      : (<div><select ref="mode">
		            <option value={this.props.mode == CHECKLIST_MATCH_ALL} value={CHECKLIST_MATCH_ALL}>match all</option>
		            <option value={this.props.mode == CHECKLIST_MATCH_ANY} value={CHECKLIST_MATCH_ANY}>match any</option>
		         </select></div>
		        ));
	var cols = [
	    {
		title: "",
		data: "selected",
		render: this._render_checkbox
	    }, ...this.props.cols
	];
	return (<div>
		    {checks}
		    <ResultsTable cols={cols} data={this.props.data} order={this.props.order}
	                onTdClick={this._td_handler} bFilter={true} bLengthChange={false} />
		</div>
	       );
    }
    
}
export default LongChecklistFacet;
