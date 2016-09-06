var React = require('react');
var ReactDOM = require('react-dom');

var CheckList = React.createClass({
  render: function() {
    var create_item = function(item) {
	return <span><input value={item} type="checkbox" /> {item}<br/></span>;
    };
    return <div>{this.props.items.map(create_item)}</div>;
  }
});

var ChecklistFacet = React.createClass({
  getInitialState: function() {
    return {items: [], text: ''};
  },
  onChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    if ($.trim(this.state.text) == "") return;
    var next_items = this.state.items.concat([this.state.text]);
    this.setState({items: next_items, text: ""});
  },
  render: function() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <input onChange={this.onChange} value={this.state.text} />
          <button>{'Add #' + (this.state.items.length + 1)}</button>
        </form>
	<CheckList items={this.state.items} />
      </div>
    );
  }
});

ReactDOM.render(<ChecklistFacet />, document.getElementById("checklist"));
