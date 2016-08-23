function socket_message_handler(e){
    results = JSON.parse(e.data);
    if("suggestions" == results["type"]){
	handle_autocomplete_suggestions(results);
    }
}
