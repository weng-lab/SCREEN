const delay = (ms) =>
new Promise(resolve => setTimeout(resolve, ms));

// axios.post('http://megatux.purcaro.com:9002/ver4/search/autocomplete', {userQuery: filter}).

export const fetchTodos = (filter) =>
    delay(5000).then(() => {

	if(Math.random() > 0.5){
	    throw new Error('x');
	}
	
	switch (filter){
	case 'all':
	    return { todos: [{id: "asdfasdf", text: "hey", completed: true}] };
	case 'active':
	    return { todos: [] };
	case 'completed':
	    return { todos: [{id: "asdfasdf", text: "hey", completed: true}] };
    };
});
