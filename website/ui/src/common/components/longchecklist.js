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
	this.modeToggle = this.modeToggle.bind(this);
    }

    _render_checkbox(d) {
	return (d
		? '<input type="checkbox" checked />'
		: '<input type="checkbox" />'
	       );
    }

    _td_handler(r, k) {
	if (this.props.onTdClick) {
	    this.props.onTdClick(k.key);
	}
    }

    modeToggle() {
	var n_value = (this.props.mode == CHECKLIST_MATCH_ANY
		       ? CHECKLIST_MATCH_ALL : CHECKLIST_MATCH_ANY);
	if (this.props.onModeChange) {
	    this.props.onModeChange(n_value);
	}
    }

    render() {
	var mode = (this.props.mode ? this.props.mode : CHECKLIST_MATCH_ALL);
	var checks = "";
	if(this.props.match_mode_enabled){
	    checks = (<div>
		      <input type="radio" defaultChecked={mode == CHECKLIST_MATCH_ALL ? true : false}
		      onClick={this.modeToggle} />match all&nbsp;
		      <input type="radio" defaultChecked={mode == CHECKLIST_MATCH_ANY ? true : false}
		      onClick={this.modeToggle} />match any
		      </div>);
	}
	var cols = [
	    {
		title: "",
		data: "selected",
		render: this._render_checkbox
	    }, ...this.props.cols
	];
	var paging = this.props.data.length < 10 ? false : true;
	return (<div>
		{checks}
		<ResultsTable cols={cols}
                data={this.props.data}
                order={this.props.order}
	        onTdClick={this._td_handler}
                bFilter={true}
                bLengthChange={false}
		paging={paging}
		/>
		</div>
	       );
    }

}
export default LongChecklistFacet;
