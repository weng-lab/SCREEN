const byId = (state = {}, action) => {
  if (action.response) {
    return {null
	    //...state,
      //...action.response.entities.todos,
    };
  }
  return state;
};

export default byId;

export const getTodo = (state, id) => state[id];
