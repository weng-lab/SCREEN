export function fit_to(a1, a2) {
    if (a1[0] > a1[1]) a1.reverse();
    if (a1[0] < a2[0]) a1[0] = a2[0];
    if (a1[1] > a2[1]) a1[1] = a2[1];
    return a1;
}

const primitive_comparator = (a, b) => (a == b);

export function array_insert(a, v, c = primitive_comparator) {
    for (i in a) {
	if (c(a[i], v)) return a;
    }
    return [...a, v];
}

export function array_remove(a, v, c = primitive_comparator) {
    var retval = [...a];
    for (i in retval) {
	if (c(retval[i], v)) retval.splice(i, 1);
    }
    return retval;
}

export function obj_assign(o, k, v) {
    var retval = Object.assign({}, o);
    retval[k] = v;
    return retval;
}

export function obj_remove(o, k) {
    if (!(k in o)) return o;
    var retval = Object.assign({}, o);
    delete retval[k];
    return retval;
}
