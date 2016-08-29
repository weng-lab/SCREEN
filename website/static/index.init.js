function ajaxws_message_handler(e){
    results = e;
    if("suggestions" == results["type"]){
	handle_autocomplete_suggestions(results);
    }
}
