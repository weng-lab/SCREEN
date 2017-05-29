var React = require('react');
var ReactDOM = require('react-dom');

export class ListItem extends React.Component {

    constructor(props) {
	super(props);
	this.onclick = this.onclick.bind(this);
    }

    onclick() {
	if (this.props.onclick) {
            this.props.onclick(this.props.value);
        }
    }

    render() {
	var classname, rtxt;
	if (this.props.selected) {
	    classname = "result_row_selected";
	    rtxt = <img src="/static/x.png" />;
	} else {
	    classname = "result_row";
	    rtxt = this.props.n;
	}

	let draggable = this.props.draggable ? this.props.draggable(
		<span><span className="glyphicon glyphicon-align-justify" />{" "}</span>
	) : null;

	return (<div>
		   <div className={classname} key={this.props.value}>
		      {draggable}
		      <a onClick={this.onclick}>
		          <span>{this.props.value}</span>
		          <span className="pull-right">{rtxt}</span>
		      </a>
		    </div>
		</div>
	       );
    }
}

class ListFacet extends React.Component {

    constructor(props) {
	super(props);
	this.click_handler = this.click_handler.bind(this);
    }

    click_handler(k) {
	if (k == this.props.selection) {
            k = null;
        }
	if (this.props.onchange) {
            this.props.onchange(k);
        }
    }

    render() {
	var click_handler = this.click_handler;
	var s = this.props.selection;
	var i = this.props.items;

	var items = this.props.items.map(function(kv) {
            var key = kv[0];
            var val = kv[1];
	    var selected = (key == s);

	    if(s == null || selected){
	        return <ListItem onclick={click_handler} value={key} key={key}
                n={val} selected={selected} />;
            } else {
                return <div />;
            }
	});
	return <div>{items}</div>;
    }
}
export default ListFacet;

/*
 * test function with dummy data
 */
(function() {

    if (!document.getElementById("list_facet")) return;

    var items = [
	{
	    value: "K562",
	    n: 10
	},
	{
	    value: "HeLa-S3",
	    n: 20
	},
	{
	    value: "GM12878",
	    n: 100
	}
    ];
    var selection = null;

    ReactDOM.render(<ListFacet items={items} selection={selection} />, document.getElementById("list_facet"));

})();
