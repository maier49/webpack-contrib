(function(e, o) {
	'object' == typeof exports && 'object' == typeof module
		? (module.exports = o())
		: 'function' == typeof define && define.amd
			? define([], o)
			: 'object' == typeof exports
				? (exports.Lib = o())
				: (e.Lib = o());
})(this, function() {
	return (function(e) {
		function o(n) {
			if (t[n]) return t[n].exports;
			var r = (t[n] = { exports: {}, id: n, loaded: !1 });
			return e[n].call(r.exports, r, r.exports, o), (r.loaded = !0), r.exports;
		}
		var t = {};
		return (o.m = e), (o.c = t), (o.p = ''), o(0);
	})([
		function(e, o, t) {
			t(1), t(2), t(3);
		},
		function(e, o) {
			e.exports = 'module a';
		},
		function(e, o) {
			e.exports = 'module b';
		},
		function(e, o) {
			e.exports = 'module a';
		}
	]);
});
