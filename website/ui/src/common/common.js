export const chr_sort = (a, b) => (
    +a.replace(/chr/g, '') - +b.replace(/chr/g, '')
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

export function set_center_x(element, x, limits = null) {
    var hw = $(element).width() / 2;
    var nleft = (x - hw);
    if (limits) {
	var nlimits = [limits[0], limits[1] - hw];
	if (nleft < nlimits[0]) nleft = nlimits[0];
	if (nleft > nlimits[1]) nleft = nlimits[1];
    }
    element.style.left = nleft + "px";
}

export function numberWithCommas(x) {
    // http://stackoverflow.com/a/2901298
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
