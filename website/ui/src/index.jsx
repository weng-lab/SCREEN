import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import React from 'react';
import ReactDOM from 'react-dom';
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import axios from 'axios'; 

const requestSuggestions = (filter) => ({
    type: 'REQUEST_SUGGESTIONS',
    filter,
});

const receiveSuggestions = (filter, response) => ({
    type: 'RECEIVE_SUGGESTIONS',
    filter,
    response
});

const fetchSuggestions = (filter) => (dispatch, getState) => {
    // if(getIsFetching(getState(), filter)){ return; }
    
    dispatch(requestSuggestions(filter));

    return axios.post('http://megatux.purcaro.com:9002/ver4/search/autocomplete', {
	userQuery: filter
    }).then(function (response) {
	console.log(response);
	dispatch(receiveSuggestions(filter, response));
    }).catch(function (error) {
	console.log(error);
    });
}

const configureStore = () => {
    const middlewares = [thunk];
    if (process.env.NODE_ENV !== 'production'){
	middlewares.push(createLogger());
    }

    return createStore(
	myapp,
	applyMiddleware(...middlewares)
    );
}

let AddTodo = ({ dispatch }) => {
    let input

    return (
	<div>
	<form onSubmit={e => {
	    e.preventDefault()
	    if (!input.value.trim()) {
		return
	    }
	    dispatch(addTodo(input.value))
	    input.value = ''
	}}>
	<input ref={node => {
	    input = node
	}} />
	<button type="submit">
	Add Todo
	    </button>
	</form>
	</div>
    )
}
AddTodo = connect()(AddTodo)


    const todos = (state = [], action) => {
	switch (action.type) {
	case 'ADD_TODO':
	    return [
		...state,
		todo(undefined, action)
	    ]
	case 'TOGGLE_TODO':
	    return state.map(t =>
		todo(t, action)
	    )
	default:
	    return state
	}
    }

const App = () => (
    <div>
    <AddTodo />
    </div>
)

const Search = React.createClass({
    render() {
	return (
	    <App />
	)
    }
});

ReactDOM.render(
    <Provider store={store}>
    <App />
    </Provider>,
    document.getElementById('app')
);
