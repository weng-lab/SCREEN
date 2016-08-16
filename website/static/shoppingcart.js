function ShoppingCart()
{
    
    this.items = [];

    this.bind = function(svg) {
	this.svg = svg;
	this.counter = svg.getElementsByTagName("text")[0];
	this.update_counter();
    };

    this.update_counter = function() {
	this.counter.textContent = this.items.length;
    };
    
    this.add_item = function(item) {
	this.items.push(item);
	this.update_counter();
    };

    this.remove_item = function(item) {
	_.without(items, item);
	this.update_counter();
    };
    
};
