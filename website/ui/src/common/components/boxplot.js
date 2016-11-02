const React = require('react');

class Boxplot extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<div>
  		<div ref="loading" className="loading" style={{display: (this.props.loading ? "block" : "none")}}>
		Loading...
		</div>
		<div ref="container" style={{display: (this.props.loading ? "none" : "block")}} />
		</div>);
	
    }

    componentDidUpdate() {

	if (!this.refs.container.style.display == "block") return;

	$(this.refs.container).empty();
	
	var data = this.props.data;
	if (0 == data.length) {
	    return;
	}
	var mmax = this.props.mmax;
	
	nv.addGraph(function() {
	    var chart = nv.models.boxPlotChart()
		.x(function(d) { return d.label })
		.y(function(d) { return d.values.Q3 })
		.maxBoxWidth(75) // prevent boxes from being incredibly wide
		.yDomain([0, mmax ])
            ;
	    chart.xAxis.rotateLabels(-25);
	    chart.yAxis.axisLabel("log10(tpm + 0.01)")
	    d3.select(this.refs.container).append("svg")
		.datum(data)
		.call(chart);
	    nv.utils.windowResize(chart.update);
	    return chart;
	});	
    }
}

export default Boxplot;
