var searchquery = accession_list_query(CartReAccessions);

var re_table = new RE_table();
re_table.disable_cart_icons();

function perform_search() {
    sendText(JSON.stringify({"action": "query",
			     "callback": "regulatory_elements",
			     "index": "regulatory_elements",
			     "object": searchquery.eso}));
};

function socket_message_handler(e) {
    results = JSON.parse(e.data);
    if (re_table.callback) {
	re_table.runCallback();
	return;
    }
    if (results.callback == "regulatory_elements") {
	re_table.renderTable();
    }
}
