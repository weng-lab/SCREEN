export const asum = (a) => {
    var retval = [];
    a.map((_a) => {
	retval = retval.concat(_a);
    });
    return retval;
};

export const chr_sort = (a, b) => (
    +a.replace(/chr/g, '').replace(/Y/g, '24').replace(/X/g, '23')
    - +b.replace(/chr/g, '').replace(/Y/g, '24').replace(/X/g, '23')
);

export function fit_to(a1, a2) {
    if (a1[0] > a1[1]) a1.reverse();
    if (a1[0] < a2[0]) a1[0] = a2[0];
    if (a1[1] > a2[1]) a1[1] = a2[1];
    return a1;
}

const primitive_comparator = (a, b) => (a == b);

export const chain_functions = (f, g) => () => {
    f && f();
    g && g();
};

export function array_insert(a, v, c = primitive_comparator) {
    for (var i in a) {
	if (c(a[i], v)) return a;
    }
    return [...a, v];
}

export function array_remove(a, v, c = primitive_comparator) {
    var retval = [...a];
    for (var i in retval) {
	if (c(retval[i], v)) retval.splice(i, 1);
    }
    return retval;
}

export function array_contains(a, v, c = primitive_comparator) {
    for (var i in a) {
	if (c(a[i], v)) return true;
    }
    return false;
}

export function obj_assign(o, k, v) {
    var retval = Object.assign({}, o);
    retval[k] = v;
    return retval;
}

export function obj_remove(o, k) {
    if (!(k in o)) {
        return o;
    }
    var retval = Object.assign({}, o);
    delete retval[k];
    return retval;
}

export function numberWithCommas(x) {
    // http://stackoverflow.com/a/2901298
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
