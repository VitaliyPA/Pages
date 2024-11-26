(function (  ) {
    'use strict';

    function startPlugin() {
      window.plugin_tmdb_mod_ready = true;

      var SourceTMDB = function (parrent) {
        this.network = new Lampa.Reguest();
        this.discovery = false;

        this.main = function () {
          var owner = this;
          var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
          var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
          var onerror = arguments.length > 2 ? arguments[2] : undefined;
          var parts_limit = 6;
          var parts_data = [
            function (call) {
              owner.get('movie/now_playing', params, function (json) {
                json.title = Lampa.Lang.translate('title_now_watch');
                call(json);
              }, call);
            },
            function (call) {
              call({
                results: Lampa.TimeTable.lately().slice(0, 20),
                title: Lampa.Lang.translate('title_upcoming_episodes'),
                nomore: true,
                cardClass: function cardClass(_elem, _params) { return new Episode(_elem, _params); }
              })
            },
            function (call) {
              owner.get('trending/all/day', params, function (json) {
                json.title = Lampa.Lang.translate('title_trend_day');
                call(json);
              }, call);
            },
            function (call) {
              owner.get('trending/all/week', params, function (json) {
                json.title = Lampa.Lang.translate('title_trend_week');
                call(json);
              }, call);
            },
            function (call) {
              owner.get('discover/movie?with_original_language=ru&sort_by=primary_release_date.desc&primary_release_date.lte='+(new Date()).toISOString().substr(0,10), params, function (json) {
                json.title = Lampa.Lang.translate('menu_movies');
                call(json);
              }, call);
            },
            function (call) {
              owner.get('discover/tv?with_original_language=ru&sort_by=first_air_date.desc', params, function (json) {
                json.title = Lampa.Lang.translate('menu_tv');
                call(json);
              }, call);
            },
            function (call) {
              owner.get('discover/tv?with_networks=3827|2493|3871|5806|4085&sort_by=first_air_date.desc', params, function (json) {
                json.title = Lampa.Lang.translate('title_top_tv');
                call(json);
              }, call);
            },
            function (call) {
              owner.get('discover/tv?with_networks=213&region=RU|XX&sort_by=first_air_date.desc&air_date.lte='+(new Date()).toISOString().substr(0,10), params, function (json) {
                json.title = Lampa.Lang.translate('Netflix');
                call(json);
              }, call);
            },
          ];

          Lampa.Arrays.insert(parts_data, 0, Lampa.Api.partPersons(parts_data, parts_data.length-1, 'movie'));
          parrent.genres.movie.forEach(function (genre) {
            var event = function event(call) {
              owner.get('discover/movie?with_genres=' + genre.id, params, function (json) {
                json.title = Lampa.Lang.translate(genre.title.replace(/[^a-z_]/g, ''));
                call(json);
              }, call);
            };
            parts_data.push(event);
          });

          function loadPart(partLoaded, partEmpty) {
            Lampa.Api.partNext(parts_data, parts_limit, partLoaded, partEmpty);
          }

          loadPart(oncomplite, onerror);
          return loadPart;
        }
      }

      function add() {
        var tmdb_mod = Object.assign({}, Lampa.Api.sources.tmdb, new SourceTMDB(Lampa.Api.sources.tmdb));
        Lampa.Api.sources.tmdb_mod = tmdb_mod;
        Object.defineProperty(Lampa.Api.sources, 'tmdb_mod', {
          get: function get() {
            return tmdb_mod;
          }
        });
        Lampa.Params.select('source', Object.assign({}, Lampa.Params.values['source'], {'tmdb_mod': 'TMDB_MOD'}), 'tmdb');
      }

      if (window.appready) add(); else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') { add(); }
        });
      }
    }

    if (!window.plugin_tmdb_mod_ready) startPlugin();

})( );
