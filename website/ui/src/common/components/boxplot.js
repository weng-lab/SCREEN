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

    componentDidMount(){
	this.componentDidUpdate();
    }

    componentDidUpdate() {
	console.log("boxplot componentDidUpdate");
	$(this.refs.container).empty();

	var data = GlobalData; //this.props.data;
	if (0 && 0 == data.length) {
	    return;
	}
	var mmax = GlobalMmax; //this.props.mmax;
	
	nv.addGraph(function() {
	    var chart = nv.models.boxPlotChart()
		.x(function(d) { return d.label })
		.y(function(d) { return d.values.Q3 })
		.maxBoxWidth(75) // prevent boxes from being incredibly wide
		.yDomain([0, mmax ])
            ;
	    chart.xAxis.rotateLabels(-25);
	    chart.yAxis.axisLabel("log10(tpm + 0.01)");
	    console.log(this.refs);
	    d3.select('#chart1 svg')
		.datum(data)
		.call(chart);
	    nv.utils.windowResize(chart.update);
	    return chart;
	});	
    }
}

export default Boxplot;
