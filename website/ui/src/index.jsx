import React from 'react';
import ReactDOM from 'react-dom';

var Search = React.createClass({
    render: function() {
	return (<span>Hi</span>
	);
    }
});

ReactDOM.render(
    <Search />,
    document.getElementById('app')
);
