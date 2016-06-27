function create_range_slider(slider_div, max, txbox, update_function, slide_function)
{
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
}
