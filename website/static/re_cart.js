function initCart(){
    var dom = "shoppingcart_obj";
    var cart = new ShoppingCart();
    var cartobj = document.getElementById(dom);

    $('#' + dom).load("image/svg+xml", function() {
	var svg = cartobj.contentDocument.getElementsByTagName("svg")[0];
	var img = svg.getElementsByTagName("image")[0];
	img.onclick = function() {
            if (cart.items.length > 0) {
		go_to_cart();
            }
	}
	cart.bind(svg);
    });

    return cart;
}

function go_to_cart() {
    var data = JSON.stringify(cart.items);

    $.ajax({
        type: "POST",
        url: "/setCart",
        data: data,
        dataType: "json",
        contentType : "application/json",
        success: function(got){
            if("err" in got){
                $("#errMsg").text(got["err"]);
                $("#errBox").show()
                return true;
            }

	    window.location.href = "/cart";
        }
    });
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
