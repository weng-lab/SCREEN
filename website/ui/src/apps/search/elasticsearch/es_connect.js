import {FACETBOX_ACTION} from '../reducers/root_reducer'
import {FACET_ACTION} from '../reducers/facetbox_reducer'
export const ES_CONNECT = 'ES_CONNECT';

const compose_maps = (maps) => (a, b, c) => {
    for (var i in maps) maps[i](a, b, c);
};

const compose_callbacks = (callbacks) => (a, b, c, d) => {
    for (var i in callbacks) callbacks[i](a, b, c, d);
};

const es_connect = (box) => (key, f_query_maps, r_facet_maps, es_field = null, agg_map = null, st_map = null) => {
    return {
	type: FACETBOX_ACTION,
	key: box,
	subaction: {
	    type: FACET_ACTION,
	    key,
	    subaction: {
		type: ES_CONNECT,
		es_map: compose_maps(f_query_maps),
		es_callback: compose_callbacks(r_facet_maps),
		es_field,
		agg_map: compose_maps(agg_map),
		st_map
	    }
	}
    };
};
export default es_connect;

export const es_connect_fb = (key, functions, es_field = null) => {
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
