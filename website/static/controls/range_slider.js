
function range_slider()
{
    this.base = null;
}

function slider()
{
    this.base = null;
}

function _create_slider_generic(slider_div, max, txbox, update_function,
				slide_function, is_range){
    if (typeof(is_range)==='undefined') is_range = true;

    var retval = (is_range ? new range_slider() : new slider());

    retval.base = $("#" + slider_div);
    retval.base.slider({
	range: is_range,
	min: 0,
	max: max,
	values: (is_range ? [ 0, max ] : [txbox.value]),
	stop: update_function
    });

    if (is_range) {
	retval.base.on("slide", function( event, ui ) {
            txbox.value = retval.base.slider( "values", 0 ) + " - " + retval.base.slider( "values", 1 );
	    if (typeof slide_function === "function") slide_function();
	});
	txbox.value = retval.base.slider( "values", 0 ) + " - " + retval.base.slider( "values", 1 );
    } else {
	retval.base.on("slide", function( event, ui ) {
            txbox.value = retval.base.slider( "values" )[0];
	    if (typeof slide_function === "function") slide_function();
	});
	txbox.value = retval.base.slider( "values" )[0];
    }
    
    retval.textbox = txbox;
    return retval;
    
}

function create_range_slider(slider_div, max, txbox, update_function, slide_function)
{
    return _create_slider_generic(slider_div, max, txbox, update_function, slide_function);
}

function create_slider(slider_div, max, txbox, update_function, slide_function)
{
    return _create_slider_generic(slider_div, max, txbox, update_function, slide_function, false);
}

slider.prototype.set_selection = function(value) {
    this.textbox.value = value;
    this.base.slider("values", 0, value);
};

range_slider.prototype.set_selection_range = function(start, end) {
    this.textbox.value = start + " - " + end;
    this.base.slider("values", [start, end]);
};

range_slider.prototype.refresh_selection = function(start, end) {
    if (typeof(start)==='undefined') start = null;
    if (typeof(end)==='undefined') end = null;
    
    if (start != null && end != null) this.set_selection_range(start, end);
    var crange = this.get_range();
    var cselection = this.get_selection_range();
    if (cselection[0] < crange[0]) cselection[0] = crange[0];
    if (cselection[1] > crange[1]) cselection[1] = crange[1];
    this.set_selection_range(...cselection);
    
};

slider.prototype.refresh_selection = function(value) {
    if (typeof(value)==='undefined') value = null;

    if (value != null) this.set_selection(value);
    var crange = this.get_range();
    var cselection = this.get_selection();
    if (cselection < crange[0]) cselection = crange[0];
    if (cselection > crange[1]) cselection = crange[1];
    this.set_selection(cselection);
    
};

slider.prototype.get_selection = function() {
    return this.base.slider("values", 0);
};

range_slider.prototype.get_selection_range = function() {
    return this.base.slider("values");
};

range_slider.prototype.get_range = slider.prototype.get_range = function() {
    return [this.base.slider("option", "min"), this.base.slider("option", "max")];
};

range_slider.prototype.set_range = slider.prototype.set_range = function(min, max) {
    this.base.slider("option", "min", min);
    this.base.slider("option", "max", max);
    this.refresh_selection();
};

