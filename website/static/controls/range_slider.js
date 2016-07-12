function range_slider()
{
    this.base = null;
}

function create_range_slider(slider_div, max, txbox, update_function, slide_function)
{
    
    var retval = new range_slider();
    
    $( "#" + slider_div ).slider({
	range: true,
	min: 0,
	max: max,
	values: [ 0, max ],
	slide: function( event, ui ) {
            txbox.value = $( "#" + slider_div ).slider( "values", 0 ) + " - " + $( "#" + slider_div ).slider( "values", 1 );
	    if (typeof slide_function === "function") slide_function();
	},
	stop: update_function
    });
    txbox.value = $( "#" + slider_div ).slider( "values", 0 ) + " - " + $( "#" + slider_div ).slider( "values", 1 );
    
    retval.base = $("#" + slider_div);
    retval.textbox = txbox;
    return retval;
    
}

range_slider.prototype.set_selection_range = function(start, end) {
    this.textbox.value = start + " - " + end;
    this.base.slider("values", [start, end]);
};

range_slider.prototype.get_selection_range = function() {
    return this.base.slider("values");
};

range_slider.prototype.get_range = function() {
    return [this.base.slider("option", "min"), this.base.slider("option", "max")];
};

range_slider.prototype.set_range = function(min, max) {
    var cselection = this.get_selection_range();
    if (cselection[0] < min) cselection[0] = min;
    if (cselection[1] > max) cselection[1] = max;
    this.set_selection_range(...cselection);
    this.base.slider("option", "min", min);
    this.base.slider("option", "max", max);
};

range_slider.prototype.get_range = function() {
    return [this.base.slider("option", "min"), this.base.slider("option", "max")];
};
