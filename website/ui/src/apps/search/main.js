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
	let maintab = null;
        let subtab = null;
	if("maintab" in this.props.params){
	    maintab = this.props.params.maintab;
            if("subtab" in this.props.params){
                subtab = this.props.params.subtab;
            }
	}

	const store = createStore(main_reducers,
				  initialState(maintab, subtab),
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
                            <NavBarApp show_cartimage={true}
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
	this.state = { isFetching: false, isError: false };
    }

    componentDidMount(){
	this.search(this.props);
    }

    componentWillReceiveProps(nextProps){
	this.search(nextProps);
    }
    
    search(nextProps){
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
		this.setState({parsedQuery: r, isFetching: false, isError: false});
	    })
	    .catch((err) => {
		console.log("err loading files");
		console.log(err);
                this.setState({isFetching: false, isError: true});
	    });
    }
    
    render() {
	return (<div />);
    }
}

export default SearchPage;
