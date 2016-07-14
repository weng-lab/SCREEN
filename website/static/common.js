var FBVERSION = FBVERSION || (function(){
    // from http://stackoverflow.com/a/2190927

    var _version = {}; // private

    return {
        init : function(version) {
            _version = version;
        },
        ver : function() {
            return _version;
        }
    };
}());

function Ver() {
    return FBVERSION.ver();
}
