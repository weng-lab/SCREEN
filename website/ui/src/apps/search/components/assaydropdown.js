import React from 'react'

class AssayDropdown extends React.Component {

    constructor(props) {
	super(props);
	this._onchange.bind(this);
    }

    _onchange() {
	if (this.props.onChange) this.props.onChange(this.refs.mainselect.value);
    }
    
    render() {
	return (<select onChange={this._onchange} ref="mainselect">
		<option value="DNase">DNase</option>
		<option value="H3K4me3">H3K4me3 Only</option>
		<option value="Promoter">H3K4me3 and DNase</option>
		<option value="H3K27ac">H3K27ac Only</option>
		<option value="Enhancer">H3K27ac and DNase</option>
		<option value="CTCF">CTCF Only</option>
		<option value="Insulator">CTCF and DNase</option>
		</select>);
    }

}
export default AssayDropdown;
