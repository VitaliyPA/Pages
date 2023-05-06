(function () {
    'use strict';
    var backendhost = 'http://back.freebie.tom.ru'; //backendhost = 'http://192.168.1.100:3333';

    function Filmix(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var results = [];
      var object = _object;
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        quality: 0
      };
        var url_api = 'http://filmixapp.cyou/api/v2/';
        var token = '?user_dev_apk=2.0.9&user_dev_id=' + Lampa.Utils.uid(16) + '&user_dev_name=Xiaomi&user_dev_os=12&user_dev_token=aaaabbbbccccddddeeeeffffaaaabbbb&user_dev_vendor=Xiaomi';
        var online_token = Lampa.Storage.get('filmix_token', '');
        if (online_token.length === 32 && token.indexOf('aaaabbbbccccddddeeeeffff') !== -1) { token = token.replace('aaaabbbbccccddddeeeeffffaaaabbbb', online_token); };
        if (!window.filmix || !window.filmix.is_my) window.filmix = { max_qualitie: 480, is_max_qualitie: false, is_my: true, replace: false, enable: false }
      /**
       * Поиск
       * @param {Object} _object
       */


      this.search = function (_object, title, similar) {
        object = _object;
        // console.log('title', title, 'object.filmix_id', object.filmix_id, 'similar', similar);
        if (object.movie.id == 83867) title = 161121;

        if (!window.filmix.is_max_qualitie && token.indexOf('aaaabbbbccccddddeeeeffff') == -1) {
          window.filmix.is_max_qualitie = true;
          network.clear(); network.timeout(15000);
          network["native"]( (url_api + 'user_profile' + token), function(found) {
            if (found && found.user_data) {
              window.filmix.max_qualitie = 720;
              if (found.user_data.is_pro) window.filmix.max_qualitie = 1080;
              if (found.user_data.is_pro_plus) window.filmix.max_qualitie = 2160;
            }
            component.search(object, title);
          }, function (a, c) {
            component.empty(network.errorDecode(a, c));
          });
          return;
        }

        if (typeof(title) === 'object') title = title.pop().id;

        if (isNaN(title) === true) {

            var url = Lampa.Utils.addUrlComponent( 'http://filmixapp.cyou/api/v2/search'+token , 'story=' + encodeURIComponent(cleanTitle(title)));
            network.clear(); network.timeout(15000);
            network["native"]( url, function (found) {

              //console.log('found', found);
              if (found) {
                var json = (typeof(found) === 'string' ? JSON.parse(found) : found);
                if (json.length > 1) {

                  var relise = object.search_date || (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
                  var year = parseInt((relise + '').slice(0, 4));
                  var json_filter = json.filter(function (elem) { return (elem.title == title || elem.original_title == title) && elem.year == year } );
                  if (json_filter.length == 0) json_filter = json.filter(function (elem) { return (elem.title == title || elem.original_title == title) && elem.year >= year-1 && elem.year <= year+1  } );
                  if (json_filter.length == 0) json_filter = json.filter(function (elem) { return elem.title == title || elem.original_title == title; } );
                  if (json_filter.length == 1) {
                    object.filmix_id = json_filter.pop().id;
                    component.search(object, parseInt(object.filmix_id));
                    component.loading(false);
                    return;
                  }
                  if (json_filter.length > 0) json = json_filter;

                  var similars = [];
                  json.forEach(function (film) {
                    similars.push({
                      id: film.id,
                      title: film.title + (film.year ? ', '+film.year : '') + (film.countries ? ', '+film.countries : '') + (film.categories ? ', '+film.categories : ''),
                      year: film.year,
                      //link: film.link,
                      filmId: film.id
                    });
                  });
                  component.similars(similars);
                  component.loading(false);
                  return;
                } else if (json.length === 1) {
                  object.filmix_id = json.pop().id;
                  component.loading(false);
                  component.search(object, parseInt(object.filmix_id));
                  return;
                } else {
                    // Empty
                }
              }
              component.loading(false);
              if (!Lampa.Arrays.getKeys(results).length) component.empty(found.error ? found.error : 'По запросу ('+object.search+') нет результатов');
          }, function (a, c) {
            component.empty(network.errorDecode(a, c));
          });

        } else {

          object.filmix_id = title;
          if ( window.filmix.max_qualitie == 480 ) { token = token.replace(/user_dev_token=.+?&/, 'user_dev_token=807fe4ac46fe7fcff3fbced840fa5744&'); window.filmix.max_qualitie = 720; }

          var url = (window.filmix.is_max_qualitie ? url_api+'post/'+object.filmix_id+token : url_api+'post/'+object.filmix_id+token);
          network.clear(); network.timeout(15000);
          network.silent( url, function (found) {
            //console.log('found',found);
            if (found) {
              var json = (typeof(found) === 'string' ? JSON.parse(found) : found);
              results = json;
              success(json);
            }
            component.loading(false);
            if (!Lampa.Arrays.getKeys(results).length) component.empty(found.error ? found.error : 'По запросу ('+object.search+') нет результатов');
          }, function (a, c) {
            component.empty(network.errorDecode(a, c));
          });

        }
      };

      function cleanTitle(str) {
        return str.replace(/[.,?<>!@#$%^&*()]/g, '');
      }


      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
      };
      /**
       * Сброс фильтра
       */


      this.reset = function () {
        component.reset();
        choice = {
          season: 0,
          voice: 0,
          voice_name: '',
          quality: 0
        };
        filter();
        append(filtred());
        component.saveChoice(choice);
      };
      /**
       * Применить фильтр
       * @param {*} type
       * @param {*} a
       * @param {*} b
       */


      this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        if (a.stype == 'voice') choice.voice_name = filter_items.voice[b.index];
        component.reset();
        filter();
        append(filtred());
        component.saveChoice(choice);
      };
      /**
       * Уничтожить
       */


      this.destroy = function () {
        network.clear();
        results = null;
      };
      /**
       * Успешно, есть данные
       * @param {Object} json
       */


      function success(json) {
        results = json;
        extractData(json);
        filter();
        append(filtred());
        component.saveChoice(choice);
      }
      /**
       * Получить потоки
       * @param {String} str
       * @param {Int} max_quality
       * @returns string
       */


      function extractData(json) {
        var last_episode = json.last_episode;
        var player_links = json.player_links;

        if (player_links.playlist && Lampa.Arrays.getKeys(player_links.playlist).length > 0) {
          results.serial = 1;
          results.translations = [];
          results.seasons = [];
          Object.entries(player_links.playlist).forEach(function (seasons) {
            var keys = Math.abs(seasons[0]);
            if (results.seasons.indexOf(keys) == -1) results.seasons.push(keys);
            //console.log('keys', keys, 'season', seasons[1]);
            Object.entries(seasons[1]).forEach(function (translations) {
              var keyt, translation = translations[0];
              //console.log('keyt', keyt, 'translation', translation);

              if (results.translations.indexOf(translation) == -1) {
                results.translations.push(translation);
                keyt = results.translations.indexOf(translation);
                extract[keyt] = { json : [], "file": "", translation_id: keyt, translation: translation };
              }
              else keyt = results.translations.indexOf(translation);

              var folder = [];
              Object.entries(translations[1]).forEach(function (episodes, keye) {
                var keye = episodes[0], episode = episodes[1];
                //console.log('keye', keye, 'episode', episode);

                if (window.filmix.replace) {
                    var match = episode.link.match(/\/.\/(.*?)\//);
                    if (match) episode.link = episode.link.replace(match[1], window.filmix.hash);
                }

                var qualities = episode.qualities.filter( function(elem) { return parseInt(elem) <= window.filmix.max_qualitie && parseInt(elem) !== 0 }).
                    sort(function(a, b) { if (parseInt(a) > parseInt(b)) return 1; else if (parseInt(a) < parseInt(b)) return -1; else return 0; });
                var qualitie = (qualities.length > 0 ? Math.max.apply(null, qualities) : 0);
                var link = episode.link.replace('%s.mp4',qualitie+'.mp4');

                folder[keye] = {
                    "id": keys + '_' + keye,
                    "comment": keye + ' ' + Lampa.Lang.translate('torrent_serial_episode') + ' <i>' + qualitie + '</i>',
                    "file": link,
                    "episode": keye,
                    "season": keys,
                    "quality": qualitie,
                    "qualities": qualities,
                    "translation": keyt, //translation,
                };
              })
              extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };
            })
          })
        } else if (player_links.movie && player_links.movie.length > 0) {
          results.serial = 0;
          Object.entries(player_links.movie).forEach(function (translations) {
            var translation = translations[0], movie = translations[1];
            // console.log('translation', translation, 'movie', movie);

            if (window.filmix.replace) {
                var match = movie.link.match(/\/.\/(.*?)\//);
                if (match) movie.link = movie.link.replace(match[1], window.filmix.hash);
            }

            var qualities = movie.link.match(/.+\[(.+[\d]),*\].+/i);
            if (qualities) qualities = qualities[1].split(",").filter( function (elem) { return parseInt(elem) <= window.filmix.max_qualitie && parseInt(elem) !== 0 }).
                sort(function(a, b) { if (parseInt(a) > parseInt(b)) return 1; else if (parseInt(a) < parseInt(b)) return -1; else return 0; });
            var qualitie = (qualities.length > 0 ? Math.max.apply(null, qualities) : 0);
            var link = movie.link.replace(/\[(.+[\d]),*\]/i, qualitie);

            extract[translation] = { json : {}, "file": link, translation : movie.translation, "quality": qualitie, "qualities": qualities };
          })
        }
      }
      /**
       * Найти поток
       * @param {Object} element
       * @param {Int} max_quality
       * @returns string
       */


      function getFile(element, max_quality) {
        var file = '';
        var quality = false;
        var qualities =null;
        var select_quality = 2160;

        //console.log('element', element);
        if (element.season) {
          file = extract[element.translation].json[element.season].folder[element.episode].file;
          qualities = extract[element.translation].json[element.season].folder[element.episode].qualities;
          max_quality = extract[element.translation].json[element.season].folder[element.episode].quality;
        }
        else {
          file = extract[element.translation].file;
          qualities = extract[element.translation].qualities;
          max_quality = extract[element.translation].quality;
          var filter_data = Lampa.Storage.get('online_filter', '{}');
          select_quality = parseInt(filter_items.quality[filter_data.quality]);
        }
        //console.log('file', file, 'qualities', qualities);

        var preferably = parseInt(Lampa.Storage.get('video_quality_default', '2160'));
        if (select_quality > preferably) select_quality = preferably;

        var file_filtred = file;
        if (file) {
          quality = {};
          for (var n in qualities) {
            if (parseInt(qualities[n]) <= parseInt(select_quality)) {
              quality[qualities[n]+'p'] = file.replace( new RegExp(max_quality+'.mp4', 'ig'), qualities[n]+'.mp4');
              file_filtred = quality[qualities[n]+'p'] ;
            }
          };
        }
        return {
          file: file_filtred,
          quality: quality
        };
      }
      /**
       * Построить фильтр
       */


      function filter() {
        filter_items = {
          season: [],
          voice: [],
          voice_info: [],
          quality : []
        };

        if (results.serial == 0) {

          var qualities = ['480','720','1080','1440','2160'];
          for( var key in extract) {
            if (extract[key].quality && parseInt(results.quality) < parseInt(extract[key].quality)) results.quality = extract[key].quality;
          }
          if (results.quality) {
            for( var key in qualities)
              if (parseInt(results.quality) >= parseInt(qualities[key])) filter_items.quality.unshift(qualities[key]);
          }
          if (filter_items.quality.length == 0) filter_items.quality.push('720');

        } else {

          if (results.seasons)
            results.seasons.forEach(function (season) {
              filter_items.season.sort(function(a, b){ return a - b; }).push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (season));
            })

          if (results.translations)
            results.translations.forEach(function (translation, keyt) {
              var season = filter_items.season[choice.season].split(' ').pop();
              if (extract[keyt].json[season]) {
                if (filter_items.voice.indexOf(translation) == -1) {
                  filter_items.voice[keyt] = translation;
                  filter_items.voice_info[keyt] = { id: keyt };
                }
              }
            })

          if (filter_items.voice_info.length > 0 && !filter_items.voice_info[choice.voice]) {
            choice.voice = undefined;
            filter_items.voice_info.forEach( function (voice_info) {
              if (choice.voice == undefined) choice.voice = voice_info.id;
            })
          }

        }
        component.filter(filter_items, choice);
        // console.log('filter_items', filter_items);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        if (results.serial == 1) {
          for( var keym in extract) {
            var movie = extract[keym];
            for( var keye in movie.json) {
              var episode = movie.json[keye];
              if (episode.id == filter_data.season + 1) {
                episode.folder.forEach( function (media) {
                  if (media.translation == filter_items.voice_info[filter_data.voice].id) {
                    filtred.push({
                      episode: parseInt(media.episode),
                      season: media.season,
                      title: media.episode + (media.title ? ' - ' + media.title : ''),
                      quality: media.quality + 'p',
                      translation: media.translation
                    });
                  }
                });
              }
            };
          };
        } else if (results.player_links.movie && results.player_links.movie.length > 0) {
          for( var keym in extract) {
            var movie = extract[keym];

            var select_quality = parseInt(filter_items.quality[filter_data.quality]);
            var qualities = movie.qualities.filter( function (elem) { return parseInt(elem) <= select_quality });
            var qualitie = (qualities.length > 0 ? Math.max.apply(null, qualities) : 0);
            if (qualitie) {
              filtred.push({
                title: movie.translation,
                quality: movie.quality + 'p => ' + qualitie + 'p',
                translation: keym,
              });
            }
          };
        }
        return filtred;
      }
      /**
       * Добавить видео
       * @param {Array} items
       */


      function append(items) {
        if (items.length == 0) { component.empty('В карточке пусто'); return; }
        if (object.seasons == undefined) object.seasons = {};
        if (object.movie.number_of_seasons && object.seasons[choice.season+1] == undefined) {
          object.seasons[choice.season+1] = [];
          component.getEpisodes(object, component, network, choice.season+1, function (episodes) {
            object.seasons[choice.season+1] = episodes;
            append(items);
            setTimeout(component.closeFilter, 25);
          })
          return;
        }
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var last_episode = component.getLastEpisode(items);
        items.forEach(function (element) {
          if (element.season) element.title = 'S' + element.season + '-E' + element.episode + ' / ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.episode;
          if (element.season != undefined && object.seasons[choice.season+1] != undefined && object.seasons[choice.season+1][element.episode-1] != undefined)
              element.title = 'S' + element.season + '-E' + element.episode + ' / ' + object.seasons[choice.season+1][element.episode-1].name;
          element.info = element.season ? ' / ' + Lampa.Utils.shortText(filter_items.voice[choice.voice], 50) : '';

          if (element.season) {
            element.translate_episode_end = last_episode;
            element.translate_voice = filter_items.voice[choice.voice];
          }

          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
          item.addClass('video--stream');
          element.timeline = view;
          item.append(Lampa.Timeline.render(view));

          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }

          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            var extra = getFile(element, element.quality);

            if (extra.file) {
              var playlist = [];
              var first = {
                url: extra.file,
                quality: extra.quality,
                timeline: view,
                title: element.season ? element.title : object.movie.title + ' / ' + element.title
              };

              if (element.season) {
                items.forEach(function (elem) {
                  var ex = getFile(elem, elem.quality);
                  playlist.push({
                    title: elem.title,
                    url: ex.file,
                    quality: ex.quality,
                    timeline: elem.timeline
                  });
                });
              } else {
                playlist.push(first);
              }

              if (playlist.length > 1) first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);

              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));
          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            element: element,
            file: function file(call) {
              call(getFile(element, element.quality));
            }
          });
        });
        component.start(true);
      }

    };

    function Balanser(component, _object) {
      this.network = new Lampa.Reguest();
      this.extract = [];
      this.results = [];
      this.object = _object;
      this.filter_items = {};
      this.choice = {
        season: 0,
        voice: 0,
        quality: 0
      };
      this.translations = [];
      this.android = false;


      /**
       * Поиск
       * @param {Object} _object
       */
      this.search = function (object, kinopoisk_id, similar) {
        // console.log('kinopoisk_id', kinopoisk_id, 'similar', similar);
        this.object = object;
        var _this = this;

        var url = this.backend + '&source=' + object.movie.source;
        if (typeof(similar) == 'object' && similar.slice().pop().link) {
          var sim = similar.slice().pop();
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&link=' + sim.link + '&filmId=' + sim.id;
        } else {
          if ((object.kinopoisk_id || kinopoisk_id || 0) == 0 && object.search.length < 3) { component.empty('title (' + object.search + ') is smoll'); return; }
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || kinopoisk_id || 0) + '&title=' + encodeURIComponent(object.search);
          if (object.movie.source == 'tmdb' || object.movie.source == 'cub') url += '&serial=' + (object.movie.number_of_seasons ? 1 : 0);
          var relise = (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
          var year = parseInt((relise + '').slice(0, 4));
          url += '&year=' + year;
        }

        component.loading(true);
        this.network.clear(); this.network.timeout(15000);
        this.network["native"]( url, function (found) {
            // console.log('found', found);
            if (found && found.result) {
                if (found.action === 'select') {
                    var json = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
                    var similars = [];
                    json.forEach(function (film) {
                      similars.push({
                        id: film.id,
                        title: film.title + (film.link.indexOf('/serials/') != -1 ? ', Сериал' : '')+ (film.country ? ', '+film.country : '') + (film.category ? ', '+film.category : '') + (film.year ? ', '+film.year : '') ,
                        year: film.year,
                        link: film.link,
                        filmId: film.id,
                      });
                    });
                    component.similars(similars);
                    component.loading(false);
                    return;
                } else if (found.action === 'done') {
                    _this.results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
                    object.balanser_id = found.balanser_id || found.kpid;
                    //console.log('results', results);
                    if (_this.results.length > 0) _this.success(_this.results);
                }
            }
            component.loading(false);
            if (!Lampa.Arrays.getKeys(_this.results).length) (found.error ? component.empty(found.error) : component.emptyForQuery(object.search));
        }, function (a, c) {
          component.empty(_this.network.errorDecode(a, c));
        });        
      };


      /**
       * extendChoice
       */
      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(this.choice, saved, true);
      };


      /**
       * Сброс фильтра
       */
      this.reset = function () {
        component.reset();
        this.choice = {
          season: 0,
          voice: 0,
          quality: 0
        };
        this.filters();
        this.append(this.filtred());
        component.saveChoice(this.choice);
      };


      /**
       * Применить фильтр
       * @param {*} type
       * @param {*} a
       * @param {*} b
       */
      this.filter = function (type, a, b) {
        this.choice[a.stype] = b.index;
        if (a.stype == 'voice') this.choice.voice_name = this.filter_items.voice[b.index];
        if (this.getTranslationEpisodes == undefined) {
          component.reset();
          this.filters();
          this.append(this.filtred());
          component.saveChoice(this.choice);
        } else {
          var _this = this;
          this.getTranslationEpisodes(this.choice.voice, function () {
            component.reset();
            _this.filters();
            _this.append(_this.filtred());
            component.saveChoice(_this.choice);
          });
        }
      };


      /**
       * Уничтожить
       */
      this.destroy = function () {
        this.network.clear();
        this.extract = null;
        this.results = null;
      };


      /**
       * Успешно, есть данные
       * @param {Object} json
       */
      this.success = function (json) {
        // уже присвоен results = json;
        this.extractData(json);

        if (this.getTranslationEpisodes == undefined) {
          this.filters();
          this.append(this.filtred());
          component.saveChoice(this.choice);
        } else {
          var _this = this;
          this.getTranslationEpisodes(this.choice.voice, function () {
            component.reset();
            _this.filters();
            _this.append(_this.filtred());
            component.saveChoice(_this.choice);
          });
        }

        if (this.success_show) Lampa.Noty.show(this.success_show);
      }


      /**
       * Получить потоки
       * @param {JSON} json
       * @returns string
       */
      this.extractData = function (json) {
        var _this = this;
        this.extract = [];
        this.translations = [];

        this.results.forEach( function (translation, keyt) {
          if (translation == null) return;
          // console.log('translation', translation);
         
          if (_this.translations.indexOf(translation) == -1) { _this.translations[keyt] = translation.translation; }

          if (translation.serial == 1) {
            _this.extract[keyt] = { json : [], "file": translation.link, 'serial': translation.serial, translation : translation.translation, null_season: translation.null_season }
            translation.playlists.forEach(function (seasons, keys) {
              if (seasons == null) return;
              //console.log('keys', keys, 'seasons', seasons);

              _this.extract[keyt].last_season = keys;
              var folder = [];
              seasons.forEach(function (episode, keye) {
                if (episode == null) return;
                //console.log('keye', keye, 'episode', episode);

                  var qualities = Lampa.Arrays.getKeys(episode);
                  //if (qualities) qualities = qualities.filter( function (elem) { return parseInt(elem) <= parseInt(????) && parseInt(elem) !== 0 });
                  // var qualitie = (qualities.length > 0 ? Math.max.apply(null, qualities) : 0);
                  // if (isNaN(qualitie) && qualities.length > 0) qualitie = qualities.splice(-1).pop();
                  var qualitie = qualities.slice(-1).pop();
                  var link = episode[qualitie];

                  folder[keye] = {
                    "id": keys + '_' + keye,
                    "comment": keye + ' ' + Lampa.Lang.translate('torrent_serial_episode') + ' <i>' + qualitie + '</i>',
                    "file": link,
                    "episode": keye,
                    "season": keys,
                    "quality": qualitie,
                    "qualities": qualities,
                    "translation": keyt, //translation,
                    "subtitles": (translation.subtitles ? translation.subtitles[keys + '_' + keye] : undefined),
                  };

              })
              _this.extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };
            })
          } else if (translation.serial == 0) {
            var qualities = (translation.playlists == undefined ? [] : Lampa.Arrays.getKeys(translation.playlists));
            if (qualities.length > 0) {
              var qualitie = qualities.slice(-1).pop();
              var link = translation.playlists[qualitie];
              _this.extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            } else {
              if (_this.qualities) {
                qualities = _this.qualities.filter( function (elem) { return parseInt(elem) <= parseInt(translation.max_qual) && parseInt(elem) !== 0 });
                translation.quality = translation.max_qual;
              }
              var qualitie = translation.quality;
              var link = 'link';
              _this.extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            }
          }
        })
        // console.log('extract', this.extract);
      }


      /**
       * Найти поток
       * @param {Object} element
       * @param {Int} max_quality
       * @returns string
       */
      this.getFile = function (element, max_quality) {
        var owner = this;
        var file = '';
        var quality = false;
        var qualities = null;

        //console.log('element', element, 'max_quality', max_quality);
        if (element.season != undefined) {
          file = this.extract[element.translation].json[element.season].folder[element.episode].file;
          qualities = this.extract[element.translation].json[element.season].folder[element.episode].qualities;
          quality = this.results[element.translation].playlists[element.season][element.episode];
          // file = quality[max_quality];
        }
        else {
          file = this.extract[element.translation].file;
          qualities = this.extract[element.translation].qualities;
          quality = this.results[element.translation].playlists
          // file = quality[max_quality];
        }
        // console.log('file', file, 'quality', quality, 'qualities', qualities);

        var preferably = parseInt(Lampa.Storage.get('video_quality_default', '2160'));
        var file_filtred = undefined;
        var quality_filtred = {};

        qualities.forEach(function (item) {
          if (isNaN(item)) {
            var match = item.match(/(\d+)/);
            if (match) {
              if (parseInt(match[1]) <= parseInt(preferably)) {
                quality_filtred[item] = quality[item];
                file_filtred = quality_filtred[item];
              }
            } else {
              quality_filtred[item] = quality[item];
              file_filtred = quality_filtred[item];
            }
          } else if (parseInt(item) <= parseInt(preferably)) {
            quality_filtred[item+'p'] = quality[item];
            file_filtred = quality_filtred[item+'p'];
          }
        });

        return {
          file: (file_filtred || file),
          quality: (file_filtred ? quality_filtred : quality)
        };
      }


      /**
       * Построить фильтр
       */
      this.filters = function () {
        var _this = this;
        var filter_items = this.filter_items = {
          season: [],
          voice: [],
          voice_info: [],
          quality : [],
          hlsproxy: (this.hlsproxy ? this.hlsproxy.hlsproxy : undefined),
        };
        var choice = this.choice;        
        this.extract.forEach( function (translation, keyt) {
          if (translation.serial == 0) {

          } else if (translation.serial == 1) {

            var s = translation.last_season;
            while (s--) {
              if (filter_items.season.indexOf(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s)) == -1)
                filter_items.season[translation.last_season - s] = Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s);
            }
            if (translation.null_season) filter_items.season[0] = Lampa.Lang.translate('torrent_serial_season') + ' 0';

            if (translation.json[choice.season] || _this.balanser == 'HDRezka') {
              if (filter_items.voice.indexOf(translation.translation) == -1) {
                filter_items.voice[keyt] = translation.translation;
                filter_items.voice_info[keyt] = { id: keyt };
              }
            }

          }

        })

        // console.log('choice.voice', choice.voice, 'choice.season', choice.season, 'filter_items',filter_items);
        if (filter_items.voice_info.length > 0 && !filter_items.voice_info[choice.voice]) {
          choice.voice = undefined;
          filter_items.voice_info.forEach( function (voice_info) {
            if (choice.voice == undefined) choice.voice = voice_info.id;
          })
        }
        if (filter_items.voice_info.length == 0 && choice.season < filter_items.season.length) { choice.season++; this.filters(); return; }
        if (this.balanser == 'HDRezka' && this.extract[choice.voice].json[choice.season] == undefined && choice.season < filter_items.season.length) { choice.season++; this.filters(); return; }
        else if (this.balanser == 'HDRezka' && this.extract[choice.voice].json[choice.season] == undefined && choice.season > 0 && choice.season >= filter_items.season.length) { choice.season--; this.filters(); return; }
        component.filter(filter_items, choice);
      }


      /**
       * Отфильтровать файлы
       * @returns array
       */
      this.filtred = function () {
        var _this = this, filter_items = this.filter_items;
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        if (filter_data && filter_data.hlsproxy != undefined)
          if (filter_data.hlsproxy == 0) this.hlsproxy.use = false;
          else if (filter_data.hlsproxy == 1) this.hlsproxy.use = true;
          else if (filter_data.hlsproxy == 2 && window.whois.hlsproxy == false) this.hlsproxy.use = false;
          else this.hlsproxy.use = true;
        // console.log('hlsproxy.use', this.hlsproxy, filter_data);

        this.extract.forEach(function (translation, keyt) {
          if (translation == null) return;
          if (translation.serial == 1) {
            translation.json.forEach(function (seasons, keys) {
              // if ( keys == filter_data.season + 1 ) {
              if ( keys == filter_data.season ) {
                seasons.folder.forEach(function (episode, keye) {
                  if (episode.translation == filter_items.voice_info[filter_data.voice].id) {
                    filtred.push({
                      episode: parseInt(episode.episode),
                      season: episode.season,
                      title: episode.episode + (episode.title ? ' - ' + episode.title : ''),
                      quality: (episode.qualities.length > 1 || (episode.qualities.length == 1 && episode.qualities.slice(-1) == 0) ? (isNaN(episode.quality) ? episode.quality : episode.quality+'p') : '' ),
                      translation: episode.translation,
                      subtitles: _this.parseSubtitles(episode.subtitles),
                    });
                  }
                })
              }
            })
          } else {
            filtred.push({
              title: translation.translation,
              quality: (translation.qualities.length > 1 || (translation.qualities.length == 1 && translation.qualities.slice(-1) == 0) ? (isNaN(translation.quality) ? translation.quality : translation.quality+'p') : '' ),
              translation: keyt,
              subtitles: _this.parseSubtitles(translation.subtitles),
            });
          }
        })
        //console.log('filtred', filtred);
        return filtred;
      }


      /**
       * Добавить видео
       * @param {Array} items
       */
      this.append = function (items) {
        var _this = this, object = this.object, filter_items = this.filter_items, choice = this.choice;
        if (items.length == 0) { component.empty('В карточке пусто'); return; }
        if (object.seasons == undefined) object.seasons = {};
        if (object.movie.number_of_seasons && object.seasons[choice.season] == undefined) {
          this.getEpisodes(choice.season, function () {
            _this.append(items);
            setTimeout(component.closeFilter, 10);
          });
          return;
        }
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var last_episode = component.getLastEpisode(items);
        items.forEach(function (element) {
          var quality_info = (element.quality && element.quality.length > 0 ? ' / ' : '');
          if (element.season != undefined) element.title = 'S' + element.season + '-E' + element.episode + ' / ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.episode;
          if (element.season != undefined && object.seasons[choice.season] != undefined && object.seasons[choice.season][element.episode-1] != undefined)
              element.title = 'S' + element.season + '-E' + element.episode + ' / ' + object.seasons[choice.season][element.episode-1].name;
          element.info = element.season != undefined ? quality_info + filter_items.voice[choice.voice] : '';
          var hash = Lampa.Utils.hash(element.season != undefined ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season != undefined ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
          item.addClass('video--stream');
          element.timeline = view;

          if (element.season != undefined) {
            element.translate_episode_end = last_episode;
            element.translate_voice = filter_items.voice[choice.voice];
          }

          item.append(Lampa.Timeline.render(view));

          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, (element.season != undefined ? ' / ' : quality_info)));
          }

          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);

            if (element.loading) return; element.loading = true;

            if (_this.append_ext) { _this.append_ext(items, item, viewed, view, hash_file, element); return; }

            var extra = _this.getFile(element, element.quality);
            if (extra.file) {
              var playlist = [];
              var first = {
                title: element.title,
                url: extra.file,
                quality: extra.quality,
                timeline: view,
                subtitles: element.subtitles,
              };

              if (element.season != undefined && Lampa.Platform.version) {
                var playlist = [];
                items.forEach(function (elem) {
                  var ex = _this.getFile(elem, elem.quality);
                  playlist.push({
                    title: elem.title,
                    url: ex.file,
                    quality: ex.quality,
                    timeline: elem.timeline,
                    subtitles: elem.subtitles,
                  });
                });
                if (playlist.length > 1) first.playlist = playlist;
                Lampa.Player.play(first);
                Lampa.Player.playlist(playlist);
              } else {
                Lampa.Player.play(first);
                Lampa.Player.playlist([first]);
              }

              element.loading = false;

              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));

          });
          var file_call = (_this.getStream == undefined ? function file(call) { call(_this.getFile(element, element.quality)); } : function file(call) {
                  _this.getStream(element, function () {
                    var extra = _this.getFile(element, element.quality);
                    call({
                      file: extra.file,
                      quality: extra.quality,
                    });
                  }, function (error) {
                    element.loading = false;
                    Lampa.Noty.show(error || Lampa.Lang.translate('online_nolink'));
                  });
                });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            element: element,
            file: (_this.getStream == undefined ? function file(call) { call(_this.getFile(element, element.quality)); } : function file(call) {
                    _this.getStream(element, function () {
                      var extra = _this.getFile(element, element.quality);
                      call({
                        file: extra.file,
                        quality: extra.quality,
                      });
                    }, function (error) {
                      element.loading = false;
                      Lampa.Noty.show(error || Lampa.Lang.translate('online_nolink'));
                    });
                  }),
          });
        });
        component.start(true);        
      }


      /**
       * Добавить видео ext
       * @param {Array} items
       */
      this.append_call = function (items, item, viewed, view, hash_file, element) {
        var _this = this, object = this.object;

        this.getStream(element, function () {

          var extra = _this.getFile(element, element.quality);
          if (extra.file) {
            var first = {
              title: element.title,
              url: extra.file,
              quality: extra.quality,
              timeline: view,
              subtitles: element.subtitles,
            };

            if (element.season != undefined && Lampa.Platform.version) {
              var playlist = [];
              items.forEach(function (elem) {

                elem.link = _this.extract[elem.translation].json[elem.season].folder[elem.episode].file;              
                if (elem.link.startsWith('http') && (elem.link.substr(-5) === ".m3u8" || elem.link.substr(-4) === ".mp4")) {
                  var ex = _this.getFile(elem, elem.quality);
                  var cell = { url: ex.file, quality: ex.quality };
                } else if (_this.android && Lampa.Platform.is('android') && Lampa.Storage.field('player') == 'android') {
                  var cell = { url: _this.getStreamLink(elem, true) };
                } else {
                  var cell = { 
                    url: function url(call) {
                      url: _this.getStream(elem, function (extra) {
                        extra = _this.getFile(extra, extra.quality);
                        cell.url = extra.file;
                        cell.quality = extra.quality;
                        call();
                      }, function () {
                        cell.url = '';
                        call();
                      });
                    }
                  };
                }
                cell.timeline = elem.timeline;
                cell.title = elem.title;
                cell.subtitles = elem.subtitles;

                if (elem == element) cell.url = extra.file;
                playlist.push(cell);
              });
              if (playlist.length > 1 && Lampa.Platform.is('android') && Lampa.Storage.field('player') == 'android') first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);
            } else {
              Lampa.Player.play(first);
              Lampa.Player.playlist([first]);
            }

            element.loading = false;

            if (viewed.indexOf(hash_file) == -1) {
              viewed.push(hash_file);
              item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
              Lampa.Storage.set('online_view', viewed);
            }

          } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));

        }, function (error) {
          element.loading = false;
          Lampa.Noty.show(error || Lampa.Lang.translate('online_nolink'));
        });

      }


      /**
       * parse getStream
       * @param {object} element
       */
      this.getStream_call = function (element, call, error) {
        var _this = this, object = this.object, results = this.results, extract = this.extract;
        if (element.season != undefined) 
          element.link = extract[element.translation].json[element.season].folder[element.episode].file;
        else element.link = extract[element.translation].file;

        // console.log('element', element);
        if (element.link.startsWith('http') && (element.link.substr(-5) === ".m3u8" || element.link.substr(-4) === ".mp4")) {

          if ( results[element.translation].serial == 0 &&  Lampa.Arrays.getKeys(results[element.translation].playlists).length > 0)
            return call(element);
          if ( results[element.translation].serial == 1 &&  Lampa.Arrays.getKeys(results[element.translation].playlists[ element.season ][ element.episode ]).length > 0)
            return call(element);

        } else {

          var url = this.getStreamLink(element, false);
          this.network.clear(); this.network.timeout(15000);
          this.network.silent( url, function (str) {
            // console.log('str', str);

            var json = Lampa.Arrays.decodeJson(str, undefined);
            if (str == undefined) { return error(Lampa.Lang.translate('online_nolink')); }
            else if (json == undefined) { return error(str); }
            else if (json && json.error) { return error(json.error); }
            else if (json.playlists && Lampa.Arrays.getKeys(json.playlists).length === 0) return error(Lampa.Lang.translate('online_nolink'));

            var result = results[element.translation];
            if (result.serial == 1) {
              result.playlists[ element.season ][ element.episode ] = json.playlists;
              result.subtitles[ element.season+'_'+element.episode ] = json.subtitles;
              _this.success(results);
              element.link = extract[element.translation].json[ element.season ].folder[ element.episode ].file;
              element.quality = extract[element.translation].json[ element.season ].folder[ element.episode ].quality;
              element.subtitles = _this.parseSubtitles(json.subtitles);
              return call(element);
            } else {
              result.playlists = json.playlists;
              result.subtitles = json.subtitles;
              _this.success(results);
              element.link = extract[element.translation].file;
              element.quality = extract[element.translation].quality;
              element.subtitles = _this.parseSubtitles(json.subtitles);
              return call(element);
            }

          }, function (a, c) {
              return error(_this.network.errorDecode(a, c));
          },
              false, { dataType: 'text' }
          );

        };
      };


      /**
       * Получить эпизоды
       * @param {Array} items
       */
      this.getEpisodes = function (season, call) {
        var object = this.object;
        object.seasons[season] = [];
        if (typeof object.movie.id == 'number' && object.movie.name) {
          var tmdburl = 'tv/' + object.movie.id + '/season/' + season + '?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'ru');
          var baseurl = Lampa.TMDB.api(tmdburl);
          this.network.timeout(1000 * 10);
          this.network["native"](baseurl, function (data) {
            object.seasons[season] = data.episodes || [];
            call();
          }, function (a, c) {
            call();
          });
        } 
        else call();
      };


      /**
       * parse Subtitles
       * @param {String} subtitle
       */
      this.parseSubtitles = function (subtitle) {
        // console.log('subtitle', subtitle);
        if (subtitle == 'false' || subtitle == undefined || Lampa.Arrays.getKeys(subtitle).length == 0) return null;
        if (subtitle) {
          var index = -1;
          return subtitle.split(',').map(function (sb) {
            var sp = sb.split(']');
            index++;
            return {
              label: sp[0].slice(1),
              url: sp.pop().split(' or ').shift(),
              index: index
            };
          });
        }
      }

    };

    function HDRezka(component, _object) {

      Balanser.call(this, component, _object);
      this.balanser = 'HDRezka';
      this.backend = backendhost+'/lampa/hdrezkaurl?v=777';

      this.android = true;
      this.append_ext = this.append_call;
      this.getStream = this.getStream_call;

      this.getStreamLink = function (element, android) {
        var kp_id = (this.results[element.translation].kinopoisk_id || this.object.kinopoisk_id || 0);
        var url = this.backend + '&source=' + this.object.movie.source + '&id=' + this.object.movie.id + '&kinopoisk_id=' + kp_id;          
        if (kp_id == 0) url += '&filmId=' + this.object.balanser_id;
        if (android)  url += '&next=true';
        url += '&translation=' + this.results[element.translation].translation_id;
        if (element.season != undefined) url += '&season=' + element.season + '&episode=' + element.episode;
        url += '&link=' + this.results[element.translation].link;
        if (android)  url += '&name='+'/S' + element.season + '-E' + element.episode + '.m3u8';
        return url;
      }

      /**
       * Получить список серий озвучки
       * @param {Int} voice
       * @param {function} call
       * @returns null
       */
      this.getTranslationEpisodes = function(voice, call) {
        var _this = this, object = this.object;
        // console.log('getEpisodes', results[voice].getEpisodes, results[voice].serial, Lampa.Arrays.getKeys(results[voice].playlists).length);
        if (this.results[voice] == undefined) return;
        if (this.results[voice].serial == 0 || this.results[voice].getEpisodes || Lampa.Arrays.getKeys(this.results[voice].playlists).length > 0) {
          call();
        } else {
          this.results[voice].getEpisodes = true;
          this.network.clear(); this.network.timeout(20000);
          var url = this.backend + '&source=' + object.movie.source + '&id=' + object.movie.id + '&kinopoisk_id=' + (this.results[voice].kinopoisk_id || object.kinopoisk_id || 0) + '&translation=' + this.results[voice].translation_id + '&link=' + this.results[voice].link;
          this.network.silent(url, function (found) {
            //console.log('found', found);
            if (found.error) { component.empty(found.error); return; }
            if (found.action === 'done') {
              _this.results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data); _this.results[voice].getEpisodes = true;
              //console.log('results', _this.results);
              _this.extractData(_this.results);
            }
            call();
            setTimeout(component.closeFilter, 15);
          }, function (a, c) {
            component.empty(_this.network.errorDecode(a, c));
          });
        }
      }

    };

    function HDVB(component, _object) {

      Balanser.call(this, component, _object);
      this.backend = backendhost+'/lampa/hdvburl?v=777';

      this.android = true;
      this.append_ext = this.append_call;
      this.getStream = this.getStream_call;

      this.getStreamLink = function (element, android) {
        var kp_id = (this.results[element.translation].kinopoisk_id || this.object.kinopoisk_id || 0);
        var url = this.backend + '&source=' + this.object.movie.source + '&id=' + this.object.movie.id + '&kinopoisk_id=' + kp_id;          
        if (kp_id == 0) url += '&filmId=' + this.object.balanser_id;
        if (android)  url += '&next=true';
        url += '&translation=' + this.results[element.translation].translator_id;
        if (element.season != undefined) url += '&season=' + element.season + '&episode=' + element.episode;
        url += '&link=' + element.link;
        if (android)  url += '&name='+'/S' + element.season + '-E' + element.episode + '.m3u8';
        return url;
      }

    };

    function Alloha(component, _object) {

      Balanser.call(this, component, _object);
      this.backend = backendhost+'/lampa/allohaurl?v=777';

      this.android = false;
      this.append_ext = this.append_call;

      /**
       * parse getStream
       * @param {object} element
       */
      this.getStream = function (element, call, error) {
        var _this = this, object = this.object, results = this.results;

        if (element.season)
          element.link = this.extract[element.translation].json[element.season].folder[element.episode].file;
        else element.link = this.extract[element.translation].file;

        // console.log('element', element);
        if (element.link.startsWith('http') && (element.link.substr(-5) === ".m3u8" || element.link.substr(-4) === ".mp4")) {
          if ( results[element.translation].serial == 0 &&  Lampa.Arrays.getKeys(results[element.translation].playlists).length > 1)
            return call(element);
          if ( results[element.translation].serial == 1 &&  Lampa.Arrays.getKeys(results[element.translation].playlists[ element.season ][ element.episode ]).length > 1)
            return call(element);

          getStreamQuality(element, function (extra) {
            return call(element);
          });

        } else {
          var url = this.backend + '&source=' + object.movie.source;          
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (results[element.translation].kinopoisk_id || object.kinopoisk_id || 0) + '&link=' + element.link;
          this.network.clear(); this.network.timeout(15000);
          this.network["native"]( element.link, function (found) {
            // console.log('found', found);

            _this.network.clear(); _this.network.timeout(15000);
            _this.network.silent( url, function (str) {
              // console.log('str', str);

              if (str == undefined || str.length == 0) { return error('undefined'); }
              if (str.indexOf('error') >= 0) { return error(str); }
              var json = JSON.parse(str);
              if (json.playlists && Lampa.Arrays.getKeys(json.playlists).length === 0) return error('Ссылки на видео не получены');

              var result = results[element.translation];
              if (result.serial == 1) {
                result.playlists[ element.season ][ element.episode ] = json.playlists;
                result.subtitles[ element.season+'_'+element.episode ] = json.subtitles;
                _this.success(results);
                element.link = _this.extract[element.translation].json[ element.season ].folder[ element.episode ].file;
                element.quality = _this.extract[element.translation].json[ element.season ].folder[ element.episode ].quality;
                element.subtitles = _this.parseSubtitles(json.subtitles);
              } else {
                result.playlists = json.playlists;
                result.subtitles = json.subtitles;
                _this.success(results);
                element.link = _this.extract[element.translation].file;
                element.quality = _this.extract[element.translation].quality;
                element.subtitles = _this.parseSubtitles(json.subtitles);
              }

              _this.getStreamQuality(element, function (extra) {
                return call(element);
              });

            }, function (a, c) {
              return error(_this.network.errorDecode(a, c));
            },
              component.LZString.compressToBase64(found), { dataType: 'text' }
            );

          }, function (a, c) {
            return error(_this.network.errorDecode(a, c));
          },
            false , { dataType: 'text' }
          );
        }
      };

      /**
       * Извлеч поток из ссылки
       * @param {Object} element
       * @returns {function} call
       * @returns {function} error
       */
      this.getStreamQuality = function (element, call) {
        var _this = this, object = this.object, results = this.results, extract = this.extract;
        this.network.clear(); this.network.timeout(10000);
        this.network.silent( element.link, function (plist) {
          //console.log('plist', typeof(plist), plist);
          var playlists = {};
          plist.toString().match(/RESOLUTION\s*=\s*(\d+)x(\d+),.*?\n([^#]+)\n/g).forEach(function (elem) {
            var match = elem.match(/RESOLUTION\s*=\s*(\d+)x(\d+),.*?\n([^#]+)\n/)
            if (match[1] == 1920) match[2] = 1080;
            else if (match[1] == 1280) match[2] = 720;
            if (match) playlists[ match[2] ] =  element.link.replace('master.m3u8', match[3]);
          });
          // console.log('playlists', playlists);
          if (Lampa.Arrays.getKeys(playlists).length > 0)
            if (results[element.translation].serial == 1) results[element.translation].playlists[ element.season ][ element.episode ] = playlists;
              else results[element.translation].playlists = playlists;
          // console.log('results', results);
          _this.success(results);
          return call(element);

        }, function (a, c) {
            return call(element);
        }, false, {
          dataType: 'text'
        });
      }
      
    };

    function VideoDB(component, _object) {

      Balanser.call(this, component, _object);
      this.backend = backendhost+'/lampa/kinoplayurl?v=777';

      /**
       * parse Subtitles
       * @param {String} subtitle
       */
      this.parseSubtitles = function (subtitle) {
        // console.log('subtitle', subtitle);
        if (subtitle == 'false' || subtitle == undefined || Lampa.Arrays.getKeys(subtitle).length == 0) return null;
        if (subtitle) {
          var index = -1;
          return subtitle.split(',').map(function (sb) {
            var sp = sb.split(' or ').shift();
            index++;
            return {
              label: sp.split('/').pop(),
              url: sp,
              index: index
            };
          });
        }
      }

    };

    function ZetFlix(component, _object) {

      Balanser.call(this, component, _object);
      this.backend = backendhost+'/lampa/zetflixurl?v=777';
      
    };

    function KinoVOD(component, _object) {

      Balanser.call(this, component, _object);
      this.backend = backendhost+'/lampa/kinovodurl?v=777';
      this.search_base = this.search;
  
      /**
       * Поиск
       * @param {Object} _object
       */
      this.search = function (_object, kinopoisk_id, similar) {
        // console.log('kinopoisk_id', kinopoisk_id, 'similar', similar, 'window.whois', window.whois);
        if (!window.whois) { component.whois(_object, kinopoisk_id, similar, this.network); component.loading(false); return; } 
        else if (!window.whois && !window.whois.ip) { component.empty('ip не определен'); return; }
        else if (window.whois && window.whois.ip && window.whois.ip.startsWith('192.168.') == false) { this.append_ext = this.append_call; this.getStream = this.getStream_ext; }
        else if (window.whois && window.whois.ip && window.whois.ip.startsWith('192.168.') == false) { component.empty('привязка по ip, работает только в локальной сети'); return; }

        this.search_base(_object, kinopoisk_id, similar);
      }
   
      this.getStreamLink = function (element, android) {
        var kp_id = (this.results[element.translation].kinopoisk_id || this.object.kinopoisk_id || 0);
        var url = this.backend + '&source=' + this.object.movie.source + '&id=' + this.object.movie.id + '&kinopoisk_id=' + kp_id;
        url += '&filmId=' + this.object.balanser_id + '&title=' + encodeURIComponent(this.object.search);
        return url;
      }

      this.getStream_ext = function (element, call, error) {
        var _this = this, object = this.object, results = this.results, extract = this.extract;
        if (element.season != undefined) 
          element.link = extract[element.translation].json[element.season].folder[element.episode].file;
        else element.link = extract[element.translation].file;

        // console.log('element', element);
        if (results[element.translation].extend == undefined && element.link.startsWith('http') && (element.link.substr(-5) === ".m3u8" || element.link.substr(-4) === ".mp4")) {

          if ( results[element.translation].serial == 0 &&  Lampa.Arrays.getKeys(results[element.translation].playlists).length > 0)
            return call(element);
          if ( results[element.translation].serial == 1 &&  Lampa.Arrays.getKeys(results[element.translation].playlists[ element.season ][ element.episode ]).length > 0)
            return call(element);

        } else {

          // var url = this.getStreamLink(element, false);
          var extend = results[element.translation].extend;
          this.network.clear(); this.network.timeout(10000);
          this.network["native"]( extend.url, function (str) {
            // console.log('str', str);
            var func_user_data = new Function(str.replace('eval', ' var func_user_data=')+';return func_user_data;');
            var html = func_user_data().toString();
            // console.log('html', html);

            var match = html.match(/_vod_time\s*=\s*"\s*(\d+)\s*"\s*;/);
            if (match) extend.vod_time = match[1];
            match = html.match(/_vod_hash\s*=\s*"\s*([^"]+)\s*"\s*;/);
            if (match) extend.vod_hash = match[1];
            // console.log('extend', extend);

            if (extend.id == undefined || extend.identifer == undefined || extend.vod_hash == undefined) {
                match = html.match(/>(.*?недоступен.*?)</);
                if (match) error(match[1]);
            }

            extend.url2 = extend.url.split('user_data.js').shift() + 'vod/' + extend.id + '?identifier=' + extend.identifer + '&player_type=new&file_type=mp4&st=' + extend.vod_hash + '&e=' + extend.vod_time + '&_=' + Date.now();
            _this.network.clear(); _this.network.timeout(10000);
            _this.network["native"]( extend.url2, function (found) {
              // console.log('found', found);

              _this.network.clear(); _this.network.timeout(15000);
              _this.network.silent( _this.getStreamLink(element), function (str) {
                // console.log('str', str);

                var found = Lampa.Arrays.decodeJson(str, undefined);
                if (found && found.result) {
                  if (found.action === 'select') {                    
                    return error('select');
                  } else if (found.action === 'done') {
                    _this.results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
                    object.balanser_id = found.balanser_id || found.kpid;
                    //console.log('results', results);
                    if (_this.results.length > 0) _this.success(_this.results);
                    return call(element);
                  }
                }
                else if (found && found.error) { return error(found.error); }
                else return error(Lampa.Lang.translate('online_nolink'));

              }, function (a, c) {
                return error(_this.network.errorDecode(a, c));
              },
                component.LZString.compressToBase64(found), { dataType: 'text' }
              );

            }, function (a, c) {
                return error(_this.network.errorDecode(a, c));
            },
                false, { dataType: 'text' }
            );

          }, function (a, c) {
              return error(_this.network.errorDecode(a, c));
          },
              false, { dataType: 'text' }
          );

        };
      };

    };

    function Kinobase(component, _object) {

      Balanser.call(this, component, _object);
      this.backend = backendhost+'/lampa/kinobaseurl?v=777';
      this.search_base = this.search;

      /**
       * Поиск
       * @param {Object} _object
       */
      this.search = function (_object, kinopoisk_id, similar) {
        // console.log('kinopoisk_id', kinopoisk_id, 'similar', similar, 'window.whois', window.whois);
        if (!window.whois) { component.whois(_object, kinopoisk_id, similar, this.network); component.loading(false); return; } 
        else if (!window.whois && !window.whois.ip) { component.empty('ip не определен'); return; }
        else if (window.whois && window.whois.ip && window.whois.ip.startsWith('192.168.') == false) { component.empty('привязка по ip, работает только в локальной сети'); return; }

        this.search_base(_object, kinopoisk_id, similar);
      }
      
    };

    function VideoCDN(component, _object) {

      Balanser.call(this, component, _object);
      this.backend = backendhost+'/lampa/videocdnurl?v=777';
      
    };

    function Kodik(component, _object) {

      Balanser.call(this, component, _object);
      this.backend = backendhost+'/lampa/kodikurl?v=777';

      this.android = false;
      this.append_ext = this.append_call;
      this.getStream = this.getStream_call;

      this.getStreamLink = function (element, android) {
        var kp_id = (this.results[element.translation].kinopoisk_id || this.object.kinopoisk_id || 0);
        var url = this.backend + '&source=' + this.object.movie.source + '&id=' + this.object.movie.id + '&kinopoisk_id=' + kp_id;          
        if (kp_id == 0) url += '&filmId=' + this.object.balanser_id;
        if (android)  url += '&next=true';
        url += '&translation=' + this.results[element.translation]./*translation_*/id;
        if (element.season != undefined) url += '&season=' + element.season + '&episode=' + element.episode;
        url += '&link=' + element.link;
        if (android)  url += '&name='+'/S' + element.season + '-E' + element.episode + '.m3u8';
        return url;
      }

    };

    function Bazon(component, _object) {

      Balanser.call(this, component, _object);
      this.backend = backendhost+'/lampa/bazonurl?v=777';
      this.hlsproxy = { use: false, link: 'http://back.freebie.tom.ru:8888/', extension: '.m3u8', hlsproxy : ['Off', 'On', 'On + api'] };
      
      this.success_show = 'Работает только во встроенном плеере или MX (для Android на 102+ версии). Иначе "Фильтр => HLSProxy => On"';
      this.search_base = this.search;
      this.extractData_base = this.extractData;
      this.getFile_base = this.getFile;

      /**
       * Поиск
       * @param {Object} _object
       */
      this.search = function (_object, kinopoisk_id, similar) {        
        // component.empty('На ремонте'); return;
        // console.log('kinopoisk_id', kinopoisk_id, 'similar', similar);
        if (!window.whois) { component.whois(_object, kinopoisk_id, similar, this.network); component.loading(false); return; } 
        else if (!window.whois && !window.whois.ip) window.whois.hlsproxy = false;
        else if (window.whois && window.whois.ip && window.whois.ip.startsWith('192.168.1')) window.whois.hlsproxy = false; else window.whois.hlsproxy = true;

        this.search_base(_object, kinopoisk_id, similar);
      }

      /**
       * Получить потоки
       * @param {JSON} json
       * @returns string
       */
      this.extractData = function (json) {
        var _this = this;
        this.extract = [];
        this.translations = [];
        this.results.forEach( function (translation, keyt) {
          if (translation.playlists != undefined && translation.serial == 1 && translation.playlists instanceof Array == false) {
            var playlists = [];
            Object.entries(translation.playlists).forEach(function (seasons) {
              var keys = seasons[0], season = seasons[1];
              playlists[keys] = [];
              Object.entries(seasons[1]).forEach(function (episodes) {
                var keye = episodes[0], episode = episodes[1];
                playlists[keys][keye] = episode;
              })
            })
            translation.playlists = playlists;
          }
          if (translation.playlists == undefined) {
            var playlists = [];
            if (translation.serial == 1) {
              Object.entries(translation.episodes).forEach(function (seasons) {
                var keys = seasons[0], season = seasons[1];
                playlists[keys] = [];
                Object.entries(seasons[1]).forEach(function (episodes) {
                  var keye = episodes[0], episode = episodes[1];
                  playlists[keys][keye] = {};
                  ['480','720','1080','2160'].filter( function (elem) { return parseInt(elem) <= parseInt(episode) }).forEach(function (elem) {
                    playlists[keys][keye][elem] = translation.link;
                  })
                })
              })
            } else {
              playlists = {};
              ['480','720','1080','2160'].filter( function (elem) { return parseInt(elem) <= parseInt(translation.max_qual) }).forEach(function (elem) {
                playlists[elem] = translation.link;
              })
            }
            translation.playlists = playlists;
          }
        })
        // console.log('results', this.results);
        this.extractData_base(json);
        // console.log('extract', this.extract);
      }

      /**
       * Найти поток
       * @param {Object} element
       * @param {Int} max_quality
       * @returns string
       */
      this.getFile = function (element, max_quality) {
        var _this = this;
        var files = this.getFile_base(element, max_quality);        
        if (this.hlsproxy.use) {
          files.file = this.hlsproxy.link + '?link=' + files.file;
          Lampa.Arrays.getKeys(files.quality).forEach(function (elem) { files.quality[elem] = _this.hlsproxy.link + '?link=' + files.quality[elem]; })
        } else if (this.choice.hlsproxy == 2) {

        } else {
          files.file = backendhost + '/corsproxy/' + files.file;
          Lampa.Arrays.getKeys(files.quality).forEach(function (elem) { files.quality[elem] = backendhost + '/corsproxy/' + files.quality[elem]; })
        }
        return files;
      }

      /**
       * Добавить видео ext
       * @param {Array} items
       */
      this.append_ext = function (items, item, viewed, view, hash_file, element) {
        var _this = this, object = this.object;

        this.getStream(element, function () {

          var extra = _this.getFile(element, element.quality);
          if (extra.file) {
            var playlist = [];
            var first = {
              title: element.title,
              url: extra.file,
              quality: extra.quality,
              timeline: view,
              subtitles: element.subtitles,
            };

            if (element.season != undefined && Lampa.Platform.version) {
              var playlist = [];
              items.forEach(function (elem) {
                var ex = _this.getFile(elem, elem.quality);
                playlist.push({
                  title: elem.title,
                  url: ex.file,
                  quality: ex.quality,
                  timeline: elem.timeline,
                  subtitles: elem.subtitles,
                });
              });
              if (playlist.length > 1) first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);
            } else {
              Lampa.Player.play(first);
              Lampa.Player.playlist([first]);
            }

            element.loading = false;
            if (element.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(element.subtitles);

            if (viewed.indexOf(hash_file) == -1) {
              viewed.push(hash_file);
              item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
              Lampa.Storage.set('online_view', viewed);
            }
          } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));

        }, function (error) {
          element.loading = false;
          Lampa.Noty.show(error || Lampa.Lang.translate('online_nolink'));
        });
      }

      /**
       * parse getStream
       * @param {object} element
       */
      this.getStream = function (element, call, error) {
        var _this = this, object = this.object, hlsproxy = this.hlsproxy, filter_items = this.filter_items, choice = this.choice;

        if (hlsproxy.hlsproxy_last != undefined && choice.hlsproxy != hlsproxy.hlsproxy_last) return error('Нужно перезайти в карточку, т.к. сменился HLSProxy');

        if (element.season)
            element.link = this.extract[element.translation].json[element.season].folder[element.episode].file
        else element.link = this.extract[element.translation].file

        if (element.link.substr(-4) === ".mp4" || element.link.indexOf('index.m3u8') > 0) return call();
        //console.log('element', element);

        var url = this.backend + '&source=' + object.movie.source + '&id=' + object.movie.id + '&kinopoisk_id=' + (this.results[element.translation].kinopoisk_id || object.kinopoisk_id || 0);
        if (element.season != undefined) url += '&season=' + element.season + '&episode=' + element.episode;
        url += '&quality=' + element.quality.split('p')[0] + '&proxy=' + hlsproxy.use + '&link=' + element.link;

        if (choice.hlsproxy == 2) url = this.backend.replace('bazonurl','bazonurl2') + '&source=' + object.movie.source + '&id=' + object.movie.id + '&kinopoisk_id=' + (this.results[element.translation].kinopoisk_id || object.kinopoisk_id) + '&link=link';

        this.network.clear(); this.network.timeout(15000);
        this.network.silent( url, function (found) {

          // console.log('found', found);
          if (found && found.result && found.action === 'done') {
            hlsproxy.hlsproxy_last = choice.hlsproxy;

            if (choice.hlsproxy == 2) {
              if (found.data == undefined) return error('found.results == undefined)');
              found.data.forEach( function (translation, keyt) {
                var key = _this.translations[translation.translation];
                if (_this.results[key]) _this.results[key].playlists = translation.playlists;
              })
            } else {
              _this.results[element.translation].playlists = found.data;
            }

            _this.extractData(_this.results);
            return call();
          }
          else if (found && found.error) { return error(found.error); }
          else if (found) { return error(found); }
          else { return error('found == undefined'); }

        }, function (a, c) {
            return error(_this.network.errorDecode(a, c));
        });
      }

    };

    function CDNMovies(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var object = _object;
      var select_title = '';
      var embed = component.proxy('cdnmovies') + 'https://cdnmovies.net/api/short/';
      var token = '02d56099082ad5ad586d7fe4e2493dd9';
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        voice_name: ''
      };
      /**
       * Начать поиск
       * @param {Object} _object
       */

      this.search = function (_object, kinopoisk_id) {
        var _this = this;

        object = _object;
        if (isNaN(kinopoisk_id)) { component.empty("kinopoisk_id is null"); return; } else { if (object.kinopoisk_id == undefined) object.kinopoisk_id = kinopoisk_id }
        var url = 'https://cdnmovies.net/api/short?token=02d56099082ad5ad586d7fe4e2493dd9&kinopoisk_id=' + kinopoisk_id;

        // if (this.wait_similars) return this.find(data[0].iframe_src);
        // object = _object;
        // select_title = object.movie.title;
        // var url = embed;
        // var itm = data[0];
        // var type = itm.iframe_src.split('/').slice(-2)[0];
        // if (type == 'movie') type = 'movies';
        // url += type;
        // url = Lampa.Utils.addUrlComponent(url, 'token=' + token);
        // url = Lampa.Utils.addUrlComponent(url, itm.imdb_id ? 'imdb_id=' + encodeURIComponent(itm.imdb_id) : 'title=' + encodeURIComponent(itm.title));
        // url = Lampa.Utils.addUrlComponent(url, 'field=' + encodeURIComponent('global'));
        network["native"](url, function (json) {
          var array_data = [];

          for (var key in json.data) {
            array_data.push(json.data[key]);
          }

          json.data = array_data;

          // if (json.data.length > 1) {
          //   _this.wait_similars = true;
          //   component.similars(json.data);
          //   component.loading(false);
          // } else if (json.data.length == 1) {
          //   _this.find(json.data[0].iframe_src);
          if (json.data.length == 1) {
            _this.find(json.data[0].iframe_src);
          } else if (json.data.length > 1) {
            component.emptyForQuery('json.data.length > 1');
          } else {
            component.emptyForQuery(object.search);
          }
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'json'
        });
      };

      this.find = function (url) {
        network.clear();
        network["native"]('http:' + url, function (json) {
          parse(json);
          component.loading(false);
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'text'
        });
      };

      this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
      };
      /**
       * Сброс фильтра
       */


      this.reset = function () {
        component.reset();
        choice = {
          season: 0,
          voice: 0,
          voice_name: ''
        };
        filter();
        append(filtred());
        component.saveChoice(choice);
      };
      /**
       * Применить фильтр
       * @param {*} type
       * @param {*} a
       * @param {*} b
       */


      this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        if (a.stype == 'voice') choice.voice_name = filter_items.voice[b.index];
        component.reset();
        filter();
        append(filtred());
        component.saveChoice(choice);
      };
      /**
       * Уничтожить
       */


      this.destroy = function () {
        network.clear();
      };

      function parse(str) {
        str = str.replace(/\n/g, '');
        var find = str.match("Playerjs\\({.*?\\bfile:\\s*'(.*?)'\\s*}\\);");
        var video = find && decode(find[1]);
        var json;

        try {
          json = video && JSON.parse(video);
        } catch (e) {}

        if (json) {
          extract = json;
          // console.log('extract', extract);
          filter();
          append(filtred());
        } else component.emptyForQuery(object.search);
      }

      function decode(data) {
        if (data.charAt(0) !== '#') return data;

        var enc = function enc(str) {
          return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            return String.fromCharCode('0x' + p1);
          }));
        };

        var dec = function dec(str) {
          return decodeURIComponent(atob(str).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
        };

        var trashList = ['-*frofpscprpamfpQ*45612.3256dfrgd', '54vjfhcgdbrydkcfkndz568436fred+*d', 'lvfycgndqcydrcgcfg+95147gfdgf-zd*', 'az+-erw*3457edgtjd-feqsptf/re*q*Y', 'df8vg69r9zxWdlyf+*fgx455g8fh9z-e*Q'];
        var x = data.substring(2);
        trashList.forEach(function (trash) {
          x = x.replace('//' + enc(trash), '');
        });

        try {
          x = dec(x);
        } catch (e) {
          x = '';
        }

        return x;
      }
      /**
       * Найти поток
       * @param {Object} element
       * @param {Int} max_quality
       * @returns string
       */

      function parseFiles(files, max_quality) {
          // console.log('max_quality', max_quality, 'files', files);
          if (max_quality == undefined) max_quality = '2160';
          if (typeof(files) !== "string") return [];
          try {
            var items = files.split(',').map(function (item) {
              var file = item.replace(/\[\d+\D?\]/, '');
              if (file.indexOf(':hls:') != -1) file = file.split(':hls:').shift();
              var match = item.match(/\[(\d+)\D?\]/);
              if (!match) match = item.match(/\/(\d+)[^\/]*\.m3u8/);
              return {
                quality: parseInt(match[1]),
                file: file,
              };
            }).filter(function (item) {
              return (item.quality <= parseInt(max_quality));
            });
            items.sort(function (a, b) {
              return a.quality - b.quality;
            });
            return items;
          } catch (e) { }
          return [];
      }

      function getFile(element, max_quality) {
        if (max_quality == undefined) max_quality = '2160';
        var file = '';
        var quality = {};
        // console.log('element', element);

        var preferably = parseInt(Lampa.Storage.get('video_quality_default', '2160'));
        var qualities = parseFiles(element);
        qualities.forEach(function (item) {
          if (parseInt(item.quality) <= parseInt(preferably)) {
            // quality[item.quality+'p'] = item.file.replace(/\/\d+.m3u8/, '/'+item.quality+'.mp4');
            quality[item.quality+'p'] = item.file.replace(/\/\d*([^\/]*\.m3u8)$/, '/hls$1');;
            file = quality[item.quality+'p'];
          }
        });

        return {
          file: file,
          quality: quality
        };
      }
      /**
       * Построить фильтр
       */


      function filter() {
        filter_items = {
          season: [],
          voice: [],
          quality: []
        };

        if (extract[0].folder || object.movie.number_of_seasons) {
          extract.forEach(function (season) {
            filter_items.season.push(season.title);
          });
          extract[choice.season].folder.forEach(function (f) {
            f.folder.forEach(function (t) {
              if (filter_items.voice.indexOf(t.title) == -1) filter_items.voice.push(t.title);
            });
          });
          if (!filter_items.voice[choice.voice]) choice.voice = 0;
        }

        if (choice.voice_name) {
          var inx = filter_items.voice.indexOf(choice.voice_name);
          if (inx == -1) choice.voice = 0;else if (inx !== choice.voice) {
            choice.voice = inx;
          }
        }

        component.filter(filter_items, choice);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        if (extract[0].folder || object.movie.number_of_seasons) {
          extract.forEach(function (t) {
            if (t.title == filter_items.season[filter_data.season]) {
              t.folder.forEach(function (se) {
                se.folder.forEach(function (eps) {
                  if (eps.title == filter_items.voice[choice.voice]) {
                    var quality = parseFiles(eps.file);
                    filtred.push({
                      file: eps.file,
                      episode: parseInt(se.title.match(/\d+/)),
                      season: parseInt(t.title.match(/\d+/)),
                      quality: (quality.length > 0 ? quality.slice(-1).pop().quality + 'p' : ''),
                      info: ' / ' + Lampa.Utils.shortText(eps.title, 50)
                    });
                  }
                });
              });
            }
          });
        } else {
          extract.forEach(function (data) {
            var quality = parseFiles(data.file);
            filtred.push({
              file: data.file,
              title: data.title,
              quality: (quality.length > 0 ? quality.slice(-1).pop().quality + 'p' : ''),
              info: '',
              subtitles: data.subtitle ? data.subtitle.split(',').map(function (c) {
                return {
                  label: c.split(']')[0].slice(1),
                  url: c.split(']')[1]
                };
              }) : false
            });
          });
        }

        return filtred;
      }
      /**
       * Добавить видео
       * @param {Array} items
       */


      function append(items) {
        if (object.seasons == undefined) object.seasons = {};
        if (object.movie.number_of_seasons && object.seasons[choice.season+1] == undefined) {
          object.seasons[choice.season+1] = [];
          component.getEpisodes(object, component, network, choice.season+1, function (episodes) {
            object.seasons[choice.season+1] = episodes;
            append(items);
            setTimeout(component.closeFilter, 25);
          })
          return;
        }
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var last_episode = component.getLastEpisode(items);
        items.forEach(function (element) {
          var quality_info = (element.quality && element.quality.length > 0 ? ' / ' : '');
          if (element.season) element.title = 'S' + element.season + '-E' + element.episode + ' / ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.episode;
          if (element.season != undefined && object.seasons[choice.season+1] != undefined && object.seasons[choice.season+1][element.episode-1] != undefined)
              element.title = 'S' + element.season + '-E' + element.episode + ' / ' + object.seasons[choice.season+1][element.episode-1].name;
          element.info = element.season ? quality_info + filter_items.voice[choice.voice] : '';
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
          item.addClass('video--stream');
          element.timeline = view;

          if (element.season) {
            element.translate_episode_end = last_episode;
            element.translate_voice = filter_items.voice[choice.voice];
          }

          item.append(Lampa.Timeline.render(view));

          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, (element.season ? ' / ' : quality_info)));
          }

          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            var extra = getFile(element.file);

            if (extra.file) {
              var playlist = [];
              var first = {
                url: extra.file,
                timeline: view,
                quality: extra.quality,
                subtitles: element.subtitles,
                title: (element.season ? element.title : object.movie.title + ' / ' + element.title),
              };

              if (element.season) {
                items.forEach(function (elem) {
                  var ex = getFile(elem.file);
                  playlist.push({
                    url: ex.file,
                    quality: ex.quality,
                    timeline: elem.timeline,
                    subtitles: elem.subtitles,
                    title: elem.title,
                  });
                });
              } else {
                playlist.push(first);
              }

              if (playlist.length > 1) first.playlist = playlist;
              Lampa.Player.play(first);
              Lampa.Player.playlist(playlist);

              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));
          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            element: element,
            file: function file(call) {
              call(getFile(element.file));
            }
          });
        });
        component.start(true);
      }

    }

    function component(object) {
      var network = new Lampa.Reguest();
      var scroll = new Lampa.Scroll({
        mask: true,
        over: true
      });
      var files = new Lampa.Files(object);
      var filter = new Lampa.Filter(object);
      var last;
      var last_filter;
      var extended;
      var selected_id;
      var filter_translate = {
        season: Lampa.Lang.translate('torrent_serial_season'),
        voice: Lampa.Lang.translate('torrent_parser_voice'),
        source: Lampa.Lang.translate('settings_rest_source'),
        quality: Lampa.Lang.translate('torrent_parser_quality'),
      };

      var filter_sources = ["Filmix", /*"HDRezka", "HDVB",*/ "Alloha", /*"Bazon", "ZetFlix",*/ "KinoVOD", /*"VideoDB",*/ "VideoCDN", "CDNMovies", /*"Kinobase", "Kodik",*/ ];

      var balanser_default = filter_sources.slice(0,1).pop();
      var balanser = Lampa.Storage.get('online_balanser', balanser_default);
      var last_bls = Lampa.Storage.cache('online_last_balanser', 200, {});

      if (last_bls[object.movie.id]) {
        balanser = last_bls[object.movie.id];
      } 
      else if (object.movie.source == 'filmix' && filter_sources.indexOf('Filmix') != -1) {
        balanser = 'Filmix';
      }
      else if (object.movie.source == 'hdrezka' && filter_sources.indexOf('HDRezka') != -1) {
        balanser = 'HDRezka';
      }
      else if (object.movie.source == 'kinovod' && filter_sources.indexOf('KinoVOD') != -1) {
        balanser = 'KinoVOD';
      }

      if (filter_sources.indexOf(balanser) == -1) {
        balanser = balanser_default;
        Lampa.Storage.set('online_balanser', balanser);
      }

      this.proxy = function (name) {
        var prox = Lampa.Storage.get('online_proxy_all');
        var need = Lampa.Storage.get('online_proxy_' + name);
        if (name === 'kinobase') need = backendhost + '/proxy/';
        if (need) prox = need;

        if (prox && prox.slice(-1) !== '/') {
          prox += '/';
        }

        return prox;
      };

      var sources = {
        Filmix: new Filmix(this, object),
        HDRezka: new HDRezka(this, object),
        HDVB: new HDVB(this, object),
        Alloha: new Alloha(this, object),
        VideoDB: new VideoDB(this, object),
        ZetFlix: new ZetFlix(this, object),
        KinoVOD: new KinoVOD(this, object),
        Kinobase: new Kinobase(this, object),
        VideoCDN: new VideoCDN(this, object),
        Bazon: new Bazon(this, object),
        Kodik: new Kodik(this, object),
        CDNMovies: new CDNMovies(this, object),
      };

      scroll.body().addClass('torrent-list');

      function minus() {
        scroll.minus(window.innerWidth > 580 ? false : files.render().find('.files__left'));
      }

      window.addEventListener('resize', minus, false);
      minus();

      /**
       * Подготовка
       */

      this.create = function () {
        var _this = this;

        this.activity.loader(true);
        Lampa.Background.immediately(Lampa.Utils.cardImgBackground(object.movie));

        filter.onSearch = function (value) {
          object.search_new = true;
          Lampa.Activity.replace({
            search: value,
            clarification: true
          });
        };

        filter.onBack = function () {
          _this.start();
        };

        filter.render().find('.selector').on('hover:focus', function (e) {
          last_filter = e.target;
        });

        filter.onSelect = function (type, a, b) {
          if (type == 'filter') {
            if (a.reset) {
              if (extended) sources[balanser].reset();else _this.start();
            } else {
              if (a.stype == 'source') {

                balanser = filter_sources[b.index];
                Lampa.Storage.set('online_balanser', balanser);
                last_bls[object.movie.id] = balanser;
                Lampa.Storage.set('online_last_balanser', last_bls);

                _this.search();

                setTimeout(Lampa.Select.close, 10);
              } else {
                sources[balanser].filter(type, a, b);
              }
            }
          } else if (type == 'sort') {
            balanser = a.source;
            Lampa.Storage.set('online_balanser', balanser);
            last_bls[object.movie.id] = balanser;
            Lampa.Storage.set('online_last_balanser', last_bls);

            _this.search();

            setTimeout(Lampa.Select.close, 10);
          }
        };

        filter.render().find('.filter--sort span').text(Lampa.Lang.translate('online_balanser'));
        filter.render();
        files.append(scroll.render());
        scroll.append(filter.render());
        this.search();
        return this.render();
      };
      /**
       * Начать поиск
       */


      this.search = function () {
        this.activity.loader(true);
        this.filter({
          source: filter_sources
        }, {
          source: 0
        });
        this.reset();
        this.find();
      };

      this.find = function () {
        var _this2 = this;

        var url = this.proxy('videocdn') + 'http://cdn.svetacdn.in/api/short';
        var query = object.search;
        url = Lampa.Utils.addUrlComponent(url, 'api_token=3i40G5TSECmLF77oAqnEgbx61ZWaOYaE');

        var display = function display(json) {
          if (object.movie.imdb_id) {
            var imdb = json.data.filter(function (elem) {
              return elem.imdb_id == object.movie.imdb_id;
            });
            if (imdb.length) json.data = imdb;
          };

          if (json.data && json.data.length) {
            if (json.data.length == 1 || object.clarification && object.search_new) {
              _this2.extendChoice();

              if (balanser == 'videocdn' || balanser == 'filmix') sources[balanser].search(object, json.data); else sources[balanser].search(object, json.data[0].kp_id || json.data[0].filmId || json.data[0].kinopoiskId, json.data);
            } else {
              _this2.similars(json.data);

              _this2.loading(false);
            }
          } else _this2.emptyForQuery(query);
        };

        var pillow = function pillow(a, c) {
          network.timeout(1000 * 15);

          if (balanser !== 'videocdn') {
            network.silent('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(query), function (json) {
              json.data = json.films || json.items;
              display(json);
            }, function (a, c) {
              _this2.empty(network.errorDecode(a, c));
            }, false, {
              headers: {
                'X-API-KEY': '2d55adfd-019d-4567-bbf7-67d503f61b5a'
              }
            });
          } else {
            _this2.empty(network.errorDecode(a, c));
          }
        };

        var letgo = function letgo(imdb_id) {
          var url_end = Lampa.Utils.addUrlComponent(url, imdb_id ? 'imdb_id=' + encodeURIComponent(imdb_id) : 'title=' + encodeURIComponent(query));
          network.timeout(1000 * 15);
          network["native"](url_end, function (json) {
            if (json.data && json.data.length) display(json);else {
              network["native"](Lampa.Utils.addUrlComponent(url, 'title=' + encodeURIComponent(query)), display.bind(_this2), pillow.bind(_this2));
            }
          }, pillow.bind(_this2));
        };

        var letgo_new = function letgo_new(tmdb_id) {
          // sources[balanser].search(object, 0); return;
          if ((object.movie.source == 'tmdb' || object.movie.source == 'cub') && balanser != 'videocdn') {
            network["native"](backendhost+'/lampa/kinopoiskId?v=777&tmdb_id=' + object.movie.id +'&serial=' + (object.movie.number_of_seasons ? 1 : 0) + '&title=' + encodeURIComponent(object.search), function (kinopoisk_id) {
                // console.log('object.movie.id', object.movie.id, 'kinopoisk_id', kinopoisk_id);
                if (kinopoisk_id) {
                    object.kinopoisk_id = kinopoisk_id;
                    sources[balanser].search(object, kinopoisk_id);
                } else if (['HDRezka', 'HDVB', 'Alloha', 'ZetFlix', 'KinoVOD', 'Kinobase', 'VideoCDN', 'Bazon', 'Kodik'].indexOf(balanser) != -1) {
                    if (balanser == 'VideoCDN' && object.movie.imdb_id) sources[balanser].search(object, object.movie.imdb_id); else sources[balanser].search(object, 0);
                }
                else pillow();
              }, pillow.bind(_this2), false, { dataType: 'text' }
            );
          } else {
            if (object.kinopoisk_id) {
                sources[balanser].search(object, object.kinopoisk_id);
            } else if (['HDRezka', 'HDVB', 'Alloha', 'ZetFlix', 'KinoVOD', 'Kinobase', 'VideoCDN', 'Bazon', 'Kodik'].indexOf(balanser) != -1) {
                sources[balanser].search(object, 0);
            }
            else pillow();
          }
        };

        network.clear();
        network.timeout(1000 * 15);

        if (object.search_new) { object.search_new = false; object.filmix_id = undefined; object.kinopoisk_id = undefined; }
        if (object.movie && object.movie.source != 'tmdb' && object.movie.kinopoisk_id) object.kinopoisk_id = object.movie.kinopoisk_id;
        if (object.movie && object.movie.source == 'filmix' && object.movie.id) object.filmix_id = object.movie.id;

        if (balanser == 'Filmix') {
            _this2.extendChoice();
            sources[balanser].search(object, (object.filmix_id ? object.filmix_id : object.search));
        } else if (balanser == 'Kinobase-old-plug') {
            _this2.extendChoice();
            sources[balanser].search(object, object.search);
        } else if (/*(object.movie.source == 'tmdb' || object.movie.source == 'cub') &&*/ balanser != 'videocdn') {
            _this2.extendChoice();
            if (object.kinopoisk_id) {
                sources[balanser].search(object, object.kinopoisk_id);
            } else {
                letgo_new(object.movie.id);
            }
        } else if (object.movie.imdb_id) {
            letgo(object.movie.imdb_id);
        } else if (object.movie.source == 'tmdb' || object.movie.source == 'cub') {
          var tmdburl = (object.movie.name ? 'tv' : 'movie') + '/' + object.movie.id + '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96&language=ru';
          var baseurl = Lampa.TMDB.api(tmdburl);
          network["native"](baseurl, function (ttid) {
            letgo(ttid.imdb_id);
          }, function (a, c) {
            _this2.empty(network.errorDecode(a, c));
          });
        } else {
          letgo();
        }
      };

      this.extendChoice = function () {
        var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
        var save = data[selected_id || object.movie.id] || {};
        extended = true;
        sources[balanser].extendChoice(save);
      };

      this.saveChoice = function (choice) {
        var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
        data[selected_id || object.movie.id] = choice;
        Lampa.Storage.set('online_choice_' + balanser, data);
      };
      /**
       * Есть похожие карточки
       * @param {Object} json
       */


      this.similars = function (json) {
        var _this3 = this;

        json.forEach(function (elem) {
          var year = elem.start_date || elem.year || '';
          elem.title = elem.title || elem.ru_title || elem.en_title || elem.nameRu || elem.nameEn;
          elem.quality = year ? (year + '').slice(0, 4) : '----';
          elem.info = '';
          var item = Lampa.Template.get('online_folder', elem);
          item.on('hover:enter', function () {
            _this3.activity.loader(true);

            _this3.reset();

            object.search_date = year;
            selected_id = elem.id;

            _this3.extendChoice();

            if (balanser == 'videocdn') sources[balanser].search(object, [elem]); else sources[balanser].search(object, elem.kp_id || elem.filmId, [elem]);
          });

          _this3.append(item);
        });

        var last_views = scroll.render().find('.selector.online').find('.torrent-item__viewed').parent().last();
        if (object.movie.number_of_seasons && last_views.length) last = last_views.eq(0)[0]; else last = scroll.render().find('.selector').eq(3)[0];

      };
      /**
       * Очистить список файлов
       */


      this.reset = function () {
        last = false;
        scroll.render().find('.empty').remove();
        filter.render().detach();
        scroll.clear();
        scroll.append(filter.render());
      };
      /**
       * Загрузка
       */


      this.loading = function (status) {
        if (status) this.activity.loader(true);else {
          this.activity.loader(false);
          this.activity.toggle();
        }
      };
      /**
       * Построить фильтр
       */


      this.filter = function (filter_items, choice) {
        var select = [];

        var add = function add(type, title) {
          var need = Lampa.Storage.get('online_filter', '{}');
          var items = filter_items[type];
          var subitems = [];
          var value = need[type];
          items.forEach(function (name, i) {
            subitems.push({
              title: name,
              selected: value == i,
              index: i
            });
          });
          select.push({
            title: title,
            subtitle: items[value],
            items: subitems,
            stype: type
          });
        };

        filter_items.source = filter_sources;
        choice.source = filter_sources.indexOf(balanser);
        select.push({
          title: Lampa.Lang.translate('torrent_parser_reset'),
          reset: true
        });
        Lampa.Storage.set('online_filter', choice);
        add('source', 'Источник');
        if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
        if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season'));
        if (balanser.startsWith('Filmix') || balanser.startsWith('Bazon')) if (filter_items && filter_items.quality && filter_items.quality.length) add('quality', Lampa.Lang.translate('torrent_parser_quality'));
        if (balanser == 'Bazon') if (filter_items && filter_items.hlsproxy) add('hlsproxy', 'HLSProxy');
        filter.set('filter', select);
        filter.set('sort', filter_sources.map(function (e) {
          return {
            title: e,
            source: e,
            selected: e == balanser
          };
        }));
        this.selected(filter_items);
      };
      /**
       * Закрыть фильтр
       */


      this.closeFilter = function () {
        if ($('body').hasClass('selectbox--open')) Lampa.Select.close();
      };
      /**
       * Показать что выбрано в фильтре
       */


      this.selected = function (filter_items) {
        var need = Lampa.Storage.get('online_filter', '{}'),
            select = [];

        for (var i in need) {
          if (filter_items[i] && filter_items[i].length) {
            if (i == 'voice') {
              select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
            } else if (i !== 'source') {
              if (filter_items.season.length >= 1) {
                select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
              }
            }
          }
        }

        filter.chosen('filter', select);
        filter.chosen('sort', [balanser]);
      };
      /**
       * Добавить файл
       */


      this.append = function (item) {
        item.on('hover:focus', function (e) {
          last = e.target;
          scroll.update($(e.target), true);
        });
        scroll.append(item);
      };
      /**
       * Меню
       */


      this.contextmenu = function (params) {
        params.item.on('hover:long', function () {
          function show(extra) {
            var enabled = Lampa.Controller.enabled().name;
            var menu = [{
              title: Lampa.Lang.translate('torrent_parser_label_title'),
              mark: true
            }, {
              title: Lampa.Lang.translate('torrent_parser_label_cancel_title'),
              clearmark: true
            }, {
              title: Lampa.Lang.translate('time_reset'),
              timeclear: true
            }];

            if (Lampa.Platform.is('webos')) {
              menu.push({
                title: Lampa.Lang.translate('player_lauch') + ' - Webos',
                player: 'webos'
              });
            }

            if (Lampa.Platform.is('android')) {
              menu.push({
                title: Lampa.Lang.translate('player_lauch') + ' - Android',
                player: 'android'
              });
            }

            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Lampa',
              player: 'lampa'
            });

            if (extra) {
              menu.push({
                title: Lampa.Lang.translate('copy_link'),
                copylink: true
              });
            }

            if (Lampa.Account.working() && params.element && typeof params.element.season !== 'undefined' && Lampa.Account.subscribeToTranslation) {
              menu.push({
                title: Lampa.Lang.translate('online_voice_subscribe'),
                subscribe: true
              });
            }

            Lampa.Select.show({
              title: Lampa.Lang.translate('title_action'),
              items: menu,
              onBack: function onBack() {
                Lampa.Controller.toggle(enabled);
              },
              onSelect: function onSelect(a) {
                if (a.clearmark) {
                  Lampa.Arrays.remove(params.viewed, params.hash_file);
                  Lampa.Storage.set('online_view', params.viewed);
                  params.item.find('.torrent-item__viewed').remove();
                }

                if (a.mark) {
                  if (params.viewed.indexOf(params.hash_file) == -1) {
                    params.viewed.push(params.hash_file);
                    params.item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                    Lampa.Storage.set('online_view', params.viewed);
                  }
                }

                if (a.timeclear) {
                  params.view.percent = 0;
                  params.view.time = 0;
                  params.view.duration = 0;
                  Lampa.Timeline.update(params.view);
                }

                Lampa.Controller.toggle(enabled);

                if (a.player) {
                  Lampa.Player.runas(a.player);
                  params.item.trigger('hover:enter');
                }

                if (a.copylink) {
                  if (extra.quality) {
                    var qual = [];

                    for (var i in extra.quality) {
                      qual.push({
                        title: i,
                        file: extra.quality[i]
                      });
                    }

                    Lampa.Select.show({
                      title: 'Ссылки',
                      items: qual,
                      onBack: function onBack() {
                        Lampa.Controller.toggle(enabled);
                      },
                      onSelect: function onSelect(b) {
                        Lampa.Utils.copyTextToClipboard(b.file, function () {
                          Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                        }, function () {
                          Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                        });
                      }
                    });
                  } else {
                    Lampa.Utils.copyTextToClipboard(extra.file, function () {
                      Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                    }, function () {
                      Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                    });
                  }
                }

                if (a.subscribe) {
                  Lampa.Account.subscribeToTranslation({
                    card: object.movie,
                    season: params.element.season,
                    episode: params.element.translate_episode_end,
                    voice: params.element.translate_voice
                  }, function () {
                    Lampa.Noty.show(Lampa.Lang.translate('online_voice_success'));
                  }, function () {
                    Lampa.Noty.show(Lampa.Lang.translate('online_voice_error'));
                  });
                }
              }
            });
          }

          params.file(show);
        }).on('hover:focus', function () {
          if (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), params.item);
        });
      };
      /**
       * Показать пустой результат
       */


      this.empty = function (msg) {
        var empty = Lampa.Template.get('list_empty');
        if (msg) empty.find('.empty__descr').text(msg);
        scroll.append(empty);
        this.loading(false);
      };
      /**
       * Показать пустой результат по ключевому слову
       */


      this.emptyForQuery = function (query) {
        this.empty(Lampa.Lang.translate('online_query_start') + ' (' + query + ') ' + Lampa.Lang.translate('online_query_end'));
      };

      this.getLastEpisode = function (items) {
        var last_episode = 0;
        items.forEach(function (e) {
          if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
        });
        return last_episode;
      };
      /**
       * Начать навигацию по файлам
       */


      this.start = function (first_select) {
        if (Lampa.Activity.active().activity !== this.activity) return; //обязательно, иначе наблюдается баг, активность создается но не стартует, в то время как компонент загружается и стартует самого себя.

        if (first_select) {
          var last_views = scroll.render().find('.selector.online').find('.torrent-item__viewed').parent().last();
          if (object.movie.number_of_seasons && last_views.length) last = last_views.eq(0)[0];else last = scroll.render().find('.selector').eq(3)[0];
        }

        Lampa.Controller.add('content', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(scroll.render(), files.render());
            Lampa.Controller.collectionFocus(last || false, scroll.render());
          },
          up: function up() {
            if (Navigator.canmove('up')) {
              if (scroll.render().find('.selector').slice(3).index(last) == 0 && last_filter) {
                Lampa.Controller.collectionFocus(last_filter, scroll.render());
              } else Navigator.move('up');
            } else Lampa.Controller.toggle('head');
          },
          down: function down() {
            Navigator.move('down');
          },
          right: function right() {
            if (Navigator.canmove('right')) Navigator.move('right'); else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu');
          },
          back: this.back
        });
        Lampa.Controller.toggle('content');
      };

      this.render = function () {
        return files.render();
      };

      this.back = function () {
        Lampa.Activity.backward();
      };

      this.pause = function () {};

      this.stop = function () {};

      this.destroy = function () {
        network.clear();
        files.destroy();
        scroll.destroy();
        network = null;
        Lampa.Arrays.getValues(sources).forEach(function(balanser) { if (balanser != undefined && balanser.destroy != undefined) balanser.destroy(); })
        window.removeEventListener('resize', minus);
      };

      this.whois = function (_object, kinopoisk_id, similar, network) {
        object = _object;
        window.whois = { ip : '127.0.0.1' };
        network["native"](backendhost+'/lampa/whois?v=777&id=' + object.movie.id +'&title=' + encodeURI(object.search), function (json) {
          window.whois.ip = json.ip;
          sources[balanser].search(object, kinopoisk_id, similar);
      }, function (a, c) {
          sources[balanser].search(object, kinopoisk_id, similar);
        });
      };

      this.LZString = function() {var r=String.fromCharCode,o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",e={};function t(r,o){if(!e[r]){e[r]={};for(var n=0;n<r.length;n++)e[r][r.charAt(n)]=n}return e[r][o]}var i={compressToBase64:function(r){if(null==r)return"";var n=i._compress(r,6,function(r){return o.charAt(r)});switch(n.length%4){default:case 0:return n;case 1:return n+"===";case 2:return n+"==";case 3:return n+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(n){return t(o,r.charAt(n))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(r){return null==r?"":""==r?null:i._decompress(r.length,16384,function(o){return r.charCodeAt(o)-32})},compressToUint8Array:function(r){for(var o=i.compress(r),n=new Uint8Array(2*o.length),e=0,t=o.length;e<t;e++){var s=o.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null==o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;e<t;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(r){return null==r?"":i._compress(r,6,function(r){return n.charAt(r)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(o){return t(n,r.charAt(o))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(r,o,n){if(null==r)return"";var e,t,i,s={},u={},a="",p="",c="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<r.length;i+=1)if(a=r.charAt(i),Object.prototype.hasOwnProperty.call(s,a)||(s[a]=f++,u[a]=!0),p=c+a,Object.prototype.hasOwnProperty.call(s,p))c=p;else{if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++),s[p]=f++,c=String(a)}if(""!==c){if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==o-1){d.push(n(m));break}v++}return d.join("")},decompress:function(r){return null==r?"":""==r?null:i._decompress(r.length,32768,function(o){return r.charCodeAt(o)})},_decompress:function(o,n,e){var t,i,s,u,a,p,c,l=[],f=4,h=4,d=3,m="",v=[],g={val:e(0),position:n,index:1};for(t=0;t<3;t+=1)l[t]=t;for(s=0,a=Math.pow(2,2),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 2:return""}for(l[3]=c,i=c,v.push(c);;){if(g.index>o)return"";for(s=0,a=Math.pow(2,d),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(c=s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 2:return v.join("")}if(0==f&&(f=Math.pow(2,d),d++),l[c])m=l[c];else{if(c!==h)return null;m=i+i.charAt(0)}v.push(m),l[h++]=i+m.charAt(0),i=m,0==--f&&(f=Math.pow(2,d),d++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module?module.exports=LZString:"undefined"!=typeof angular&&null!=angular&&angular.module("LZString",[]).factory("LZString",function(){return LZString});

      this.getEpisodes = function (_object, component, network, season, call) {
        object = _object;
        var episodes = [];

        if (typeof object.movie.id == 'number' && object.movie.name) {
          var tmdburl = 'tv/' + object.movie.id + '/season/' + season + '?api_key=' + Lampa.TMDB.key() + '&language=' + Lampa.Storage.get('language', 'ru');
          var baseurl = Lampa.TMDB.api(tmdburl);
          network.timeout(1000 * 10);
          network["native"](baseurl, function (data) {
            episodes = data.episodes || [];
            call(episodes);
          }, function (a, c) {
            call(episodes);
          });
        } else call(episodes);
      };
    }

    function startPlugin() {
      window.plugin_FilmixPVA_ready = true;

      if (!Lampa.Lang) {
        var lang_data = {};
        Lampa.Lang = {
          add: function add(data) {
            lang_data = data;
          },
          translate: function translate(key) {
            return lang_data[key] ? lang_data[key].ru : key;
          }
        };
      }

      Lampa.Lang.add({
        online_nolink: {
          ru: 'Не удалось извлечь ссылку',
          uk: 'Неможливо отримати посилання',
          en: 'Failed to fetch link'
        },
        online_waitlink: {
          ru: 'Работаем над извлечением ссылки, подождите...',
          uk: 'Працюємо над отриманням посилання, зачекайте...',
          en: 'Working on extracting the link, please wait...'
        },
        online_balanser: {
          ru: 'Балансер',
          uk: 'Балансер',
          en: 'Balanser'
        },
        helper_online_file: {
          ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню',
          uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
          en: 'Hold the "OK" key to bring up the context menu'
        },
        online_query_start: {
          ru: 'По запросу',
          uk: 'На запит',
          en: 'On request'
        },
        online_query_end: {
          ru: 'нет результатов',
          uk: 'немає результатів',
          en: 'no results'
        },
        title_online: {
          ru: 'Онлайн',
          uk: 'Онлайн',
          en: 'Online'
        },
        title_filmix: {
          ru: 'Filmix',
          uk: 'Filmix',
          en: 'Filmix',
        },
        title_proxy: {
          ru: 'Прокси',
          uk: 'Проксі',
          en: 'Proxy'
        },
        online_proxy_title: {
          ru: 'Основной прокси',
          uk: 'Основний проксі',
          en: 'Main proxy'
        },
        online_proxy_descr: {
          ru: 'Будет использоваться для всех балансеров',
          uk: 'Використовуватиметься для всіх балансерів',
          en: 'Will be used for all Balansers'
        },
        online_proxy_placeholder: {
          ru: 'Например: http://proxy.com',
          uk: 'Наприклад: http://proxy.com',
          en: 'For example: http://proxy.com'
        },
        filmix_param_add_title: {
          ru: 'Добавить ТОКЕН от Filmix',
          uk: 'Додати ТОКЕН від Filmix',
          en: 'Add TOKEN from Filmix'
        },
        filmix_param_add_descr: {
          ru: 'Добавьте ТОКЕН для подключения подписки',
          uk: 'Додайте ТОКЕН для підключення передплати',
          en: 'Add a TOKEN to connect a subscription'
        },
        filmix_param_placeholder: {
          ru: 'Например: nxjekeb57385b..',
          uk: 'Наприклад: nxjekeb57385b..',
          en: 'For example: nxjekeb57385b..'
        },
        filmix_param_add_device: {
          ru: 'Добавить устройство на Filmix',
          uk: 'Додати пристрій на Filmix',
          en: 'Add Device to Filmix'
        },
        filmix_modal_text: {
          ru: 'Введите его на странице https://filmix.ac/consoles в вашем авторизованном аккаунте!',
          uk: 'Введіть його на сторінці https://filmix.ac/consoles у вашому авторизованому обліковому записі!',
          en: 'Enter it at https://filmix.ac/consoles in your authorized account!'
        },
        filmix_modal_wait: {
          ru: 'Ожидаем код',
          uk: 'Очікуємо код',
          en: 'Waiting for the code'
        },
        filmix_copy_secuses: {
          ru: 'Код скопирован в буфер обмена',
          uk: 'Код скопійовано в буфер обміну',
          en: 'Code copied to clipboard'
        },
        filmix_copy_fail: {
          ru: 'Ошибка при копировании',
          uk: 'Помилка при копіюванні',
          en: 'Copy error'
        },
        filmix_nodevice: {
          ru: 'Устройство не авторизовано',
          uk: 'Пристрій не авторизований',
          en: 'Device not authorized'
        },
        title_status: {
          ru: 'Статус',
          uk: 'Статус',
          en: 'Status'
        },
        online_voice_subscribe: {
          ru: 'Подписаться на перевод',
          uk: 'Підписатися на переклад',
          en: 'Subscribe to translation'
        },
        online_voice_success: {
          ru: 'Вы успешно подписались',
          uk: 'Ви успішно підписалися',
          en: 'You have successfully subscribed'
        },
        online_voice_error: {
          ru: 'Возникла ошибка',
          uk: 'Виникла помилка',
          en: 'An error has occurred'
        }
      });

      function resetTemplates() {
        Lampa.Template.add('online', "<div class=\"online selector\">\n        <div class=\"online__body\">\n            <div style=\"position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em\">\n                <svg style=\"height: 2.4em; width:  2.4em;\" viewBox=\"0 0 128 128\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"64\" cy=\"64\" r=\"56\" stroke=\"white\" stroke-width=\"16\"/>\n                    <path d=\"M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z\" fill=\"white\"/>\n                </svg>\n            </div>\n            <div class=\"online__title\" style=\"padding-left: 2.1em;\">{title}</div>\n            <div class=\"online__quality\" style=\"padding-left: 3.4em;\">{quality}{info}</div>\n        </div>\n    </div>");
        Lampa.Template.add('online_folder', "<div class=\"online selector\">\n        <div class=\"online__body\">\n            <div style=\"position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em\">\n                <svg style=\"height: 2.4em; width:  2.4em;\" viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"/>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"/>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"/>\n                </svg>\n            </div>\n            <div class=\"online__title\" style=\"padding-left: 2.1em;\">{title}</div>\n            <div class=\"online__quality\" style=\"padding-left: 3.4em;\">{quality}{info}</div>\n        </div>\n    </div>");
      }

      var button = "<div class=\"full-start__button selector view--online\" data-subtitle=\"Источник Filmix\">\n    <svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:svgjs=\"http://svgjs.com/svgjs\" version=\"1.1\" width=\"512\" height=\"512\" x=\"0\" y=\"0\" viewBox=\"0 0 45 45\" style=\"enable-background:new 0 0 512 512\" xml:space=\"preserve\" class=\"\">\n    <g xmlns=\"http://www.w3.org/2000/svg\">\n        <path d=\"M0 20v20h40V0H0v20zM32 7v3h-6.7c-8 0-9 .5-9.4 4.5l-.4 3 8.3.3 8.2.3V24H16v11H9V22.1C9 10.6 9.2 9 11.1 6.6 13 4.1 13.6 4 22.6 4H32v3z\" fill=\"currentColor\"/>\n     </g></svg>\n\n    <span>#{title_filmix}</span>\n    </div>";

      Lampa.Component.add('FilmixPVA', component); //то же самое

      resetTemplates();
      Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
          var btn = $(Lampa.Lang.translate(button));
          btn.on('hover:enter', function () {
            resetTemplates();
            Lampa.Component.add('FilmixPVA', component);
            Lampa.Activity.push({
              url: '',
              title: Lampa.Lang.translate('title_filmix'),
              component: 'FilmixPVA',
              search: e.data.movie.title,
              search_one: e.data.movie.title,
              search_two: e.data.movie.original_title,
              movie: e.data.movie,
              page: 1
            });
          });
          e.object.activity.render().find('.view--torrent').after(btn);
        }
      });

      ///////FILMIX/////////
      var network = new Lampa.Reguest();
      var api_url = 'http://filmixapp.cyou/api/v2/';
      var user_dev = '?user_dev_apk=2.0.9&user_dev_id=' + Lampa.Utils.uid(16) + '&user_dev_name=Xiaomi&user_dev_os=12&user_dev_vendor=Xiaomi&user_dev_token=';
      var ping_auth;
      Lampa.Params.select('filmix_token', '', '');
      Lampa.Template.add('settings_filmix', "<div>\n        <div class=\"settings-param selector\" data-name=\"filmix_token\" data-type=\"input\" placeholder=\"#{filmix_param_placeholder}\">\n            <div class=\"settings-param__name\">#{filmix_param_add_title}</div>\n            <div class=\"settings-param__value\"></div>\n            <div class=\"settings-param__descr\">#{filmix_param_add_descr}</div>\n        </div>\n        <div class=\"settings-param selector\" data-name=\"filmix_add\" data-static=\"true\">\n            <div class=\"settings-param__name\">#{filmix_param_add_device}</div>\n        </div>\n    </div>");
      Lampa.Storage.listener.follow('change', function (e) {
        if (e.name == 'filmix_token') {
          if (e.value) checkPro(e.value);else {
            Lampa.Storage.set("filmix_status", {});
            showStatus();
          }
        }
      });

      function addSettingsFilmix() {
        Lampa.Settings.main().render().find('[data-component="filmix"]').remove();
        if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="filmix"]').length) {
          var field = $("<div class=\"settings-folder selector\" data-component=\"filmix\">\n                <div class=\"settings-folder__icon\">\n                    <svg height=\"57\" viewBox=\"0 0 58 57\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M20 20.3735V45H26.8281V34.1262H36.724V26.9806H26.8281V24.3916C26.8281 21.5955 28.9062 19.835 31.1823 19.835H39V13H26.8281C23.6615 13 20 15.4854 20 20.3735Z\" fill=\"white\"/>\n                    <rect x=\"2\" y=\"2\" width=\"54\" height=\"53\" rx=\"5\" stroke=\"white\" stroke-width=\"4\"/>\n                    </svg>\n                </div>\n                <div class=\"settings-folder__name\">Filmix</div>\n            </div>");
          // Lampa.Settings.main().render().find('[data-component="more"]').after(field);
          Lampa.Settings.main().render().find('[data-component="more"]').last().after(field);
          Lampa.Settings.main().update();
        }
      }

      if (window.appready) addSettingsFilmix(); else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') addSettingsFilmix();
        });
      }
      Lampa.Settings.listener.follow('open', function (e) {
        if (e.name == 'filmix') {
          e.body.find('[data-name="filmix_add"]').unbind('hover:enter').on('hover:enter', function () {
            var user_code = '';
            var user_token = '';
            var modal = $('<div><div class="broadcast__text">' + Lampa.Lang.translate('filmix_modal_text') + '</div><div class="broadcast__device selector" style="text-align: center">' + Lampa.Lang.translate('filmix_modal_wait') + '...</div><br><div class="broadcast__scan"><div></div></div></div></div>');
            Lampa.Modal.open({
              title: '',
              html: modal,
              onBack: function onBack() {
                Lampa.Modal.close();
                Lampa.Controller.toggle('settings_component');
                clearInterval(ping_auth);
              },
              onSelect: function onSelect() {
                Lampa.Utils.copyTextToClipboard(user_code, function () {
                  Lampa.Noty.show(Lampa.Lang.translate('filmix_copy_secuses'));
                }, function () {
                  Lampa.Noty.show(Lampa.Lang.translate('filmix_copy_fail'));
                });
              }
            });
            ping_auth = setInterval(function () {
              checkPro(user_token, function () {
                Lampa.Modal.close();
                clearInterval(ping_auth);
                Lampa.Storage.set("filmix_token", user_token);
                e.body.find('[data-name="filmix_token"] .settings-param__value').text(user_token);
                Lampa.Controller.toggle('settings_component');
              });
            }, 10000);
            network.clear();
            network.timeout(10000);
            network.quiet(api_url + 'token_request' + user_dev, function (found) {
              if (found.status == 'ok') {
                user_token = found.code;
                user_code = found.user_code;
                modal.find('.selector').text(user_code);
              } else {
                Lampa.Noty.show(found);
              }
            }, function (a, c) {
              Lampa.Noty.show(network.errorDecode(a, c));
            });
          });
          showStatus();
        }
        setTimeout(function () { Lampa.Settings.main().render().find('[data-component="filmix"]').removeClass('hide'); }, 0.1 * 1000);
      });

      function showStatus() {
        var status = Lampa.Storage.get("filmix_status", '{}');
        var info = Lampa.Lang.translate('filmix_nodevice');

        if (status.login) {
          if (status.is_pro) info = status.login + ' - PRO ' + Lampa.Lang.translate('filter_rating_to') + ' - ' + status.pro_date;else if (status.is_pro_plus) info = status.login + ' - PRO_PLUS ' + Lampa.Lang.translate('filter_rating_to') + ' - ' + status.pro_date;else info = status.login + ' - NO PRO';
        }

        var field = $(Lampa.Lang.translate("\n            <div class=\"settings-param\" data-name=\"filmix_status\" data-static=\"true\">\n                <div class=\"settings-param__name\">#{title_status}</div>\n                <div class=\"settings-param__value\">".concat(info, "</div>\n            </div>")));
        $('.settings [data-name="filmix_status"]').remove();
        $('.settings [data-name="filmix_add"]').after(field);
      }

      function checkPro(token, call) {
        network.clear();
        network.timeout(8000);
        network.silent(api_url + 'user_profile' + user_dev + token, function (json) {
          if (json) {
            if (json.user_data) {
              Lampa.Storage.set("filmix_status", json.user_data);
              if (call) call();
            } else {
              Lampa.Storage.set("filmix_status", {});
            }

            showStatus();
          }
        }, function (a, c) {
          Lampa.Noty.show(network.errorDecode(a, c));
        });
      }
    }

    if (!window.plugin_FilmixPVA_ready) startPlugin();

})();
