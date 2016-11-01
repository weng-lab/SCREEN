var React = require('react');

import TableWithCart, {table_connector} from './table_with_cart'
import ResultsTableColumns, {table_order} from '../config/results_table'

import create_table from '../helpers/create_table'

class ResultsApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var Retval = table_connector(TableWithCart);
	return <Retval store={this.props.store} />;
    }

    componentWillMount() {
	create_table(this.props.store.dispatch)(ResultsTableColumns, table_order);
    }
    
}
export default ResultsApp;

/*

RE_table.prototype.rowClick = function() {
    var _this = this;

    // deal w/ RE row click
    $(this.tableDom).on( 'click', 'td', function() {

	var i = $(this);
	var r = _this.result_from_tablerow_child(i);

	$("#redetails").html("");
	regelm_details_view.bind("redetails");

	showTab("tab_details");

	request_details(r);

	regelm_details_view.set_header(r.accession);
	regelm_details_view.peak_overlap_view.set_loading_text();
	regelm_details_view.tf_view.set_loading_text();
	regelm_details_view.histones_view.set_loading_text();
	regelm_details_view.snp_view.set_loading_text();
	regelm_details_view.genes_view.set_loading_text();
	regelm_details_view.re_view.set_loading_text();

	regelm_details_view.ranking_view.load_cell_lines(
	    regelm_details_base.reformat_ranks(r.ranks));

	$("#detailsLeftArrow").click(function(){
	    showTab("tab_results");
	});

	//_this.showPileup(r);
    });
}

RE_table.prototype.cartClick = function() {
    var _this = this;

    $(this.tableDom).on( 'click', 'img', function() {
	var i = $(this);
	var re = _this.result_from_tablerow_child(i);
	var show = cart.reClick(re);
	i.attr("src", cart_img(show, true));
    });
};

RE_table.prototype.showPileup = function(re){
    var div = document.getElementById("repileup");
    if(this.pileup){
	this.pileup.destroy();
    }

    //console.log(re);
    var pos = re.position;
    var halfWindow = 100;
    var midPt = pos.start + (pos.end - pos.start) / 2.0;
    var start = Math.max(1, midPt - halfWindow);
    var end = midPt + halfWindow;

    this.pileup = pileup.create(div, {
	range: {contig: pos.chrom, start: start, stop: end},
	tracks: [
	    {
		viz: pileup.viz.location(),
		name: 'Location'
	    },
	    {
		viz: pileup.viz.scale(),
		name: 'Scale'
	    },
	    {
		viz: pileup.viz.genome(),
		isReference: true,
		data: pileup.formats.twoBit({
		    url: 'http://www.biodalliance.org/datasets/hg19.2bit'
		}),
		name: 'Reference'
	    },
	    {
		viz: pileup.viz.genome(),
		data: pileup.formats.bigBed({
		    url: "http://bib5.umassmed.edu/~purcarom/cre/cre.bigBed"
		}),
		name: 'Candidate REs'
	    }
	]
    });
}
*/
