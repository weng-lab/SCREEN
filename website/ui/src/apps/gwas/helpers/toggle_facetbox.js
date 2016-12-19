import {HIDE_FACETBOX, SHOW_FACETBOX} from '../reducers/facetbox_reducer'

const toggle_facetbox = (box, value, dispatch) => {
    dispatch(value ? {type: SHOW_FACETBOX} : {type: HIDE_FACETBOX});
    return value;
};
export default toggle_facetbox;
