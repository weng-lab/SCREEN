import {combineReducers }  from 'redux';
import byIdReducer, * as fromById from './byId';
import createList, * as fromList from './createList';
import search from './search';

const listByFilter = combineReducers({
    all: createList('all'),
    active: createList('active'),
    completed: createList('completed') 
});

export const todoApp = combineReducers({
    byId : byIdReducer,
    listByFilter,
    search
});

// aka selector
export const getVisibileTodos = (state, filter) => {
    const ids = fromList.getIds(state.listByFilter[filter]);
    return ids.map(id => fromById.getTodo(state.byId, id));
};

export const getIsFetching = (state, filter) =>
    fromList.getIsFetching(state.listByFilter[filter]);

export const getErrorMessage = (state, filter) =>
    fromList.getErrorMessage(state.listByFilter[filter]);

