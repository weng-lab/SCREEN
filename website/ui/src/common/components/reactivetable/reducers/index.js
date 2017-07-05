import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import users from './users';


/**
 * Reducers
 */
export const reducers = combineReducers({
routing: routerReducer,
    users: users, 
});


/**
 * Reducer class call
 *
 * @param state
 * @param action
 * @param reducerClass
 * @returns {*}
 */
export function reducerCall(state, action, reducerClass) {
    // get the action class method
    const [, method] = action.type.split('.');

    // get all class methods
    const methods = Object.getOwnPropertyNames(reducerClass).filter(name => {
        if ('length' !== name && 'name' !== name && 'prototype' !== name) {
            return name;
        }
    });

    // check if the action method exists in the static class
    if (methods.find(x => x === method)) {
        // clone the state
        const new_state = cloneObject(state);

        // return the static method
        return reducerClass[method](new_state, action);
    } else {
        // there's no valid action, so just return the state
        return state;
    }
}


/**
 * Clone an object
 *
 * @param object
 */
function cloneObject(object) {
    return JSON.parse(JSON.stringify(object));
}
