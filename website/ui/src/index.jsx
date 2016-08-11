import { createStore, applyMiddleware }  from 'redux';
import { Provider, connect } from 'react-redux';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory, Link, withRouter } from 'react-router';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';

import * as actions from './actions';
import { todoApp, getIsFetching, getVisibileTodos, getErrorMessage } from './reducers';
import FetchError from './fetchError';

class VisibleTodoList extends Component {
    componentDidMount(){
	this.fetchData();
    }

    componentDidUpdate(prevProps){
	if(this.props.filter !== prevProps.filter){
	    this.fetchData();
	}
    }

    fetchData(){
	const { filter, fetchTodos } = this.props;
	fetchTodos(filter).then(() => console.log('done!'));
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

const TodoList = ({ todos, onTodoClick }) => (
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

const mapStateToPropsTodoList = (state, {params}) => {
    const filter = params.filter || 'all';
    return {
	todos: getVisibileTodos(state, filter),
	isFetching: getIsFetching(state, filter),
	errorMessage: getErrorMessage(state, filter),
	filter,
    };
};
VisibleTodoList = withRouter(connect(
    mapStateToPropsTodoList,
    actions
)(VisibleTodoList));

const FilterLink = ({filter, children}) => (
    <Link
    to={filter === 'all' ? '' : filter}
    activeStyle={{
	textDecoration: 'none',
	color: 'black',
    }}>
    {children}
    </Link>
);

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

const Footer = () => (
    <p>
    Show:
    {' '} <FilterLink filter='all'>All</FilterLink>
    {' '} <FilterLink filter='active'>Active</FilterLink>
    {' '} <FilterLink filter='completed'>Completed</FilterLink>
    </p>
);

const AddButtonBase = ({dispatch}) => {
    let input;
    
    return (
	<div>
	<input ref={node => {
	    input = node;
	}} />
	<button onClick={() => {
	    dispatch(actions.addTodo(input.value));
	    input.value = '';
	}}>
	Add Todo
	    </button>
	</div>
    );
};
const AddButton = connect()(AddButtonBase);

const TodoApp = () => (
	<div>
	<AddButton />
        <VisibleTodoList />
	<Footer />
	</div>
 );

const Root = ({ store }) => (
    <Provider store={store} >  
    <Router history={browserHistory}>
    <Route path='/(:filter)' component={TodoApp} />
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
