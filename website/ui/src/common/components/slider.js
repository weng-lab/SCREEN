var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var __jui = require('jquery-ui-bundle');

class Slider extends React.Component {
    
    constructor(props) {
	super(props);
	this.onChange = this.onChange.bind(this);
	this.update_selection = this.update_selection.bind(this);
    }
    
    render() {
	return (<div>
  		   <div ref="container" />
		   <div style={{textAlign: "center", paddingTop: "10px"}}>
		      <input ref="txval" type="text" value={this.props.value} onChange={this.onChange}
	 	         style={{textAlign: "center", width: "20%", position: "relative", fontWeight: "bold"}} />
		   </div>
		</div>
	       );
    }
    
    componentDidMount() {
	this.componentDidUpdate();
    }
    
    componentDidUpdate() {
	this._slider = this.create_slider(this.refs.container);
    }

    onChange() {
	if (this.props.onChange) this.props.onChange(+this.refs.txval.value);
    }

    update_selection() {
	this.refs.txval.value = $(this.refs.container).slider("values", 0);
    }
    
    create_slider(dcontainer) {
	var container = $(dcontainer);
	container.empty().slider({
	    min: this.props.range[0],
	    max: this.props.range[1],
	    values: [this.props.value],
	    range: false,
	    slide: this.update_selection,
	    stop: this.onChange
	});
	return container;
    }
    
}
export default Slider;
