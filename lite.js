(function () {
    'use strict';

	var update = false
	var events = JSON.parse(localStorage.getItem('events') || '[]');
	var append = [
/*		{
			name: 'Torlook',
			url: 'http://freebie.tom.ru/lampa-lite/torlook'
		},*/
		{
			name: 'VCDN',
			url: 'http://freebie.tom.ru/lampa-lite/vcdn'
		},
		{
			name: 'HDRezka',
			url: 'http://freebie.tom.ru/lampa-lite/rezka'
		},
		{
			name: 'Filmix',
			url: 'http://freebie.tom.ru/lampa-lite/filmix'
		},
		{
			name: 'HDVB',
			url: 'http://freebie.tom.ru/lampa-lite/hdvb'
		},
/*		{
			name: 'CDNM',
			url: 'http://freebie.tom.ru/lampa-lite/cdnm'
		},*/
		{
			name: 'Kinobase',
			url: 'http://freebie.tom.ru/lampa-lite/kinobase'
		},
		{
			name: 'Collaps',
			url: 'http://freebie.tom.ru/lampa-lite/collaps'
		},
		{
			name: 'Kodik',
			url: 'http://freebie.tom.ru/lampa-lite/kodik'
		},
		{
			name: 'Jackett',
			url: 'http://freebie.tom.ru/lampa-lite/jackett'
		}
	]

	function merge(add){
		var find = false

		for (var i = 0; i < events.length; i++) {
			if(events[i].url == add.url) find = true
		}

		if(!find){
			update = true

			events.push(add)
		}
	}

	for (var i = 0; i < append.length; i++) {
		merge(append[i])
	}

	if(update){
		localStorage.setItem('events', JSON.stringify(events))
	}

})();
