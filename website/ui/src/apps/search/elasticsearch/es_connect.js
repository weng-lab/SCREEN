import {FACETBOX_ACTION} from '../reducers/root_reducer'
import {FACET_ACTION} from '../reducers/facetbox_reducer'
export const ES_CONNECT = 'ES_CONNECT';

const compose_maps = (maps) => (a, b, c) => {
    for (var i in maps) maps[i](a, b, c);
};

const es_connect = (box) => (key, f_query_maps, r_facet_maps, es_field = null) => {
    return {
	type: FACETBOX_ACTION,
	key: box,
	subaction: {
	    type: FACET_ACTION,
	    key,
	    subaction: {
		type: ES_CONNECT,
		es_map: compose_maps(f_query_maps),
		es_callback: compose_maps(r_facet_maps),
		es_field
	    }
	}
    };
};
export default es_connect;

const es_connect_fb = (key, functions, es_field = null) => {
    return {
	type: FACETBOX_ACTION,
	key,
	subaction: {
	    type: ES_CONNECT,
	    es_field,
	    es_callback: compose_maps(functions)
	}
    };
};
export default es_connect_fb;
