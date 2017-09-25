import React from 'react'
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import thunkMiddleware from 'redux-thunk'

import NavBarApp from '../../common/components/navbar_app'
import SearchBox from '../../common/components/searchbox'
import FacetBoxen from './components/facetboxen'
import MainTabs from './components/maintabs'

import main_reducers from './reducers/main_reducers'
import {isCart} from '../../common/utility'

import initialState from './config/initial_state'

class SearchPageInner extends React.Component {
    render() {
	const store = createStore(main_reducers,
				  initialState(this.props.search, this.props.globals),
				  applyMiddleware(
				      thunkMiddleware,
				  ));
	let drawMain = () => {
	    if(isCart()){
		return (
		    <div className="row" style={{width: "100%"}}>
			<div className="col-md-12" id="tabs-container">
                            <MainTabs />
			</div>
		    </div>);
	    } else {
		return (
                    <div className="row" style={{width: "100%"}}>
			<div className="col-md-3 nopadding-right" id="facets-container">
                            <FacetBoxen />
			</div>
			<div className="col-md-9 nopadding-left" id="tabs-container">
                            <MainTabs />
			</div>
		    </div>);
	    }
	}

        return (
            <Provider store={store}>
	        <div>
		    <nav id="mainNavBar"
                         className="navbar navbar-default navbar-inverse navbar-main">
		        <div className="container-fluid" id="navbar-main">
                            <NavBarApp assembly={this.props.search.assembly}
				       show_cartimage={true}
                                       searchbox={SearchBox} />}/>
                        </div>
		    </nav>

		    <div className="container" style={{width: "100%"}}>
			{drawMain()}

                    </div>
		</div>
            </Provider>
        );
    }
}

class SearchPage extends React.Component {
    constructor(props) {
	super(props);
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
	fetch("/searchws/search",
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
		    <SearchPageInner search={this.state.search}
				     globals={this.state.globals}/>
		</div>);
	}
	return (<div />);
    }
}

export default SearchPage;
