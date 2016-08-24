function go_to_cart() {
    sendText(JSON.stringify({
	"action": "create_cart",
	"acclist": cart.items
    }));
}

function ShoppingCart(){
    this.items = [];

    this.bind = function(svg) {
	this.svg = svg;
	this.counter = svg.getElementsByTagName("text")[0];
	this.update_counter();
    };

    this.clear = function() {
	this.items = [];
	this.update_counter();
    };

    this.update_counter = function() {
	this.counter.textContent = this.items.length;
    };
    
    this.add_item = function(item) {
	this.items.push(item);
	this.update_counter();
    };

    this.has_item = function(item) {
	for (i in this.items) {
	    if (this.items[i].accession == item.accession) {
		return true;
	    }
	}
	return false;
    };
    
    this.remove_item = function(item) {
	for (i in this.items) {
	    if (this.items[i].accession == item.accession) {
		this.items.splice(i, 1);
	    }
	}
	this.update_counter();
    };
    
};
