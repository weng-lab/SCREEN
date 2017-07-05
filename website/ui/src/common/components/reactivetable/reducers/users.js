import { reducerCall } from './index';

/**
 * Users reducer
 *
 * @param state
 * @param action
 * @returns {*}
 */
export default function users(state = {}, action) {
    return reducerCall(state, action, reducerClass);
}


/**
 * Reducer static class
 */
class reducerClass
{
    /**
     * Show the delete prompt
     *
     * @param new_state
     * @param action
     * @returns {*}
     */
    static modalDeleteShow(new_state, action)
    {
        new_state.modal = new_state.modal ? new_state.modal : {};
        new_state.modal.list_delete = {
            show: true,
            id: action.id,
            username: action.username,
        }
        return new_state;
    }

    /**
     * Hide the delete prompt
     *
     * @param new_state
     * @param action
     * @returns {*}
     */
    static modalDeleteHide(new_state, action)
    {
        new_state.modal.list_delete = {
            show: false,
            id:0,
            username: '',
        }
        return new_state;
    }

    /**
     * Delete a user
     *
     * @param new_state
     * @param action
     * @returns {*}
     */
    static delete(new_state, action)
    {
        for (const index in new_state.list) {
            if (new_state.list[index].id === action.id) {
                new_state.list.splice(index, 1);
                break;
            }
        }
        return new_state;
    }
}
