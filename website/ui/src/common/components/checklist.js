var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var __jui = require('jquery-ui-bundle');

import AutocompleteTextbox from './autocomplete'

$.fn.toggleSwitch = function (params) {

    var defaults = {
        highlight: true,
        width: 25,
        change: null,
        stop: null
    };

    var options = $.extend({}, defaults, params);

    return $(this).each(function (i, item) {
        generateToggle(item);
    });

    function generateToggle(selectObj) {

        // create containing element
        var $contain = $("<div />").addClass("ui-toggle-switch");

        // generate labels
        $(selectObj).find("option").each(function (i, item) {
            $contain.append("<label>" + $(item).text() + "</label>");
        }).end().addClass("ui-toggle-switch");

        // generate slider with established options
        var $slider = $("<div />").slider({
            min: 0,
            max: 100,
            animate: "fast",
            change: options.change,
            stop: function (e, ui) {
                var roundedVal = Math.round(ui.value / 100);
                var self = this;
                window.setTimeout(function () {
                    toggleValue(self.parentNode, roundedVal);
                }, 11);

                if(typeof options.stop === 'function') {
                    options.stop.call(this, e, roundedVal);
                }
            },
            range: (options.highlight && !$(selectObj).data("hideHighlight")) ? "max" : null
        }).width(options.width);

        // put slider in the middle
        $slider.insertAfter(
            $contain.children().eq(0)
        );

        // bind interaction
        $contain.on("click", "label", function () {
            if ($(this).hasClass("ui-state-active")) {
                return;
            }
            var labelIndex = ($(this).is(":first-child")) ? 0 : 1;
            toggleValue(this.parentNode, labelIndex);
        });

        function toggleValue(slideContain, index) {
            var $slideContain = $(slideContain), $parent = $slideContain.parent();
            $slideContain.find("label").eq(index).addClass("ui-state-active").siblings("label").removeClass("ui-state-active");
            $parent.find("option").prop("selected", false).eq(index).prop("selected", true);
            $parent.find("select").trigger("change");
            $slideContain.find(".ui-slider").slider("value", index * 100);
        }

        // initialise selected option
        $contain.find("label").eq(selectObj.selectedIndex).click();

        // add to DOM
        $(selectObj).parent().append($contain);

    }
};

export const CHECKLIST_MATCH_ALL = 'CHECKLIST_MATCH_ALL';
export const CHECKLIST_MATCH_ANY = 'CHECKLIST_MATCH_ANY';

class CheckBox extends React.Component {

    constructor(props) {
	super(props);
	this.change_handler = this.change_handler.bind(this);
    }
    
    change_handler() {
	if (this.props.onchange) this.props.onchange(this.props.k);
    }
    
    render() {
	return (this.props.checked
		? <div><input checked ref="box" type="checkbox" onChange={this.change_handler} /> {this.props.value}</div>
		: <div><input ref="box" type="checkbox" onChange={this.change_handler} /> {this.props.value}</div>);
    }

}

class ChecklistFacet extends React.Component {
    
    constructor(props) {
	super(props);

	var mode = (this.props.mode ? this.props.mode : CHECKLIST_MATCH_ALL);
	
	this.state = Object.assign({
	    items: [],
	    text: "",
	    mode
	});
	
	this.onChange = this.onChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
	this.check_handler = this.check_handler.bind(this);
	this.modeChange = this.modeChange.bind(this);
    }
    
    onChange(e) {
	this.setState({text: e.target.value});
    }

    modeChange() {
	//console.log(this.refs.mode.value);
	if (this.props.onModeChange) this.props.onModeChange(this.refs.mode.value);
    }
    
    handleSubmit(e) {
	e.preventDefault();
	if ($.trim(this.state.text) == "") return;
	var next_items = [...this.state.items, {
	    value: this.state.text,
	    checked: true
	}];
	this.setState({items: next_items, text: ""});
	if (this.props.onchange) this.props.onchange(next_items);
    }
    
    check_handler(key) {
	var next_items = [...this.state.items];
	next_items[key].checked = !next_items[key].checked;
	this.setState({items: next_items});
	if (this.props.onchange) this.props.onchange(next_items);
    }

    componentDidMount() {
	$(this.refs.mode).toggleSwitch({
	    highlight: true,
	    width: 25,
	    change: this.modeChange
	});
    }
    
    render() {

	var items = this.state.items;
	var onchange = this.check_handler;
	
	var create_item = function(key) {
	    var item = items[key];
	    return <CheckBox key={key} k={key} value={item.value} onchange={onchange} checked={item.checked} />;
	};
	
	var checks = (!this.props.match_mode_enabled ? ""
		      : (<div><select ref="mode">
		            <option selected={this.props.mode == CHECKLIST_MATCH_ALL} value={CHECKLIST_MATCH_ALL}>match all</option>
		            <option selected={this.props.mode == CHECKLIST_MATCH_ANY} value={CHECKLIST_MATCH_ANY}>match any</option>
		         </select></div>
		        ));

	//console.log("!");
	//console.log(this.props.autocomplete_source);
	//console.log("!");
	
	return (<div>
		  <div style={{"fontWeight": "bold"}}>{this.props.title}</div>
		  {checks}
		  <form onSubmit={this.handleSubmit}>
 		    <AutocompleteTextbox source={this.props.autocomplete_source} onChange={this.onChange} value={this.state.text} />
		    <button>add</button>
		  </form>
		  {Object.keys(this.state.items).map(create_item)}
		</div>
	       );
	
    }
    
}
export default ChecklistFacet;
