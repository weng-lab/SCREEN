import React from 'react'

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import HelpIcon from '../../../common/components/help_icon'
import * as Render from '../../../common/renders'

import * as Actions from '../actions/main_actions';

class Rampage extends React.Component {
    constructor(props) {
	super(props);
        this.key = "rampage";
        this.state = {transcript: props.keysAndData.sortedTranscripts[0],
                      sortOrder: "byValue",
                      datascale: "counts"};
    	this.handleKeyPress = this.handleKeyPress.bind(this);
    	this.transcriptUp = this.transcriptUp.bind(this);
    	this.transcriptDown = this.transcriptDown.bind(this);
        this.d3Render = this.d3Render.bind(this);
    }

    componentWillMount() {
        document.addEventListener("keydown", this.handleKeyPress);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyPress);
    }

    _bb(transcript) {
	let gclick = this.gclick.bind(this);
	return <button type="button" className="btn btn-default btn-xs" onClick={() => {gclick("UCSC", transcript);}}>UCSC</button>;
    }

    gclick(name, transcript) {
	this.props.actions.showGenomeBrowser({
	    title: transcript.transcript,
	    start: transcript.start,
	    len: transcript.stop - transcript.start,
	    chrom: transcript.chrom
	}, name, "rampagetranscript");
    }
    
    transcriptUp() {
        let sortedTranscripts = this.props.keysAndData.sortedTranscripts;
        let curT = this.state.transcript;
        let idx = sortedTranscripts.indexOf(curT);
        idx -= 1;
        if(idx < 0){
            idx = sortedTranscripts.length - 1;
        }
        this.setState({transcript: sortedTranscripts[idx]})
    }

    transcriptDown() {
        let sortedTranscripts = this.props.keysAndData.sortedTranscripts;
        let curT = this.state.transcript;
        let idx = sortedTranscripts.indexOf(curT);
        idx += 1;
        if(idx >= sortedTranscripts.length){
            idx = 0;
        }
        this.setState({transcript: sortedTranscripts[idx]})
    }

    handleKeyPress = (event) => {
	if("details" === this.props.maintabs_active){
            if(this.key !== this.props.re_details_tab_active){
		return;
	    }
	}

	if(event.key == 'n'){
            this.transcriptUp();
	} else if(event.key == 'm'){
            this.transcriptDown();
	}
    }

    render() {
        let sortedTranscripts = this.props.keysAndData.sortedTranscripts;
        let data = this.props.keysAndData.tsss;
        let gene = this.props.keysAndData.gene;

        let tsses = sortedTranscripts.map((tss) => { return data[tss]; });
        let selectTsses = sortedTranscripts.map((tss) => {
            return (<option value={tss}>{tss}</option>); });

        let transcript = data[this.state.transcript];

        let title = (
            <div className="container-fluid" style={{"width": "100%"}} >
                <div className="row">
                    <div className="col-md-8">
                        <span className={"rampageGeneName"}>
			    <h4>
				TSS Activity Profiles by RAMPAGE
				<HelpIcon helpkey={"RAMPAGEOverview"} />
			    </h4>
                            <h2>
				<em>{gene.name}</em>
			    </h2>
                            {gene.ensemblid_ver}
			    {"   ("}{Render.numWithCommas(gene.distance)}
			    {" bases from cRE)"}
                        </span>
                    </div>
                </div>
            </div>);

        let transcriptControls = (
	    <div className="col-md-6">
                {"Transcript: "}
                <span>
		    <select value={this.state.transcript}
		            onChange={(s) => {
                                    this.setState({transcript: s.target.value});
                                }}>
		        {selectTsses}
		    </select>
                    <span className="glyphicon glyphicon-arrow-up"
                          aria-hidden="true"
                          onClick={this.transcriptUp}>
                    </span>
                    <span className="glyphicon glyphicon-arrow-down"
                          aria-hidden="true"
                          onClick={this.transcriptDown}>
                    </span>
		    {this._bb(transcript)}
                </span>
                <div className="rampageCoord">
                    {transcript["chrom"]}:
                    {transcript["start"]}-
                    {transcript["stop"]}
                    {"  ("}{transcript["strand"]}
                    {") "}{transcript["geneinfo"]}
                </div>
            </div>);

        let sortControls = (
	    <div className="col-md-3">
                {"Choose sort order: "}
	        <select value={this.state.sortOtder}
		        onChange={(s) => {
                                this.setState({sortOrder: s.target.value}); }}>
		    <option value="byValue">by value</option>
		    <option value="byTissue">by tissue</option>
		    <option value="byTissueMax">by tissue max</option>
	        </select>
            </div>);

	return (
            <div>
                {title}
                <br />
                <div className="container">
		    <div className="row">
                        {transcriptControls}
                        {sortControls}
		    </div>
		</div>

                <span className="geTissueOfOrigin">Tissue of origin</span>
		<div ref="container" style={{width: this.props.width + "px"}}>
                </div>
	    </div>);
    }

    componentDidMount() {
        this.d3Render();
    }

    componentDidUpdate() {
        this.d3Render();
    }

    d3Render(){
	if("details" === this.props.maintabs_active){
            if("rampage" != this.props.re_details_tab_active){
		return;
	    }
	}

	$(this.refs.container).empty();

        let allData = this.props.keysAndData.tsss;
        let transcript = allData[this.state.transcript];

        var itemsByID = transcript.itemsByID;
	var items = transcript.itemsGrouped[this.state.sortOrder];

	var sorted_keys = Object.keys(items).sort(function (a, b) {
	    // from http://stackoverflow.com/a/9645447
	    return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	var rank_f = (rid) => {
	    var key = this.state.datascale;
	    var val = itemsByID[rid][key];
	    return val;
	};

	var subName_f = (rid) => {
	    let t = itemsByID[rid];
	    return t["biosample_term_name"] + ' (' + t.strand + ')';
	}

	var grid = d3.range(items.length).map((i) => {
	    return {'x1': 0, 'y1': 0, 'x2': 0, 'y2': items.length};
	});

	var leftOffset = 200;
	var widthFactor = 0.5;
	var total_items = 0;
	var labeloffsets = [];
	var yoffsets = {};
	var cmax = 0;
	var d;

	for (var i in sorted_keys) {
	    var key = sorted_keys[i];
	    yoffsets[key] = total_items;
	    labeloffsets.push(total_items + (
		items[key].items.length / 2.0) + 0.25);
	    total_items += items[key].items.length;
	    d = d3.max(items[key].items, rank_f);
	    if (d > cmax) {
                cmax = d;
            }
	}

	var barheight = +this.props.barheight;
	var height = barheight * total_items + 10;

	var xscale = d3.scale.linear()
	    .domain([0, cmax])
	    .range([0, +this.props.width * widthFactor]);

	var yscale = d3.scale.linear()
	    .domain([0, total_items])
	    .range([0, total_items * barheight]);

	var canvas = d3.select(this.refs.container)
	    .append('svg')
	    .attr({'width': +this.props.width + 200, 'height': height})
	    .append('g')
	    .attr({'width': +this.props.width, 'height': height - 10})
	    .attr('transform', 'translate(0,10)');

	var yAxis = d3.svg.axis()
	    .orient('left')
	    .scale(yscale)
	    .tickSize(2)
	    .tickFormat("")
	    .tickValues(d3.range(total_items + 2));

	var y_xis = canvas.append('g')
	    .attr("transform", "translate(" + leftOffset + ",0)")
	    .attr('id','yaxis')
	    .call(yAxis);

	var toolTip = d3.tip()
	    .attr('class', 'd3-tip')
	    .offset([0, 0])
	    .html(function(rid) {
                let d = itemsByID[rid];
		return "cel type: <strong>" + d["biosample_term_name"] + "</strong>"+
		    "<div>tissue: " + d["tissue"] + "</div>" +
		    "<div>" + 'experiment: <a href="https://encodeproject.org/experiments/' + d["expid"] + '" target+"_blank">' + d["expid"] + "</a>" + "</div>" +
		    "<div>" + 'file: <a href="https://encodeproject.org/' + d["fileid"] + '" target+"_blank">' + d["fileid"] + "</a>" + "</div>"
		;
	    })

	for (var i in sorted_keys) {
	    var key = sorted_keys[i];
	    var itemset = items[key];
	    var chart = canvas.append('g')
		.attr("transform", "translate(" + leftOffset + "," + (yoffsets[key] * barheight) + ")");
	    chart.selectAll('rect')
		.data(itemset.items)
		.enter()
		.append('rect')
		.attr('height', barheight)
		.attr({'x': 0, 'y': (d, i) => (+yscale(i))})
		.style('fill', (d, i) => (itemset.color))
		.attr("stroke-width", 1)
		.attr("stroke", "white")
		.attr('width', (d) => {return xscale(rank_f(d))})
	    	.on("click", function(rid) {
		    window.open("http://encodeproject.org/" +
                                itemsByID[rid]["expid"])
		});
	    if (barheight * 0.75 < 8) continue; // skip drawing text smaller than 12px
	    var transitext = chart.selectAll('text')
		.data(itemset.items)
		.enter()
		.append('text')
		.attr({'x': (d) => (xscale(rank_f(d)) + 5),
		       'y': (d, i) => (+yscale(i) + barheight * 0.75)})
		.text((rid) => (rank_f(rid) + " " + subName_f(rid) ))
		.style({'fill': '#000', 'font-size': (barheight * 0.75) + 'px'})
		.on("click", function(rid) {
		    window.open("http://encodeproject.org/" +
                                itemsByID[rid]["expid"])
		});
	}
	var ylabels = canvas.append('g')
	    .attr("transform", "translate(0,0)")
	    .selectAll('text')
	    .data(sorted_keys)
	    .enter()
	    .append('text')
	    .attr({'x': 0, 'y': (d, i) => (+yscale(labeloffsets[i]))})
	    .attr("transform", "translate(" + (leftOffset - 10) + ",0)")
	    .text((d) => (items[d].tissue))
	    .style({'fill': '#000',
		    'font-size': (+barheight < 8 ? 8 : barheight) + "px",
		    "text-anchor": "end"});

	d3.selectAll("rect").call(toolTip);
	d3.selectAll("rect")
	    .on('mouseover', toolTip.show)
	    .on('mouseout', toolTip.hide);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(Rampage);
