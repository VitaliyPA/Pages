(function () {
    'use strict';

    function startPlugin() {
      window.plugin_wath_ready = true;

      function add() {

        var button_wath = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg version=\"1.1\" id=\"time-Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0\" y=\"0\" viewBox=\"0 0 512 512\" xml:space=\"preserve\"><path fill=\"#fff\" d=\"M347.216 301.211l-71.387-53.54V138.609c0-10.966-8.864-19.83-19.83-19.83-10.966 0-19.83 8.864-19.83 19.83v118.978c0 6.246 2.935 12.136 7.932 15.864l79.318 59.489a19.713 19.713 0 0011.878 3.966c6.048 0 11.997-2.717 15.884-7.952 6.585-8.746 4.8-21.179-3.965-27.743z\"/><path fill=\"#fff\" d=\"M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z\"/></svg>\n            </div>\n            <div class=\"menu__text\">".concat(Lampa.Lang.translate('title_wath'), "</div>\n        </li>"));
        button_wath.on('hover:enter', function () {        
          Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_wath'),
            component: 'favorite',
            type: 'wath',
            page: 1
          });        
        });
        $('.menu .menu__list').eq(0).append(button_wath);
        
      }

      if (window.appready) add(); else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }

    if (!window.plugin_wath_ready) startPlugin();

})();
