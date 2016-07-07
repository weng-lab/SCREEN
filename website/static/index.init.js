var webSocketUrl = "ws://" + window.location.hostname + ":9000";

function socket_message_handler(e)
{
    results = JSON.parse(e.data);
    if (results["type"] == "suggestions")
	handle_autocomplete_suggestions(results);
	
}

function handle_autocomplete_results(results)
{
    alert("gene suggestions: " + results["gene_suggestions"] + "\n\nSNP suggestions: " + results["snp_suggestions"]);
}
