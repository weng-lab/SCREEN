const byIdReducer = (state = {}, action) => {
    switch(action.type){
    case 'FETCH_TODOS_SUCCESS':
	const nextState = { ...state };
	action.response.todos.forEach(todo => {
	    nextState[todo.id] = todo;
	});
	return nextState;
    default:
	return state;
    }
};

export default byIdReducer;

export const getTodo = (state, id) => state[id];
