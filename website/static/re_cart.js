function initCart(){
    var dom = "shoppingcart_obj";
    var cart = new ShoppingCart();
    var cartobj = document.getElementById(dom);

    $('#' + dom).load("image/svg+xml", function() {
	var svg = cartobj.contentDocument.getElementsByTagName("svg")[0];
	var img = svg.getElementsByTagName("image")[0];
	img.onclick = function() {
            if (cart.res.length > 0) {
		go_to_cart();
            }
	}
	cart.bind(svg);
    });

    return cart;
}

function go_to_cart() {
    var data = JSON.stringify(cart.res);

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
    this.res = []; // RE accessions

    this.bind = function(svg) {
	this.svg = svg;
	this.counter = svg.getElementsByTagName("text")[0];
	this.update_counter();
    };

    this.clear = function() {
	this.res = [];
	this.update_counter();
    };

    this.update_counter = function() {
	this.counter.textContent = this.res.length;
    };
    
    this.add_re = function(re) {
	this.res.push(re.accession);
	this.update_counter();
    };

    this.has_re = function(re) {
	return _.contains(this.res, re.accession);
    };
    
    this.remove_re = function(re) {
	this.res = _.without(this.res, re.accession);
	this.update_counter();
    };

    this.reClick = function(re){
	if (this.has_re(re)) {
	    this.remove_re(re);
	    return false;
	} 
	this.add_re(re);
	return true;
    }
};
