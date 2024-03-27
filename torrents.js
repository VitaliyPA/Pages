(function (  ) {
    'use strict';

    function startPlugin() {
      window.plugin_torrents_ready = true;

      function add() {

        function button_click(data) {
          var year = ((data.movie.first_air_date || data.movie.release_date || '0000') + '').slice(0, 4);
          var combinations = {
            'df': data.movie.original_title,
            'df_year': data.movie.original_title + ' ' + year,
            'df_lg': data.movie.original_title + ' ' + data.movie.title,
            'df_lg_year': data.movie.original_title + ' ' + data.movie.title + ' ' + year,
            'lg': data.movie.title,
            'lg_year': data.movie.title + ' ' + year,
            'lg_df': data.movie.title + ' ' + data.movie.original_title,
            'lg_df_year': data.movie.title + ' ' + data.movie.original_title + ' ' + year
          };
          Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_torrents')+' 1',
            component: 'torrents',
            search: combinations[Lampa.Storage.field('parse_lang')],
            search_one: data.movie.title,
            search_two: data.movie.original_title,
            movie: data.movie,
            page: 1
          });
        };

        Lampa.Listener.follow('full', function (e) {
          if (e.type == 'complite') {
            var button = "<div class=\"full-start__button view--torrent\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\"  viewBox=\"0 0 50 50\" width=\"50px\" height=\"50px\">\n                        <path d=\"M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M40.5,30.963c-3.1,0-4.9-2.4-4.9-2.4 S34.1,35,27,35c-1.4,0-3.6-0.837-3.6-0.837l4.17,9.643C26.727,43.92,25.874,44,25,44c-2.157,0-4.222-0.377-6.155-1.039L9.237,16.851 c0,0-0.7-1.2,0.4-1.5c1.1-0.3,5.4-1.2,5.4-1.2s1.475-0.494,1.8,0.5c0.5,1.3,4.063,11.112,4.063,11.112S22.6,29,27.4,29 c4.7,0,5.9-3.437,5.7-3.937c-1.2-3-4.993-11.862-4.993-11.862s-0.6-1.1,0.8-1.4c1.4-0.3,3.8-0.7,3.8-0.7s1.105-0.163,1.6,0.8 c0.738,1.437,5.193,11.262,5.193,11.262s1.1,2.9,3.3,2.9c0.464,0,0.834-0.046,1.152-0.104c-0.082,1.635-0.348,3.221-0.817,4.722 C42.541,30.867,41.756,30.963,40.5,30.963z\" fill=\"currentColor\"/>\n                    </svg>\n\n    <span>#{full_torrents} 2</span>\n    </div>";
            var btn = $(Lampa.Lang.translate(button));
            btn.on('hover:enter', function () {
              try { 
                var jackett = { jackett_url: Lampa.Storage.get('jackett_url', ''), jackett_key: Lampa.Storage.get('jackett_key', '') };  
                Lampa.Storage.set('jackett_url', Lampa.Storage.get('jackett_url_pva', '') );
                Lampa.Storage.set('jackett_key', Lampa.Storage.get('jackett_key_pva', '') );
                button_click(e.data); 
              } 
              finally { 
                Lampa.Storage.set('jackett_url', jackett.jackett_url);
                Lampa.Storage.set('jackett_key', jackett.jackett_key);
              }
            });
            if (e.data)
              e.object.activity.render().find('.view--torrent').after(btn);
          }
        });

        Lampa.SettingsApi.addParam({
          component: 'parser',
          param: {
            name: 'jackett_url_pva',
            type: 'input', //доступно select,input,trigger,title,static
            value: '',
            default: ''
          },
          field: {
            name: Lampa.Lang.translate('settings_parser_jackett_link')+' 2',
            description: Lampa.Lang.translate('settings_parser_jackett_link_descr')+' 2'
          },
          onChange: function (value) {
          }
        });
        Lampa.SettingsApi.addParam({
          component: 'parser',
          param: {
            name: 'jackett_key_pva',
            type: 'input', //доступно select,input,trigger,title,static
            value: '',
            default: ''
          },
          field: {
            name: Lampa.Lang.translate('settings_parser_jackett_key')+' 2',
            description: Lampa.Lang.translate('settings_parser_jackett_key_descr')+' 2'
          },
          onChange: function (value) {
          }
        });
        Lampa.Params.select('jackett_url_pva', '', 'jacred.ru');
        Lampa.Params.select('jackett_key_pva', '', '');
        Lampa.Settings.main().update();

      }

      if (window.appready) add(); else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') { add(); }
        });
      }
    }

    if (!window.plugin_torrents_ready) startPlugin();

})( );
