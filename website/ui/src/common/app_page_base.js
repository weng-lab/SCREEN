import React from 'react';

class AppPageBase extends React.Component {
    constructor(props, url, innerClass) {
	super(props);
	this.url = url;
	this.innerClass = innerClass;
	this.state = { isFetching: false, isFetchingGlobals: false, isError: false };
    }

    componentDidMount(){
	this.search(this.props);
	this.globals(this.props);
    }

    componentWillReceiveProps(nextProps){
	this.search(nextProps);
	this.globals(nextProps);
    }
    
    search(nextProps){
	if("search" in this.state){
	    return;
	}
	if(this.state.isFetching){
	    return;
	}
	this.setState({isFetching: true});
	fetch(this.url,
	      {
		  headers: {
		      'Accept': 'application/json',
		      'Content-Type': 'application/json'
		  },
		  method: "POST",
		  body: JSON.stringify(nextProps.location.query)
	      })
	    .then((response) => (response.json()))
	    .then((r) => {
		this.setState({search: r, isFetching: false, isError: false});
	    })
	    .catch((err) => {
		console.log("err searching ");
		console.log(nextProps.location.query);
		console.log(err);
                this.setState({isFetching: false, isError: true});
	    });
    }
    
    globals(nextProps){
	if("globals" in this.state){
	    return;
	}
	if(this.state.isFetchingGlobals){
	    return;
	}
	this.setState({isFetchingGlobals: true});
	fetch("/globalData/0/" + nextProps.location.query.assembly)
	    .then((response) => (response.json()))
	    .then((r) => {
		this.setState({globals: r, isFetchingGlobals: false, isError: false});
	    })
	    .catch((err) => {
		console.log("err searching ");
		console.log(nextProps.location.query);
		console.log(err);
                this.setState({isFetchingGlobals: false, isError: true});
	    });
    }
    
    render() {
	if("search" in this.state && "globals" in this.state){
	    return (
		<div>
		    {React.createElement(this.innerClass, {search: this.state.search,
							  globals: this.state.globals})}
		</div>);
	}
	return (<div />);
    }
}

export default AppPageBase;
