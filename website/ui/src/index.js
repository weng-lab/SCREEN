import { createStore, applyMiddleware }  from 'redux';
import { Provider, connect } from 'react-redux';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory, Link, withRouter } from 'react-router';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';

import * as actions from './actions';
import { todoApp, getIsFetching, getSugs, getErrorMessage } from './reducers';
import FetchError from './fetchError';

class VisibleTodoList extends Component {
    componentDidMount(){
	// this.fetchData();
    }

    componentDidUpdate(prevProps){
	if(this.props.userQuery !== prevProps.userQuery){
	    this.fetchData();
	}
    }

    fetchData(){
	const { userQuery, fetchTodos } = this.props;
	fetchTodos(userQuery).then(() => console.log('done!'));
    }
    
    render() {
	const { toggleTodo, errorMessage, todos, isFetching } = this.props;
	if(isFetching && !todos.length){
	    return <p>Loading...</p>;
	}
	if(errorMessage){
	    return (
		<FetchError
		message={errorMessage}
		onRetry={() => this.fetchData()}
		/>
	    );
	}
	
	return <TodoList
	todos={todos}
	onTodoClick={toggleTodo}
	    />;
    }
};

const TodoList = ({ todos, onTodoClick }) => {
    console.log(todos);
    return (
    <ul>
    {todos.map(todo =>
	<TodoLi
	key={todo.id} 
	{...todo}
	onClick = {() => onTodoClick(todo.id)}
	/>
    )}
    </ul>
    );
};

const mapStateToPropsTodoList = (state, {params}) => {
    const userQuery = params.userQuery || '';
    return {
	todos: getSugs(state, userQuery),
	isFetching: getIsFetching(state, userQuery),
	errorMessage: getErrorMessage(state, userQuery),
	userQuery,
    };
};
VisibleTodoList = withRouter(connect(mapStateToPropsTodoList, actions)
    (VisibleTodoList));

const TodoLi = ({
    text, completed, onClick
}) => (
    <li
    onClick={onClick}
    style={{
	textDecoration:
	completed ?
	'line-through' :
	'none'
    }}>
    {text}
    </li>
);

class AddButton extends Component {
    componentDidMount(){
    }

    add({keyCode, target}) {
	const { searchKeyPress, fetchTodos } = this.props;
	const Enter = 13;
	
	if(Enter == keyCode){

	} else {
	    const userQuery = target.value;
	    fetchTodos(userQuery).then(() => console.log('done!'));
	}
    }
    
    render(){
	const { addTodo } = this.props;
	return (
	    <div>
	    <input onKeyUp={ (e) => this.add(e) } />
	    <button onClick={() => {
		addTodo(input.value);
	    }}>
	    Search
	    </button>
	    <VisibleTodoList />
	    </div>
	);
    }
};
const mapStateToPropsSearch = (state, {params}) => {
    const userQuery = params.userQuery || '';
    return {
	userQuery
    };
};
AddButton = withRouter(connect(mapStateToPropsSearch, actions)
    (AddButton));

const TodoApp = () => (
	<div>
	<div className="sandbox">
	<input type="text" id="input-tags" tabIndex="-1" className="demo-default selectized" style={{display: 'none'}}></input>
	<div className="selectize-control demo-default multi">
	<div className="selectize-input items not-full has-options has-items">
	<div className="item" data-value="awesome">awesome</div>
	<div className="item" data-value="neat">neat</div>
	<div className="item" data-value="asdfsfasdfasd">asdfsfasdfasd</div>
	<div className="item" data-value="qwerqwerq">qwerqwerq</div>
	<input type="text" tabIndex="" style={{width: '4px', opacity: 1, position: 'relative', left: '0px'}}></input>
	</div>
	<div className="selectize-dropdown multi demo-default" style={{display: 'none', width: '520px', top: '36px', left: '0px', visibility: 'visible'}}>
	<div className="selectize-dropdown-content">
	</div>
	</div>
	</div>
	<div className="value">Current Value: <span>"awesome,neat,asdfsfasdfasd,qwerqwerq"</span>
	</div>
	</div>
	<AddButton />
	</div>
 );

const Root = ({ store }) => (
    <Provider store={store} >  
    <Router history={browserHistory}>
    <Route path='/(:userQuery)' component={TodoApp} />
    </Router>
    </Provider>
);

const configureStore = (app) => {
    const middlewares = [thunk];
    if(process.env.NODE_ENV !== 'production'){
	middlewares.push(createLogger());
    }
    return createStore(
	app,
	applyMiddleware(...middlewares)
    );
};

const store = configureStore(todoApp);

ReactDOM.render(
    <Root store={store}/>,
    document.getElementById('root')
);
