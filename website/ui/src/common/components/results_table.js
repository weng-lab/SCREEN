var React = require('react');
var $ = require('jquery');
var _dt = require('datatables.net');
require('datatables.net-bs');

class ResultsTable extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div style={{"width": "100%",
			     "display": (this.props.loading ? "none" : "block")}}>
		    <table ref="root" style={{width: "100%"}} />
		</div>);
    }

    componentDidUpdate() {
	this._datatable.clear().rows.add(this.props.data).draw();
    }
    
    componentDidMount() {
	var backButton = this.props.backButton;
	var onTdClick = this.props.onTdClick;
	var onButtonClick = this.props.onButtonClick;
	var _datatable = $(this.refs.root).DataTable({
	    data: this.props.data,
            columns: this.props.cols,
            order: this.props.order,
	    paging: this.props.paging,
	    bInfo: this.props.info,
	    bFilter: this.props.bFilter,
	    bLengthChange: this.props.bLengthChange,
	    language: { emptyTable : this.props.emptyText,
		       	paginate: { previous: "&lt", next : "&gt" }},
	    pageLength: this.props.pageLength,
	    dom: '<"top"f>t<"bottom"p><"clear">'
	});
	$(this.refs.root).on("click", "td", function() {
	    if (onTdClick) {
		onTdClick(this,
			  _datatable.row($(this).parents('tr')).data());
	    }
	}).removeClass('display').addClass('table table-condensed table-hover');
	
	this._datatable = _datatable;
    }
}

export default ResultsTable;
