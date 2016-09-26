import {CREATE_TABLE} from '../reducers/root_reducer'

const create_table = (dispatch) => (columns, order) => {
    dispatch({
	type: CREATE_TABLE,
	columns,
	order
    });
};
export default create_table;
