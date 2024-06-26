(function () {
    'use strict';

    function startPlugin() {
      window.plugin_want_ready = true;

      function add() {

        var button_wath = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0\" y=\"0\" viewBox=\"0 0 512 512\" xml:space=\"preserve\"><path fill=\"#fff\" d=\"M347.216 301.211l-71.387-53.54V138.609c0-10.966-8.864-19.83-19.83-19.83-10.966 0-19.83 8.864-19.83 19.83v118.978c0 6.246 2.935 12.136 7.932 15.864l79.318 59.489a19.713 19.713 0 0011.878 3.966c6.048 0 11.997-2.717 15.884-7.952 6.585-8.746 4.8-21.179-3.965-27.743z\"/><path fill=\"#fff\" d=\"M256 0C114.833 0 0 114.833 0 256s114.833 256 256 256 256-114.833 256-256S397.167 0 256 0zm0 472.341c-119.275 0-216.341-97.066-216.341-216.341S136.725 39.659 256 39.659c119.295 0 216.341 97.066 216.341 216.341S375.275 472.341 256 472.341z\"/></svg>\n            </div>\n            <div class=\"menu__text\">".concat(Lampa.Lang.translate('title_wath'), "</div>\n        </li>"));
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

        var button_like = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0\" y=\"0\" viewBox=\"0 0 477.534 477.534\" xml:space=\"preserve\"><path fill=\"#fff\" d=\"M438.482 58.61a130.815 130.815 0 00-95.573-41.711 130.968 130.968 0 00-95.676 41.694l-8.431 8.909-8.431-8.909C181.284 5.762 98.662 2.728 45.832 51.815a130.901 130.901 0 00-6.778 6.778c-52.072 56.166-52.072 142.968 0 199.134l187.358 197.581c6.482 6.843 17.284 7.136 24.127.654.224-.212.442-.43.654-.654l187.29-197.581c52.068-56.16 52.068-142.957-.001-199.117zm-24.695 175.616h-.017L238.802 418.768 63.818 234.226c-39.78-42.916-39.78-109.233 0-152.149 36.125-39.154 97.152-41.609 136.306-5.484a96.482 96.482 0 015.484 5.484l20.804 21.948c6.856 6.812 17.925 6.812 24.781 0l20.804-21.931c36.125-39.154 97.152-41.609 136.306-5.484a96.482 96.482 0 015.484 5.484c40.126 42.984 40.42 109.422 0 152.132z\"/></svg>\n            </div>\n            <div class=\"menu__text\">".concat(Lampa.Lang.translate('title_like'), "</div>\n        </li>"));
        button_like.on('hover:enter', function () {        
          Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_like'),
            component: 'favorite',
            type: 'like',
            page: 1
          });        
        });
        $('.menu .menu__list').eq(0).append(button_like);

        var button_book = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0\" y=\"0\" viewBox=\"0 0 512 512\" xml:space=\"preserve\"><path fill=\"#fff\" d=\"M391.416 0H120.584c-17.778 0-32.242 14.464-32.242 32.242v460.413A19.345 19.345 0 00107.687 512a19.34 19.34 0 0010.169-2.882l138.182-85.312 138.163 84.693a19.307 19.307 0 0019.564.387 19.338 19.338 0 009.892-16.875V32.242C423.657 14.464 409.194 0 391.416 0zm-6.449 457.453l-118.85-72.86a19.361 19.361 0 00-20.28.032l-118.805 73.35V38.69h257.935v418.763z\"/></svg>\n            </div>\n            <div class=\"menu__text\">".concat(Lampa.Lang.translate('title_book'), "</div>\n        </li>"));
        button_book.on('hover:enter', function () {        
          Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_book'),
            component: 'favorite',
            type: 'book',
            page: 1
          });        
        });
        $('.menu .menu__list').eq(0).append(button_book);
        
      }

      if (window.appready) add(); else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }

    if (!window.plugin_want_ready) startPlugin();

})();
