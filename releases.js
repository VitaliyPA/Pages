(function ( backendhost, backendver, backend_scheme, backend_hostname, backendhost_https, backendhost_cf ) {
    'use strict';

    var SourceReleases = function () {
      this.network = new Lampa.Reguest();
      this.title = 'Releases';
      this.source = 'releases';
      this.baseurl = backendhost + '/lampa/';  
      this.cache = { life: 120 };

      this.add = function (u, params) {
        return u + (/\?/.test(u) ? '&' : '?') + params;
      }

      this.url = function (u) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        if (u.toLowerCase().indexOf('http') == 0) return u;
        if (backendver) u = this.add(u, 'v=' + backendver);
        if (Lampa.PVA && Lampa.PVA.hash) u = this.add(u, 'hash=' + Lampa.PVA.hash);
        if (this.source && u.indexOf('source=') == -1) u = this.add(u, 'source=' + this.source);
        if (params.id) u = this.add(u, 'id=' + params.id);
        if (params.url && params.component != 'category_full') u = this.add(u, 'url=' + params.url);
        if (params.genres) u = this.add(u, 'genre=' + params.genres);
        if (params.query) u = this.add(u, 'title=' + params.query);
        if (params.type || params.companies) {
          u = this.add(u, 'no_kp=true');
          u = this.add(u, 'type=' + (params.type || params.companies));
        }        
        if (params.filter) u = this.add(u, 'filter=' + params.filter);
        if (params.page) u = this.add(u, 'page=' + params.page);        

        return this.baseurl + u;
      }

      this.get = function (method) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var oncomplite = arguments.length > 2 ? arguments[2] : undefined;
        var onerror = arguments.length > 3 ? arguments[3] : undefined;
        var u = this.url(method, params);
        var data = (this.getData ? this.getData(u, params) : undefined);
        this.network.silent(u, function (json) {
          if (json && json.error) { onerror(); Lampa.Noty.show(json.error); return; }
          json.url = method;
          oncomplite(json);
        }, onerror, (data ? JSON.stringify(data) : undefined), { cache: this.cache } );
      }

      this.list =  function () {
        var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
        var onerror = arguments.length > 2 ? arguments[2] : undefined;
        var u = this.url(params.url, params);        
        var data = (this.getData ? this.getData(u, params) : undefined);        
        this.network.silent(u, oncomplite, onerror, (data ? JSON.stringify(data) : undefined), { cache: this.cache } );
      };

      this.clear = function () {
        this.network.clear();
      };

      return this;
    }

    function startPlugin() {
      window.plugin_pvareleases_ready = true;

      function add() {

        if (Lampa.Storage.get('pva_releases_over_cloudflare', false)) backendhost = backendhost_cf; else backendhost = backendhost_https;

        function makeSource(name, source, addSearch) {
          Lampa.Api.sources[name] = source;
          Object.defineProperty(Lampa.Api.sources, name, {
            configurable: false,
            get: function get() {
              return source;
            }
          });
          if (addSearch == false) source.discovery = false;
        }
        makeSource('releases', new SourceReleases, false );        

        if (!Lampa.PVA) Lampa.PVA = { main: [], timeline: {} };

        Lampa.PVA.hash = Lampa.Utils.hash(Lampa.Storage.get('account_email', 'releases@cloudflare.com').toLowerCase().trim());
        if (Lampa.Storage.get('pva_sources_main_add_releases_new', '0') > 0) {
          Lampa.PVA.main.push({ name: 'releases_new', source: 'releases', url: 'getSources', type: 'new', index: Lampa.Storage.get('pva_sources_main_add_releases_new', '0'), title: 'Новые фильмы в качестве', results: [] });
        }
        if (Lampa.Storage.get('pva_sources_main_add_releases_new4K', '0') > 0) {
          Lampa.PVA.main.push({ name: 'releases_new4K', source: 'releases', url: 'getSources', type: 'new4K', index: Lampa.Storage.get('pva_sources_main_add_releases_new4K', '0'), title: 'Новые фильмы в 4К качестве', results: [] });
        }
        if (Lampa.Storage.get('pva_sources_main_add_releases_series', '0') > 0) {
          Lampa.PVA.main.push({ name: 'releases_series', source: 'releases', url: 'getSources', type: 'series', index: Lampa.Storage.get('pva_sources_main_add_releases_series', '0'), title: 'Новые сериалы/серии', results: [] });
        }
        if (Lampa.Storage.get('pva_sources_main_add_releases_mults', '0') > 0) {
          Lampa.PVA.main.push({ name: 'releases_mults', source: 'releases', url: 'getSources', type: 'mults', index: Lampa.Storage.get('pva_sources_main_add_releases_mults', '0'), title: 'Новые мультфильмы/мультсериалы', results: [] });
        }
        if (Lampa.Storage.get('pva_sources_main_add_releases_amime', '0') > 0) {
          Lampa.PVA.main.push({ name: 'releases_amime', source: 'releases', url: 'getSources', type: 'amime', index: Lampa.Storage.get('pva_sources_main_add_releases_amime', '0'), title: 'Новые аниме', results: [] });
        }
        if (Lampa.Storage.get('pva_sources_main_add_releases_ru', '0') > 0) {
          Lampa.PVA.main.push({ name: 'releases_new', source: 'releases', url: 'getSources', type: 'new', filter: 'RU', index: Lampa.Storage.get('pva_sources_main_add_releases_ru', '0'), title: 'Новые русские', results: [] });
        }
        if (Lampa.Storage.get('pva_sources_main_add_releases_asia', '0') > 0) {
          Lampa.PVA.main.push({ name: 'releases_new', source: 'releases', url: 'getSources', type: 'new', filter: 'KR,CN,JP,TH,TW', index: Lampa.Storage.get('pva_sources_main_add_releases_asia', '0'), title: 'Новые азиатские', results: [] });
        }

        if (Lampa.PVA.main.length && ["tmdb", "cub"].indexOf(Lampa.Storage.get('source', 'tmdb')) >= 0) {

          var network = new Lampa.Reguest();
          Lampa.PVA.main.forEach( function (src) {
            Lampa.ContentRows.add({
              name: src.name,
              title: src.title,
              index: -1 + src.index,
              screen: ['main'],
              source: src.source,
              nomore: src.nomore || false,
              call: function call(params, screen) {
                return function (call) {
                  Lampa.Api.sources[src.source].get(src.url, Object.assign(params, { type: src.type, filter: src.filter }), function (json) {
                    json.title = src.title;
                    json.source = src.source;
                    json.url = src.url;
                    json.type = src.type;
                    json.companies = src.type;
                    json.filter = src.filter;
                    json.nomore = src.nomore || false;
                    (json.results || []).forEach( function (item) { 
                      if (!item.source) item.source = src.source;
                    });
                    call(json);
                  }, call)
                }
              }
            });
          });

        };

        // Info
        var onCreateBase = Lampa.Maker.map('Card').Ratting.onCreate;
        Lampa.Maker.map('Card').Ratting.onCreate = function() { 
          onCreateBase.apply(this);

          if (this.data.source && (this.data.source != 'cub' && this.data.source != 'tmdb')) {
            if (this.data.source) {
              var div = Lampa.Template.elem('div', { "class": 'card__source', text: this.data.source });
              this.html.find('.card__view').append(div);
            }
          }

          if (this.data && this.data.show_info == true) {
            if (this.data.number_of_seasons > 0) 
              this.html.find('.card__view').append(Lampa.Template.elem('div', { "class": 'card__seasone', text: 'Сезон ' + this.data.number_of_seasons }));
            if (this.data.number_of_episode == this.data.number_of_episodes) 
              this.html.find('.card__view').append(Lampa.Template.elem('div', { "class": 'card__episode', text: 'Завершен' }));
            else
              this.html.find('.card__view').append(Lampa.Template.elem('div', { "class": 'card__episode', text: 'Серия ' + this.data.number_of_episode + ' из ' + this.data.number_of_episodes }));
          }

        }

        // Menu
        Lampa.Menu.addButton("<svg><use xlink:href=\"#sprite-".concat('hd', "\"></use></svg>"), Lampa.Lang.translate('menu_relises')+'+', 
          function() {

            Lampa.Select.show({
              title: Lampa.Lang.translate('menu_relises')+'+',
              items: [
                { title: 'Новые фильмы', source: 'releases', url: 'getSources', type: 'new', component: 'category_full' }, 
                { title: 'Новые фильмы 4K', source: 'releases', url: 'getSources', type: 'new4K', component: 'category_full' }, 
                { title: 'Новые сериалы/серии', source: 'releases', url: 'getSources', type: 'series', component: 'category_full' },
                { title: 'Новые мультики', source: 'releases', url: 'getSources', type: 'mults', component: 'category_full' },
                { title: 'Новые аниме', source: 'releases', url: 'getSources', type: 'amime', component: 'category_full' },
                { title: 'Новые русские', source: 'releases', url: 'getSources', type: 'new', filter: 'RU', component: 'category_full' },
                { title: 'Новые азиатские', source: 'releases', url: 'getSources', type: 'new', filter: 'KR,CN,JP,TH,TW', component: 'category_full' },
              ],
              onSelect: function onSelect(b) {
                Lampa.Activity.push({
                  title: b.title,
                  url: b.url,
                  type: b.type,
                  filter: b.filter,
                  component: b.component || 'main',
                  source: b.source,
                  page: 1
                });
              },
              onBack: function onBack() {
                Lampa.Controller.toggle('menu');
              }
            });

          }
        ).addClass('ReleasesPVA').attr('data-action', 'pvareleases');


        // Settings
        Lampa.SettingsApi.addComponent({
          component: 'pva_releases_menu',
          icon: "<svg><use xlink:href=\"#sprite-".concat('hd', "\"></use></svg>"),
          name: Lampa.Lang.translate('menu_relises')+'+',
          before: 'more'
        });
        Lampa.Settings.main().update();
        [ 
          { param_name: 'pva_sources_main_add_releases_new', field_name: 'Новые фильмы в качестве' },
          { param_name: 'pva_sources_main_add_releases_new4K', field_name: 'Новые фильмы в 4K качестве' },
          { param_name: 'pva_sources_main_add_releases_series', field_name: 'Новые сериалы/серии' },
          { param_name: 'pva_sources_main_add_releases_mults', field_name: 'Новые мультфильмы/мультсериалы' },
          { param_name: 'pva_sources_main_add_releases_amime', field_name: 'Новые аниме' },
          { param_name: 'pva_sources_main_add_releases_ru', field_name: 'Новые русские' },
          { param_name: 'pva_sources_main_add_releases_asia', field_name: 'Новые азиатские' },
        ].forEach( function (item) {
          Lampa.SettingsApi.addParam({
            component: 'pva_releases_menu',
            param: {
              name: item.param_name,
              type: 'select', //доступно select,input,trigger,title,static
              values: {  
                  0: 'выключено',
                  1: '0',
                  2: '1', 
                  3: '2',
                  4: '3',
                  5: '4',
                  6: '5',
                  7: '6',
                  8: '7',
                  9: '8',
                  10: '9',
                  11: '10',
              },  
              placeholder: 'settings_cub_not_specified',
              default: '0'
            },
            field: {
              name: item.field_name,
              description: (item.description ? item.description : 'Порядковый номер для вывода строки')
            },
            onChange: function (value) {
            }
          });
        });

        Lampa.SettingsApi.addParam({
          component: 'pva_releases_menu',
          param: {
            name: 'pva_releases_over_cloudflare',
            type: 'trigger', //доступно select,input,trigger,title,static
            default: false
          },
          field: {
            name: 'Cloudflare',
            description: 'Получать данные через Cloudflare'
          },
          onChange: function (value) {
          }
        });


      }

      function override() {
        var style = document.createElement('style');
        style.textContent = "\
          .card__source { \
            position: absolute; \
            left: 0.1em; \
            bottom: 0.3em; \
            background: rgba(0, 0, 0, 0.5); \
            color: #fff; \
            font-size: 1.0em; \
            font-weight: 700; \
            padding: 0.2em 0.5em; \
            -webkit-border-radius: 1em; \
               -moz-border-radius: 1em; \
                    border-radius: 1em; \
            z-index: 1; \
          } \
          .card__seasone { \
            position: absolute; \
            left: -0.8em; \
            top: 20%; \
            padding: 0.4em 0.4em; \
            background: rgba(32, 36, 43, 0.75); \
            color: #fff; \
            font-size: 0.8em; \
            font-weight: medium; \
            -webkit-border-radius: 0.3em; \
               -moz-border-radius: 0.3em; \
                    border-radius: 0.3em; \
            z-index: 1; \
          } \
          .card__episode { \
            position: absolute; \
            left: -0.8em; \
            top: 30%; \
            padding: 0.4em 0.4em; \
            background: rgba(32, 36, 43, 0.75); \
            color: #fff; \
            font-size: 0.8em; \
            font-weight: medium; \
            -webkit-border-radius: 0.3em; \
               -moz-border-radius: 0.3em; \
                    border-radius: 0.3em; \
            z-index: 1; \
          } \
        ";
        document.head.appendChild(style);
      }

      if (window.appready) { override(); add(); } else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'start') { override(); }
          if (e.type == 'ready') { add(); }
        });
      }
    }

    if (!window.plugin_pvareleases_ready && !window.plugin_sources_ready) startPlugin();

})( 'http://freebie.tom.ru', '999', '[REQUEST_SCHEME]', '[HTTP_HOST]', 'https://freebie.tom.ru', 'https://cache.freebie.tom.ru' );
