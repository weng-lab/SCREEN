var React = require('react');
var $ = require('jquery');

const format_query = (key) => {
    return JSON.stringify({
	action: "helpkey",
	key,
	GlobalAssembly
    });
};

const help_query = (query, f_success, f_error) => {
    $.ajax({
        type: "POST",
        url: "/ajaxws",
        data: format_query(query),
        dataType: "json",
        contentType : "application/json",
        success: f_success,
	error: f_error
    });
};

class HelpIcon extends React.Component {

    constructor(props) {
	super(props);
	this._set_tt_pos = this._set_tt_pos.bind(this);
    }
    
    render() {
	return (<span ref="pspan" style={{fontSize: "14pt"}}>
		   <a ref="aicon"><span ref="icon" className="glyphicon glyphicon-info-sign" style={{marginLeft: "5px"}} aria-hidden="true" /></a>
		   <div className="popover bs-tether-element bs-tether-element-attached-middle bs-tether-element-attached-left bs-tether-target-attached-middle bs-tether-target-attached-right fade bs-tether-enabled in"
	 	      role="tooltip" ref="tt" style={{top: "0px", left: "0px", position: "absolute", display: "none" }}>
	             <h3 ref="tt_title" className="popover-title"></h3>
	             <div ref="tt_content" className="popover-content"></div>
		   </div>
		</span>);
    }

    _set_tt_pos() {
	var pos = $(this.refs.icon).position();
	pos.left += $(this.refs.icon).width() + 10;
	$(this.refs.tt).css(pos);
    }

    componentDidUpdate() {
	this._set_tt_pos();
    }
    
    componentDidMount() {
	var icon = this.refs.aicon;
	var error = (a, b, c) => {
	    console.log(a);
	};
	var success = (response, b, c) => {
	    this.refs.tt_content.innerHTML = response.summary.replace(/\n/g, "<br>").replace(/  /g, "");
	    this.refs.tt_title.innerText = response.title;
	    this._set_tt_pos();
	    $(this.refs.tt).css({
		display: "block"
	    });
	};
	$(icon).on("mouseover", () => {
	    help_query(this.props.helpkey, success, error);
	    $(icon).off()
		.on("mouseover", () => {this.refs.tt.style.display = "block";})
		.on("mouseout", () => {this.refs.tt.style.display = "none";});
	});
    }
    
}
export default HelpIcon;
