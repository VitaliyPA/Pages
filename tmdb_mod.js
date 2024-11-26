(function (  ) {
    'use strict';

    function startPlugin() {
      window.plugin_tmdb_mod_ready = true;

      var Episode = function(data) {
        var card, episode;
        if (data && data.card && data.card.source && data.card.source == 'tmdb_mod') {
          card = data.card;
          episode = data.episode;
          Lampa.Arrays.extend(card, {
            title: card.name,
            original_title: card.original_name,
            release_date: card.first_air_date
          });
          card.release_year = ((card.release_date || '0000') + '').slice(0, 4);
          card.source = 'tmdb';
        }
        else {
          card = data;
          episode = data.next_episode_to_air || {};
          Lampa.Arrays.extend(card, {
            title: card.name,
            original_title: card.original_name,
            release_date: card.first_air_date
          });
          card.release_year = ((card.release_date || '0000') + '').slice(0, 4);
        }

        function remove(elem) {
          if (elem) elem.remove();
        }

        this.build = function () {
          this.card = Lampa.Template.js('card_episode');
          this.img_poster = this.card.querySelector('.card__img') || {};
          this.img_episode = this.card.querySelector('.full-episode__img img') || {};
          this.card.querySelector('.card__title').innerText = card.title;
          this.card.querySelector('.full-episode__num').innerText = card.unwatched || '';
          if (episode && episode.air_date) {
            this.card.querySelector('.full-episode__name').innerText = ('s' + (episode.season_number || '?') + 'e' + (episode.episode_number || '?') + '. ') + (episode.name || Lampa.Lang.translate('noname'));
            this.card.querySelector('.full-episode__date').innerText = episode.air_date ? Lampa.Utils.parseTime(episode.air_date).full : '----';
          }

          if (card.release_year == '0000') {
            remove(this.card.querySelector('.card__age'));
          } else {
            this.card.querySelector('.card__age').innerText = card.release_year;
          }

          this.card.addEventListener('visible', this.visible.bind(this));
        };

        this.image = function () {
          var _this = this;
          this.img_poster.onload = function () {
          };
          this.img_poster.onerror = function () {
            _this.img_poster.src = './img/img_broken.svg';
          };
          this.img_episode.onload = function () {
            _this.card.querySelector('.full-episode__img').classList.add('full-episode__img--loaded');
          };
          this.img_episode.onerror = function () {
            _this.img_episode.src = './img/img_broken.svg';
          };
        };

        this.create = function () {
          var _this2 = this;
          this.build();
          this.card.addEventListener('hover:focus', function () {
            if (_this2.onFocus) _this2.onFocus(_this2.card, card);
          });
          this.card.addEventListener('hover:hover', function () {
            if (_this2.onHover) _this2.onHover(_this2.card, card);
          });
          this.card.addEventListener('hover:enter', function () {
            if (_this2.onEnter) _this2.onEnter(_this2.card, card);
          });
          this.image();
        };

        this.visible = function () {
          if (card.poster) this.img_poster.src = card.poster;
            else if (card.img) this.img_poster.src = card.img;
            else this.img_poster.src = './img/img_broken.svg';
          if (episode.img) this.img_episode.src = episode.img;
            else if (card.img) this.img_episode.src = card.img;
            else this.img_episode.src = './img/img_broken.svg';
          if (this.onVisible) this.onVisible(this.card, card);
        };

        this.destroy = function () {
          this.img_poster.onerror = function () {};
          this.img_poster.onload = function () {};
          this.img_episode.onerror = function () {};
          this.img_episode.onload = function () {};
          this.img_poster.src = '';
          this.img_episode.src = '';
          remove(this.card);
          this.card = null;
          this.img_poster = null;
          this.img_episode = null;
        };

        this.render = function (js) {
          return js ? this.card : $(this.card);
        };
      }

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
                source: 'tmdb',
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
