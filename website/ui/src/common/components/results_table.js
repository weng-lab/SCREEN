import React from 'react'

var $ = require('jquery');
var _dt = require('datatables.net')
require( 'datatables.net-bs' )
require( 'datatables.net-buttons' )
require( 'datatables.net-buttons-bs' )
require( 'datatables.net-buttons/js/buttons.colVis.js' )
require( 'datatables.net-buttons/js/buttons.html5.js' )
require( 'datatables.net-buttons/js/buttons.flash.js' )
require( 'datatables.net-buttons/js/buttons.print.js' )

class ResultsTable extends React.Component {
    constructor(props) {
	super(props);
        //console.log("making ResultsTable");
    }

    render() {
	return (<div ref={"container"} style={{"width": "100%"}}>
		    <table ref="root" style={{width: "100%"}} />
		</div>);
    }

    componentDidUpdate() {
	this._datatable.clear().rows.add(this.props.data).draw();
        if (this.props.cvisible) {
	    Object.keys(this.props.cvisible).map((k) => {
		this._datatable.column(k + ":name").visible(this.props.cvisible[k]);
	    });
	}
    }

    componentDidMount() {
	let dom = this.props.dom || '<"top"f>t<B"bottom"p><"clear">';
	var _datatable = $(this.refs.root).DataTable({
	    buttons: ['csv'],
	    data: this.props.data,
            columns: this.props.cols,
	    buttons: ['csvHtml5'],
            order: this.props.order,
	    paging: this.props.paging,
	    bInfo: this.props.info,
	    bFilter: this.props.bFilter,
	    bLengthChange: this.props.bLengthChange,
	    language: { emptyTable : this.props.emptyText,
		       	paginate: { previous: "&lt", next : "&gt" }},
	    pageLength: this.props.pageLength,
	    dom,
	    columnDefs: this.props.columnDefs,
            createdRow: this.props.createdRow
	});

	var onTdClick = this.props.onTdClick;
	var onButtonClick = this.props.onButtonClick;
	var onMouseOver = this.props.onMouseOver;

	$(this.refs.root)
	    .on("click", "td", function() {
		if (onTdClick) {
		    onTdClick(this,
			      _datatable.row($(this).parents('tr')).data());
		}
	    })
	    .on("click", "button", function() {
		if (onButtonClick) {
		    onButtonClick($(this).html(),
				  _datatable.row($(this).parents('tr')).data());
		}
	    })
	    .on("mouseover", "td", function() {
		if(!onMouseOver){
		    return false;
		}
                onMouseOver($(this));
	    })
	    .removeClass('display')
	    .addClass('table table-condensed table-hover');

	this._datatable = _datatable;
    }
}

export default ResultsTable;
