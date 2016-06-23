function create_range_slider(slider_div, max, txbox, update_function)
{
    $( "#" + slider_div ).slider({
	range: true,
	min: 0,
	max: max,
	values: [ 0, max ],
	slide: function( event, ui ) {
            txbox.value = $( "#" + slider_div ).slider( "values", 0 ) + " - " + $( "#" + slider_div ).slider( "values", 1 );
	},
	stop: update_function
    });
    txbox.value = $( "#" + slider_div ).slider( "values", 0 ) + " - " + $( "#" + slider_div ).slider( "values", 1 );
}
