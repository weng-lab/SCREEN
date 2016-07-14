function process_autocomplete_results(results)
{
    var retval = [];
    for (field in results) {
	if (field.indexOf("_suggestions") != -1) {
	    retval = retval.concat(results[field]);
	}
    }
    return retval;
}

function handle_autocomplete_suggestions(results)
{
    autocomplete_callbacks[results["callback"]](process_autocomplete_results(results));
    delete autocomplete_callbacks[results["callback"]];
}

function socket_message_handler(e)
{
    results = JSON.parse(e.data);
    if (results["type"] == "suggestions")
	handle_autocomplete_suggestions(results);
}
