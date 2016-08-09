import React, { PropTypes } from 'react';
import Footer from './Footer';
import AddTodo from './AddTodo';
import VisibleTodoList from './VisibleTodoList';

const App = () => (
  <div>
	<form onSubmit="" className="search">
	<input type="text" ref="search" placeholder="Search" size="125" defaultValue="GM12878 chr1:1000-23000000" />
	<button type="button" className="btn btn-primary btn-lg">Search</button>
	</form>
  </div>
);

App.propTypes = {
  params: PropTypes.shape({
    filter: PropTypes.string,
  }),
};

export default App;
