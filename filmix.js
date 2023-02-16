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
        if (!window.filmix) window.filmix = { max_qualitie: 480, is_max_qualitie: false, replace: false, enable: false }
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
          network.silent( (url_api + 'user_profile' + token), function(found) {
            if (found && found.user_data) {
              window.filmix.max_qualitie = 720;
              if (found.user_data.is_pro) window.filmix.max_qualitie = 1080;
              if (found.user_data.is_pro_plus) window.filmix.max_qualitie = 2160;
            }
            component.search(object, title);
          });
          return;
        }

        if (typeof(title) === 'object') title = title.pop().id;

        if (isNaN(title) === true) {

            var url = Lampa.Utils.addUrlComponent( 'http://filmixapp.cyou/api/v2/search'+token , 'story=' + encodeURIComponent(cleanTitle(title)));
            network.clear(); network.timeout(15000);
            network.silent( url, function (found) {

              //console.log('found',found);
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
              if (!Object.keys(results).length) component.empty(found.error ? found.error : 'По запросу ('+object.search+') нет результатов');
          }, function (a, c) {
            component.empty(network.errorDecode(a, c));
          });

        } else {

          object.filmix_id = title;

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
            if (!Object.keys(results).length) component.empty(found.error ? found.error : 'По запросу ('+object.search+') нет результатов');
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

        if (player_links.playlist && Object.keys(player_links.playlist).length > 0) {
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
                var qualitie = Math.max.apply(null, qualities);
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
            //console.log('translation', translation, 'movie', movie);

            if (window.filmix.replace) {
                var match = movie.link.match(/\/.\/(.*?)\//);
                if (match) movie.link = movie.link.replace(match[1], window.filmix.hash);
            }

            var qualities = movie.link.match(/.+\[(.+[\d]),?,?\].+/i);
            if (qualities) qualities = qualities[1].split(",").filter( function (elem) { return parseInt(elem) <= window.filmix.max_qualitie && parseInt(elem) !== 0 }).
                sort(function(a, b) { if (parseInt(a) > parseInt(b)) return 1; else if (parseInt(a) < parseInt(b)) return -1; else return 0; });
            var qualitie = Math.max.apply(null, qualities);
            var link = movie.link.replace(/\[(.+[\d]),?\]/i, qualitie);

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
            var qualitie = Math.max.apply(null, qualities);
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
          component.getEpisodes(choice.season+1, function (episodes) {
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

    function HDRezka(component, _object) {
      var network = new Lampa.Reguest();
      var extract = [];
      var results = [];
      var object = _object;
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        quality: 0
      };
        var translations = [];
        var backend = backendhost+'/lampa/hdrezkaurl?v=333';
      /**
       * Поиск
       * @param {Object} _object
       */


      this.search = function (_object, kinopoisk_id, similar) {
        object = _object;
        // console.log('kinopoisk_id', kinopoisk_id, 'similar', similar);

        var title = object.search;
        if (typeof(similar) == 'object' && similar.slice().pop().link) title = kinopoisk_id;

        var url = backend;
        if (isNaN(title) == true || similar == undefined) {
          if (title.length < 3) { component.empty('title (' + title + ') is smoll'); return; }
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&title=' + title;
          var relise = /*object.search_date ||*/ (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
          var year = parseInt((relise + '').slice(0, 4));
          url += '&year=' + year;
        } else {
          var title = similar.slice().pop();
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&link=' + title.link;
        }

        component.loading(true);
        network.clear(); network.timeout(20000);
        network.silent( url, function (found) {
            // console.log('found',found);
            if (found && found.result) {
                if (found.action === 'select') {
                    var json = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
                    var similars = [];
                    json.forEach(function (film) {
                      similars.push({
                        id: film.id,
                        title: film.title + (film.year ? ', '+film.year : '') + (film.country ? ', '+film.country : '') + (film.category ? ', '+film.category : ''),
                        year: film.year,
                        link: film.link,
                        filmId: film.id
                      });
                    });
                    component.similars(similars);
                    component.loading(false);
                    return;
                } else if (found.action === 'done') {
                    results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
                    //console.log('results', results);
                    if (results.length == 0) { component.loading(false); component.empty('В карточке пусто'); return; }
                    success(results);
                }
            }
            component.loading(false);
            if (!Object.keys(results).length) component.empty(found.error ? found.error : 'По запросу ('+object.search+') нет результатов');
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
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
        getEpisodes(choice.voice, function () {
          component.reset();
          filter();
          append(filtred());
          component.saveChoice(choice);
        });
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
        // уже присвоен results = json;
        extractData(json);
        filter();
        append(filtred());
        component.saveChoice(choice);

        getEpisodes(choice.voice, function () {
          component.reset();
          filter();
          append(filtred());
          component.saveChoice(choice);
        });
      }
      /**
       * Получить список серий озвучки
       * @param {Int} voice
       * @param {function} call
       * @returns null
       */


      function getEpisodes(voice, call) {
        // console.log('getEpisodes', results[voice].getEpisodes, results[voice].serial, Object.keys(results[voice].playlists).length);
        if (results[voice] == undefined) return;
        if (results[voice].serial == 0 || results[voice].getEpisodes || Object.keys(results[voice].playlists).length > 0) {
          call();
        } else {
          results[voice].getEpisodes = true;
          network.clear();
          network.timeout(20000);
          var url = backend + '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&translation=' + voice + '&link=' + results[voice].link + '&favs=' + results[voice].favs;
          network.silent(url, function (found) {
            //console.log('found', found);
            if (found.error) { component.empty(found.error); return; }
            if (found.action === 'done') {
              results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data); results[voice].getEpisodes = true;
              //console.log('results', results);
              extractData(results);
            }
            call();
            setTimeout(component.closeFilter, 25);
          }, function (a, c) {
            component.empty(network.errorDecode(a, c));
          });
        }
      }
      /**
       * Получить потоки
       * @param {String} str
       * @param {Int} max_quality
       * @returns string
       */


      function extractData(json) {
        extract = [];
        results.forEach( function (translation, keyt) {
          if (translation == null) return;
          //console.log('translation', translation);
          if (translations.indexOf(translation) == -1) { translations[keyt] = translation; }
          if (translation.serial == 1) {
              extract[keyt] = { json : [], "file": translation.link, 'serial': translation.serial, translation : translation.translation }
              translation.playlists.forEach(function (seasons, keys) {
                  if (seasons == null) return;
                  //console.log('keys', keys, 'seasons', seasons);

                  extract[keyt].last_season = keys;
                  var folder = [];
                  seasons.forEach(function (episode, keye) {
                      if (episode == null) return;
                      //console.log('keye', keye, 'episode', episode);

                        var qualities = Object.keys(episode);
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
                            "translation": keyt,
                            'subtitles': translation.subtitles[keys + '_' + keye],
                        };

                  })
                  extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };
              })
          } else if (translation.serial == 0) {
              var qualities = (translation.playlists == undefined ? [] : Object.keys(translation.playlists));
              if (qualities.length > 0) {
                  var qualitie = qualities.slice(-1).pop();
                  var link = translation.playlists[qualitie];
                  extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
              } else {
                  var qualitie = translation.quality;
                  var link = 'link';
                  extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
              }
          }
        })
        // console.log('extract', extract);
      }


      function parseSubtitles(subtitle) {
        //console.log('subtitle', subtitle);
        if (subtitle === 'false' || subtitle === undefined || Object.keys(subtitle).length === 0) return null;
        if (subtitle) {
          var index = -1;
          return subtitle.split(',').map(function (sb) {
            var sp = sb.split(']');
            index++;
            return {
              label: sp[0].slice(1),
              url: sp.pop(),
              index: index
            };
          });
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

        //console.log('element', element, 'max_quality', max_quality);
        if (element.season) {
            file = extract[element.translation].json[element.season].folder[element.episode].file;
            qualities = extract[element.translation].json[element.season].folder[element.episode].qualities;
            quality = results[element.translation].playlists[element.season][element.episode];
        }
        else {
            file = extract[element.translation].file;
            qualities = extract[element.translation].qualities;
            quality = results[element.translation].playlists;
        }
        //console.log('file', file, 'qualities', qualities);

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
          voice_info: [],
          quality : []
        };
        extract.forEach( function (translation, keyt) {
            if (translation.serial == 0) {

            } else if (translation.serial == 1) {

                var s = translation.last_season;
                while (s--) {
                    if (filter_items.season.indexOf(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s)) == -1)
                        filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s));
                }

                if (translation.json[choice.season + 1] || translation.json.length === 0) {
                    if (filter_items.voice.indexOf(translation.translation) == -1) {
                        filter_items.voice[keyt] = translation.translation;
                        filter_items.voice_info[keyt] = { id: keyt };
                    }
                }


            }

        })
        //console.log('choice.voice', choice.voice, 'filter_items',filter_items);
        if (filter_items.voice_info.length > 0 && !filter_items.voice_info[choice.voice]) {
            choice.voice = undefined;
            filter_items.voice_info.forEach( function (voice_info) {
                if (choice.voice == undefined) choice.voice = voice_info.id;
            })
        }
        if (filter_items.voice_info.length == 0 && (choice.season+1) < filter_items.season.length) { choice.season++; filter(); return; }
        // console.log('filter', choice);
        component.filter(filter_items, choice);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        extract.forEach(function (translation, keyt) {
            if (translation == null) return;
            if (translation.serial == 1) {
                translation.json.forEach(function (seasons, keys) {
                    if ( keys == filter_data.season + 1 ) {
                        seasons.folder.forEach(function (episode, keye) {
                            if (episode.translation == filter_items.voice_info[filter_data.voice].id) {
                              filtred.push({
                                episode: parseInt(episode.episode),
                                season: episode.season,
                                title: episode.episode + (episode.title ? ' - ' + episode.title : ''),
                                // quality: episode.quality + 'p',
                                // quality: (episode.qualities.length > 1 ? episode.quality+'p' : results[keyt].quality ),
                                quality: (episode.qualities.length > 1 ? episode.quality : '' ),
                                translation: episode.translation,
                                subtitles: parseSubtitles(episode.subtitles),
                              });
                            }
                        })
                    }
                })
            } else {
                filtred.push({
                    title: translation.translation,
                    // quality: (translation.qualities.length > 1 ? translation.quality : results[keyt].quality ),
                    quality: (translation.qualities.length > 1 ? translation.quality : '' ),
                    translation: keyt,
                    subtitles: parseSubtitles(translation.subtitles),
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


      function append(items) {
        if (items.length == 0) { component.empty('В карточке пусто'); return; }
        if (object.seasons == undefined) object.seasons = {};
        if (object.movie.number_of_seasons && object.seasons[choice.season+1] == undefined) {
          object.seasons[choice.season+1] = [];
          component.getEpisodes(choice.season+1, function (episodes) {
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

            if (element.loading) return;
            element.loading = true;
            getStream(element, function (extra) {
              extra = getFile(extra, extra.quality);
              var first = {
                url: extra.file,
                timeline: view,
                quality: extra.quality,
                title: element.title,
                subtitles: element.subtitles,
              };

              if (element.season && Lampa.Platform.version && Lampa.Platform.is('android') && Lampa.Storage.field('player') == 'android') {
                var playlist = [];
                items.forEach(function (elem) {
                  elem.link = extract[elem.translation].json[elem.season].folder[elem.episode].file;
                  var ex;
                  if (elem.link.startsWith('http') && (elem.link.substr(-5) === ".m3u8" || elem.link.substr(-4) === ".mp4")) {
                    ex = getFile(elem, elem.quality);
                  } else {
                    var url = backend + '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&next=true' + '&translation=' + elem.translation;
                    url += '&season=' + elem.season + '&episode=' + elem.episode + '&link=' + results[elem.translation].link + '&favs=' + results[elem.translation].favs + '&name='+'/S' + elem.season + '-E' + elem.episode + '.html';
                    ex = { file: url };
                  }
                  playlist.push({
                    url: ex.file,
                    quality: ex.quality,
                    title: elem.title,
                    subtitles: elem.subtitles,
                    timeline: elem.timeline
                  });
                });
                if (playlist.length > 1) first.playlist = playlist;
                Lampa.Player.play(first);
                Lampa.Player.playlist(playlist);
              } else if (element.season && Lampa.Platform.version) {
                var playlist = [];
                items.forEach(function (elem) {
                  var cell = {
                    url: function url(call) {
                      getStream(elem, function (extra) {
                        extra = getFile(extra, extra.quality);
                        cell.url = extra.file;
                        cell.quality = extra.quality;
                        cell.title = elem.title;
                        cell.subtitles = elem.subtitles;
                        call();
                      }, function () {
                        cell.url = '';
                        call();
                      });
                    },
                    timeline: elem.timeline,
                    title: elem.title
                  };
                  if (elem == element) cell.url = extra.file;
                  playlist.push(cell);
                });
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
            file: function file(call) {
              getStream(element, function (extra) {
                extra = getFile(extra, extra.quality);
                call({
                  file: extra.file,
                  quality: extra.quality,
                });
              }, function (error) {
                element.loading = false;
                Lampa.Noty.show(error || 'Не удалось извлечь ссылку');
              });
            }
          });
        });
        component.start(true);
      }

      function getStream(element, call, error) {
        if (element.season)
            element.link = extract[element.translation].json[element.season].folder[element.episode].file;
        else element.link = extract[element.translation].file;

        //console.log('element', element);
        if (element.link.startsWith('http') && (element.link.substr(-5) === ".m3u8" || element.link.substr(-4) === ".mp4")) {
            if ( results[element.translation].serial == 0 &&  Object.keys(results[element.translation].playlists).length > 1)
                return call(element);
            if ( results[element.translation].serial == 1 &&  Object.keys(results[element.translation].playlists[ element.season ][ element.episode ]).length > 1)
                return call(element);
        } else {
          var url = backend;
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&translation=' + element.translation;
          if (element.season != undefined) url += '&season=' + element.season + '&episode=' + element.episode;
          url += '&link=' + results[element.translation].link + '&favs=' + results[element.translation].favs;
          network.clear();
          network.timeout(20000);
          network.silent( url, function (str) {
              //console.log('str', str);
              if (str.indexOf('error') >= 0) { return error(str); }
              var json = JSON.parse(str);
              if (json.playlists && Object.keys(json.playlists).length === 0) return error('Ссылки на видео не получены');

              var result = results[element.translation];
              if (result.serial == 1) {
                  result.playlists[ element.season ][ element.episode ] = json.playlists;
                  result.subtitles[ element.season+'_'+element.episode ] = json.subtitles;
                  success(results);
                  element.link = extract[element.translation].json[ element.season ].folder[ element.episode ].file;
                  element.quality = extract[element.translation].json[ element.season ].folder[ element.episode ].quality;
                  element.subtitles = parseSubtitles(json.subtitles);
                  return call(element);
              } else {
                  result.playlists = json.playlists;
                  result.subtitles = json.subtitles;
                  success(results);
                  element.link = extract[element.translation].file;
                  element.quality = extract[element.translation].quality;
                  element.subtitles = parseSubtitles(json.subtitles);
                  return call(element);
              }

          }, function (a, c) {
              return error(network.errorDecode(a, c));
          },
              false, { dataType: 'text' }
          );
        }
      };

    };

    function HDVB(component, _object) {
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
        var translations = [];
        var backend = backendhost+'/lampa/hdvburl?v=333';
      /**
       * Поиск
       * @param {Object} _object
       */


      this.search = function (_object, kinopoisk_id) {
        object = _object;
        // console.log('kinopoisk_id', kinopoisk_id);

        if (isNaN(kinopoisk_id)) { component.empty("kinopoisk_id is null"); return; } else { if (object.kinopoisk_id == undefined) object.kinopoisk_id = kinopoisk_id }

        var url = backend + '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id) + '&title=' + encodeURI(object.search);
        network.clear(); network.timeout(20000);
        network.silent( url , function (found) {
          // console.log('found',found);
          if (found && found.result) {
            if (found.action === 'done') {
              results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
              // console.log('results', results);
              success(results);
            }
          }
          component.loading(false);
          if (!Object.keys(results).length) { component.empty(found.error ? found.error : 'По запросу (' + 'kinopoisk_id='+kinopoisk_id + ') нет результатов'); }
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
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
        results = null;
      };
      /**
       * Успешно, есть данные
       * @param {Object} json
       */


      function success(json) {
        // уже присвоен results = json;
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
        extract = [];
        results.forEach( function (translation, keyt) {
          if (translation == null) return;
          //console.log('translation', translation);
          if (translations.indexOf(translation.translator_id) == -1) { translations[keyt] = translation.translator_id; }
          if (translation.serial == 1) {
              extract[keyt] = { json : [], "file": translation.link, 'serial': translation.serial, translation : translation.translation }
              translation.playlists.forEach(function (seasons, keys) {
                  if (seasons == null) return;
                  //console.log('keys', keys, 'seasons', seasons);

                  extract[keyt].last_season = keys;
                  var folder = [];
                  seasons.forEach(function (episode, keye) {
                      if (episode == null) return;
                      //console.log('keye', keye, 'episode', episode);

                        var qualities = Object.keys(episode);
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
                            "translation": keyt,
                            // 'subtitles': translation.subtitles[keys + '_' + keye],
                        };

                  })
                  extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };
              })
          } else if (translation.serial == 0) {
              var qualities = (translation.playlists == undefined ? [] : Object.keys(translation.playlists));
              if (qualities.length > 0) {
                  var qualitie = qualities.slice(-1).pop();
                  var link = translation.playlists[qualitie];
                  extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
              } else {
                  var qualitie = translation.quality;
                  var link = 'link';
                  extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
              }
          }
        })
        // console.log('extract', extract);
      }
      /**
       * Найти поток
       * @param {Object} element
       * @param {Int} max_quality
       * @returns string
       */


      function getFile(element, max_quality) {
        var file = '';
        var file_quality = '';
        var quality = false;
        var qualities =null;
        var select_quality = 2160;

        //console.log('element', element);
        if (element.season) {
          file = extract[element.translation].json[element.season].folder[element.episode].file;
          file_quality = extract[element.translation].json[element.season].folder[element.episode].quality;
          qualities = extract[element.translation].json[element.season].folder[element.episode].qualities;

        }
        else {
          file = extract[element.translation].file;
          file_quality = extract[element.translation].quality;
          qualities = extract[element.translation].qualities;
          //var filter_data = Lampa.Storage.get('online_filter', '{}');
          //select_quality = parseInt(filter_items.quality[filter_data.quality]);
        }
        //console.log('file', file, 'qualities', qualities);

        var file_filtred = file;
        if (file) {
          quality = {};
          for (var n in qualities) {
            if (parseInt(qualities[n]) <= parseInt(select_quality) && qualities.length > 1) {
              quality[qualities[n]+'p'] = file.replace('/'+file_quality, '/'+qualities[n]);
            } else {
              quality[qualities[n]+'p'] = file;
            }
            file_filtred = quality[qualities[n]+'p'] ;
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

        results.forEach( function (translation, keyt) {
          if (translation.serial == 0) {

          } else if (translation.serial == 1) {

            var s = translation.last_season;
            while (s--) {
              if (filter_items.season.indexOf(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s)) == -1)
                filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s));
            }

            if (translation.playlists[choice.season + 1]) {
              if (filter_items.voice.indexOf(translation.translation) == -1) {
                filter_items.voice[keyt] = translation.translation;
                filter_items.voice_info[keyt] = { id: keyt };
              }
            }

          }

        })
        //console.log('choice.voice', choice.voice, 'filter_items',filter_items);
        if (filter_items.voice_info.length > 0 && !filter_items.voice_info[choice.voice]) {
          choice.voice = undefined;
          filter_items.voice_info.forEach( function (voice_info) {
            if (choice.voice == undefined) choice.voice = voice_info.id;
          })
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

        for( var keym in extract) {
          var movie = extract[keym];
          if (movie.serial == 1) {
            for( var keye in movie.json) {
              var episode = movie.json[keye];
              if (episode.id == filter_data.season + 1) {
                episode.folder.forEach( function (media) {
                  if (media.translation == filter_items.voice_info[filter_data.voice].id) {
                    filtred.push({
                      episode: parseInt(media.episode),
                      season: media.season,
                      title: media.episode + (media.title ? ' - ' + media.title : ''),
                      //quality: media.quality + 'p',
                      quality: (media.qualities.length > 1 ? media.quality+'p' : results[keym].quality ),
                      translation: media.translation
                    });
                  }
                });
              }
            };
          } else {
            var select_quality = parseInt(filter_items.quality[filter_data.quality]);
            var qualities = movie.qualities.filter( function (elem) { return parseInt(elem) <= select_quality });
            var qualitie = Math.max.apply(null, qualities);
            if (qualitie) {
              filtred.push({
                title: movie.translation,
                //quality: movie.quality + 'p / ' + qualitie + 'p',
                quality: (movie.qualities.length > 1 ? movie.quality+'p' : results[keym].quality ),
                translation: keym,
              });
            }
          };
        }
        // console.log('filtred', filtred);
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
          component.getEpisodes(choice.season+1, function (episodes) {
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

            if (element.loading) return;
            element.loading = true;
            getStream(element, function (extra) {
              extra = getFile(extra, extra.quality);
              var first = {
                url: extra.file,
                timeline: view,
                quality: extra.quality,
                title: element.title
              };

              if (element.season && Lampa.Platform.version && Lampa.Platform.is('android') && Lampa.Storage.field('player') == 'android') {
                var playlist = [];
                items.forEach(function (elem) {
                  elem.link = extract[elem.translation].json[elem.season].folder[elem.episode].file;
                  var ex;
                  if (elem.link.startsWith('http') && (elem.link.substr(-5) === ".m3u8" || elem.link.substr(-4) === ".mp4")) {
                    ex = getFile(elem, elem.quality);
                  } else {
                    var url = backend + '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&next=true' + '&translation=' + results[elem.translation].translator_id;
                    url += '&season=' + elem.season + '&episode=' + elem.episode + '&link=' + elem.link + '&name='+'/S' + elem.season + '-E' + elem.episode + '.html';
                    ex = { file: url };
                  }
                  playlist.push({
                    url: ex.file,
                    quality: ex.quality,
                    title: elem.title,
                    subtitles: elem.subtitles,
                    timeline: elem.timeline
                  });
                });
                if (playlist.length > 1) first.playlist = playlist;
                Lampa.Player.play(first);
                Lampa.Player.playlist(playlist);
              } else if (element.season && Lampa.Platform.version) {
                var playlist = [];
                items.forEach(function (elem) {
                  var cell = {
                    url: function url(call) {
                      getStream(elem, function (extra) {
                        extra = getFile(extra, extra.quality);
                        cell.url = extra.file;
                        cell.quality = extra.quality;
                        call();
                      }, function () {
                        cell.url = '';
                        call();
                      });
                    },
                    timeline: elem.timeline,
                    title: elem.title
                  };
                  if (elem == element) cell.url = extra.file;
                  playlist.push(cell);
                });
                Lampa.Player.play(first);
                Lampa.Player.playlist(playlist);
              } else {
                Lampa.Player.play(first);
                Lampa.Player.playlist([first]);
              }

              if (element.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(element.subtitles);
              element.loading = false;

              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
            }, function (error) {
              element.loading = false;
              Lampa.Noty.show(error || 'Не удалось извлечь ссылку');
            });

          });
          component.append(item);
          component.contextmenu({
            item: item,
            view: view,
            viewed: viewed,
            hash_file: hash_file,
            element: element,
            file: function file(call) {
              getStream(element, function (extra) {
                extra = getFile(extra, extra.quality);
                call({
                  file: extra.file,
                  quality: extra.quality
                });
              }, function (error) {
                element.loading = false;
                Lampa.Noty.show(error || 'Не удалось извлечь ссылку');
              });
            }
          });
        });
        component.start(true);
      }
      /**
       * Извлеч поток из ссылки
       * @param {Object} element
       * @returns {function} call
       * @returns {function} error
       */

      function getStream(element, call, error) {
        if (element.season != undefined)
            element.link = extract[element.translation].json[element.season].folder[element.episode].file;
        else element.link = extract[element.translation].file;

        // console.log('element', element);
        if (element.link.startsWith('http') && (element.link.substr(-5) === ".m3u8" || element.link.substr(-4) === ".mp4")) {

            if ( results[element.translation].serial == 0 &&  Object.keys(results[element.translation].playlists).length > 1)
                return call(element);
            if ( results[element.translation].serial == 1 &&  Object.keys(results[element.translation].playlists[ element.season ][ element.episode ]).length > 1)
                return call(element);

        } else {

          var url = backend;
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + object.kinopoisk_id + '&translation=' + results[element.translation].translator_id;
          if (element.season != undefined) url += '&season=' + element.season + '&episode=' + element.episode;
          url += '&link=' + element.link;
          network.clear();
          network.timeout(15000);
          network.silent( url, function (str) {
              // console.log('str', str);
              if (str.indexOf('error') >= 0) { return error(str); }
              var json = JSON.parse(str);
              if (json.playlists && Object.keys(json.playlists).length === 0) return error('Ссылки на видео не получены');

              var result = results[element.translation];
              if (result.serial == 1) {
                  result.playlists[ element.season ][ element.episode ] = json.playlists;
                  // result.subtitles[ element.season+'_'+element.episode ] = json.subtitles;
                  success(results);
                  element.link = extract[element.translation].json[ element.season ].folder[ element.episode ].file;
                  element.quality = extract[element.translation].json[ element.season ].folder[ element.episode ].quality;
                  // element.subtitles = parseSubtitles(json.subtitles);
                  return call(element);
              } else {
                  result.playlists = json.playlists;
                  // result.subtitles = json.subtitles;
                  success(results);
                  element.link = extract[element.translation].file;
                  element.quality = extract[element.translation].quality;
                  // element.subtitles = parseSubtitles(json.subtitles);
                  return call(element);
              }

          }, function (a, c) {
              return error(network.errorDecode(a, c));
          },
              false, { dataType: 'text' }
          );

        };
      };

    };

    function Alloha(component, _object) {
      var network = new Lampa.Reguest();
      var extract = [];
      var results = [];
      var object = _object;
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        quality: 0
      };
        var translations = [];
        var backend = backendhost+'/allohaurl?v=333&kinopoisk_id=';
      /**
       * Поиск
       * @param {Object} _object
       */


      this.search = function (_object, kinopoisk_id) {
        object = _object;
        // console.log('kinopoisk_id', kinopoisk_id);

        if (isNaN(kinopoisk_id)) { component.empty("kinopoisk_id is null"); return; } else { if (object.kinopoisk_id == undefined) object.kinopoisk_id = kinopoisk_id }

        network.clear(); network.timeout(20000);
        network.silent( backend+kinopoisk_id+'&title='+encodeURI(object.search) , function (found) {
          // console.log('found',found);
          if (found && found.result) {
            if (found.action === 'done') {
              results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
              // console.log('results', results);
              success(results);
            }
          }
          component.loading(false);
          if (!Object.keys(results).length) { component.empty(found.error ? found.error : 'По запросу (' + 'kinopoisk_id='+kinopoisk_id + ') нет результатов'); }
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
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
        // уже присвоен results = json;
        extractData(results);
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
        extract = [];
        results.forEach( function (translation, keyt) {
          if (translation == null) return;
          // console.log('translation', translation);
          if (translations.indexOf(translation) == -1) { translations[keyt] = translation; }
          if (translation.serial == 1) {
            extract[keyt] = { json : [], "file": translation.link, 'serial': translation.serial, translation : translation.translation }
            translation.playlists.forEach(function (seasons, keys) {
              if (seasons == null) return;
              // console.log('keys', keys, 'seasons', seasons);

              extract[keyt].last_season = keys;
              var folder = [];
              seasons.forEach(function (episode, keye) {
                if (episode == null) return;
                // console.log('keye', keye, 'episode', episode);

                  var qualities = Object.keys(episode);
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
                    "translation": keyt,
                    "subtitles": translation.subtitles[keys + '_' + keye],
                  };
              })
              extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };
            })
          } else if (translation.serial == 0) {
            var qualities = (translation.playlists == undefined ? [] : Object.keys(translation.playlists));
            if (qualities.length > 0) {
              var qualitie = qualities.slice(-1).pop();
              var link = translation.playlists[qualitie];
              extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            } else {
              var qualitie = translation.quality;
              var link = 'link';
              extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            }
          }
        });
        // console.log('extract', extract);
      }

      function parseSubtitles(subtitle) {
        //console.log('subtitle', subtitle);
        if (subtitle === 'false' || subtitle === undefined || Object.keys(subtitle).length === 0) return null;
        if (subtitle) {
          var index = -1;
          return subtitle.split(',').map(function (sb) {
            var sp = sb.split(']');
            index++;
            return {
              label: sp[0].slice(1),
              url: sp.pop(),
              index: index
            };
          });
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
        var qualities =  null;

        // console.log('element', element, 'max_quality', max_quality);
        if (element.season) {
          qualities = extract[element.translation].json[element.season].folder[element.episode].qualities;
          quality = results[element.translation].playlists[element.season][element.episode];
          file = quality[qualities.slice().pop()];
        }
        else {
          qualities = extract[element.translation].qualities;
          quality = results[element.translation].playlists;
          file = quality[qualities.slice().pop()];
        }
        if ((Object.keys(quality).length == 1) && quality[2160] != undefined) quality = { 'AUTO': file };
        // console.log('file', file, 'qualities', qualities);

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
          voice_info: [],
          quality : [],
        };
        extract.forEach( function (translation, keyt) {
          if (translation.serial == 0) {

          } else if (translation.serial == 1) {

            var s = translation.last_season;
            while (s--) {
              if (filter_items.season.indexOf(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s)) == -1) {
                filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s));
              }
            }

            // console.log('translation.json', translation.json[choice.season + 1] );
            if (translation.json[choice.season + 1] && translation.json[choice.season + 1].folder.length !== 0) {
              // if (filter_items.voice.indexOf(translation.translation) == -1) {
                filter_items.voice[keyt] = translation.translation;
                filter_items.voice_info[keyt] = { id: keyt };
              // }
            }

          }

        })
        // console.log('choice.voice', choice.voice, 'filter_items',filter_items);
        if (filter_items.voice_info.length > 0 && !filter_items.voice_info[choice.voice]) {
          choice.voice = undefined;
          filter_items.voice_info.forEach( function (voice_info) {
            if (choice.voice == undefined) choice.voice = voice_info.id;
          })
        }
        if (filter_items.voice_info.length == 0 && (choice.season+1) < filter_items.season.length) { choice.season++; filter(); return; }
        // console.log('filter', choice);
        component.filter(filter_items, choice);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        extract.forEach(function (translation, keyt) {
          if (translation == null) return;
          if (translation.serial == 1) {
            translation.json.forEach(function (seasons, keys) {
              if ( keys == filter_data.season + 1 ) {
                seasons.folder.forEach(function (episode, keye) {
                  if (filter_items.voice_info[filter_data.voice] && episode.translation == filter_items.voice_info[filter_data.voice].id) {
                    filtred.push({
                      episode: parseInt(episode.episode),
                      season: episode.season,
                      title: episode.episode + (episode.title ? ' - ' + episode.title : ''),
                      //quality: episode.quality + 'p',
                      quality: (episode.qualities.length > 1 ? episode.quality+'p' : results[keyt].quality ),
                      translation: episode.translation,
                      subtitles: parseSubtitles(episode.subtitles),
                    });
                  }
                })
              }
            })
          } else {
            filtred.push({
              title: translation.translation,
              quality: (translation.qualities.length > 1 ? translation.quality+'p' : results[keyt].quality ),
              translation: keyt,
              subtitles: parseSubtitles(translation.subtitles),
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


      function append(items) {
        if (object.seasons == undefined) object.seasons = {};
        if (object.movie.number_of_seasons && object.seasons[choice.season+1] == undefined) {
          object.seasons[choice.season+1] = [];
          component.getEpisodes(choice.season+1, function (episodes) {
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
          element.info = element.season ? ' / ' + filter_items.voice[choice.voice] : '';
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
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }

          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);

            if (element.loading) return;
            element.loading = true;
            getStream(element, function (extra) {
              extra = getFile(extra, extra.quality);
              var first = {
                url: extra.file,
                timeline: view,
                quality: extra.quality,
                title: element.title,
                subtitles: element.subtitles,
              };
              Lampa.Player.play(first);

              if (element.season && Lampa.Platform.version) {
                var playlist = [];
                items.forEach(function (elem) {
                  var cell = {
                    url: function url(call) {
                      getStream(elem, function (extra) {
                        extra = getFile(extra, extra.quality);
                        cell.url = extra.file;
                        cell.quality = extra.quality;
                        cell.title = elem.title;
                        cell.subtitles = elem.subtitles;
                        call();
                      }, function () {
                        cell.url = '';
                        call();
                      });
                    },
                    timeline: elem.timeline,
                    title: elem.title
                  };
                  if (elem == element) cell.url = extra.file;
                  playlist.push(cell);
                });
                Lampa.Player.playlist(playlist);
              } else {
                Lampa.Player.playlist([first]);
              }

              element.loading = false;

              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
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
            file: function file(call) {
              getStream(element, function (extra) {
                extra = getFile(extra, extra.quality);
                call({
                  file: extra.file,
                  quality: extra.quality
                });
              }, function (error) {
                element.loading = false;
                Lampa.Noty.show(error || 'Не удалось извлечь ссылку');
              });
            }
          });
        });
        component.start(true);
      }
      /**
       * Извлеч поток из ссылки
       * @param {Object} element
       * @returns {function} call
       * @returns {function} error
       */

      function getStreamQuality(element, call) {
          network.clear();
          network.timeout(10000);
          network.silent( element.link, function (plist) {
            //console.log('plist', typeof(plist), plist);
            var playlists = {};
            plist.toString().match(/RESOLUTION\s*=\s*(\d+)x(\d+),.*?\n([^#]+)\n/g).forEach(function (elem) {
              var match = elem.match(/RESOLUTION\s*=\s*(\d+)x(\d+),.*?\n([^#]+)\n/)
              if (match[1] == 1920) match[2] = 1080;
              else if (match[1] == 1280) match[2] = 720;
              if (match) playlists[ match[2] ] =  element.link.replace('master.m3u8', match[3]);
            });
            // console.log('playlists', playlists);
            if (Object.keys(playlists).length > 0)
              if (results[element.translation].serial == 1) results[element.translation].playlists[ element.season ][ element.episode ] = playlists;
                else results[element.translation].playlists = playlists;
            // console.log('results', results);
            extractData(results);
            append(filtred());
            return call(element);

          }, function (a, c) {
              return call(element);
          }, false, {
            dataType: 'text'
          });
      }
      function getStream(element, call, error) {
        if (element.season)
          element.link = extract[element.translation].json[element.season].folder[element.episode].file;
        else element.link = extract[element.translation].file;

        // console.log('element', element);
        if (element.link.startsWith('http') && (element.link.substr(-5) === ".m3u8" || element.link.substr(-4) === ".mp4")) {
          if ( results[element.translation].serial == 0 &&  Object.keys(results[element.translation].playlists).length > 1)
            return call(element);
          if ( results[element.translation].serial == 1 &&  Object.keys(results[element.translation].playlists[ element.season ][ element.episode ]).length > 1)
            return call(element);

          getStreamQuality(element, function (extra) {
            return call(element);
          });

        } else {
          // var url = backend + object.kinopoisk_id + '&link=' + results[element.translation].link + '&translation=' + results[element.translation].translation_id;
          var url = backend + object.kinopoisk_id + '&link=' + element.link;
          // if (element.season) url += '&season=' + element.season + '&episode=' + element.episode;
          network.clear();
          network.timeout(20000);
          network["native"]( element.link, function (found) {
            // console.log('found', found);

            // LZW-compress a string
            function lzw_encode(s) {
                var dict = {};
                var data = (s + "").split("");
                var out = [];
                var currChar;
                var phrase = data[0];
                var code = 256;
                for (var i=1; i<data.length; i++) {
                    currChar=data[i];
                    if (dict[phrase + currChar] != null) {
                        phrase += currChar;
                    }
                    else {
                        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                        dict[phrase + currChar] = code;
                        code++;
                        phrase=currChar;
                    }
                }
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                for (var i=0; i<out.length; i++) {
                    out[i] = String.fromCharCode(out[i]);
                }
                return out.join("");
            }

            network.clear();
            network.timeout(15000);
            network.silent( url, function (str) {
              // console.log('str', str);

              if (str.indexOf('error') >= 0) { return error(str); }
              var json = JSON.parse(str);
              if (json.playlists && Object.keys(json.playlists).length === 0) return error('Ссылки на видео не получены');

              var result = results[element.translation];
              if (result.serial == 1) {
                result.playlists[ element.season ][ element.episode ] = json.playlists;
                result.subtitles[ element.season+'_'+element.episode ] = json.subtitles;
                success(results);
                element.link = extract[element.translation].json[ element.season ].folder[ element.episode ].file;
                element.quality = extract[element.translation].json[ element.season ].folder[ element.episode ].quality;
                element.subtitles = parseSubtitles(json.subtitles);
              } else {
                result.playlists = json.playlists;
                result.subtitles = json.subtitles;
                success(results);
                element.link = extract[element.translation].file;
                element.quality = extract[element.translation].quality;
                element.subtitles = parseSubtitles(json.subtitles);
              }

              getStreamQuality(element, function (extra) {
                return call(element);
              });

            }, function (a, c) {
              return error(network.errorDecode(a, c));
            },
              lzw_encode(found), { dataType: 'text' }
            );

          }, function (a, c) {
            return error(network.errorDecode(a, c));
          },
            false, { dataType: 'text' }
          );
        }
      };

    };

    function VideoDB(component, _object) {
      var network = new Lampa.Reguest();
      var extract = [];
      var results = [];
      var object = _object;
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        quality: 0
      };
        var translations = [];
        var backend = backendhost+'/lampa/kinoplayurl?v=333';
      /**
       * Поиск
       * @param {Object} _object
       */


      this.search = function (_object, kinopoisk_id, similar) {
        object = _object;
        // console.log('kinopoisk_id', kinopoisk_id, 'similar', typeof(similar), similar);

        if (isNaN(kinopoisk_id)) { component.empty("kinopoisk_id is null"); return; } else { if (object.kinopoisk_id == undefined) object.kinopoisk_id = kinopoisk_id }

        var title = object.search;
        if (typeof(similar) == 'object' && similar.slice().pop().link) title = kinopoisk_id;

        var url = backend;
        if (isNaN(title) == true || similar == undefined) {
          if (title.length < 3) { component.empty('title (' + title + ') is smoll'); return; }
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&title=' + title;
          var relise = /*object.search_date ||*/ (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
          var year = parseInt((relise + '').slice(0, 4));
          url += '&year=' + year;
        } else {
          var title = similar.slice().pop();
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&link=' + title.link;
        }

        component.loading(true);
        network.clear(); network.timeout(20000);
        network.silent( url, function (found) {
          // console.log('found',found);
          if (found && found.result) {
            if (found.action === 'select') {
              var json = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
              var similars = [];
              json.forEach(function (film) {
                similars.push({
                  id: film.id,
                  title: film.title + (film.year ? ', '+film.year : '') + (film.country ? ', '+film.country : '') + (film.category ? ', '+film.category : ''),
                  year: film.year,
                  link: film.link,
                  filmId: film.id
                });
              });
              component.similars(similars);
              component.loading(false);
              return;
            } else if (found.action === 'done') {
              results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
              //console.log('results', results);
              success(results);
            }
          }
          component.loading(false);
          if (!Object.keys(results).length) component.empty(found.error ? found.error : 'По запросу ('+object.search+') нет результатов');
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
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
        // уже присвоен results = json;
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
        extract = [];
        translations = [];
        results.forEach( function (translation, keyt) {
          if (translation == null) return;
          //console.log('translation', translation);

          if (translations.indexOf(translation) == -1) { translations[keyt] = translation; }
          if (translation.serial == 1) {
            extract[keyt] = { json : [], "file": translation.link, 'serial': translation.serial, translation : translation.translation }
            translation.playlists.forEach(function (seasons, keys) {
              if (seasons == null) return;
              //console.log('keys', keys, 'seasons', seasons);

              extract[keyt].last_season = keys;
              var folder = [];
              seasons.forEach(function (episode, keye) {
                if (episode == null) return;
                //console.log('keye', keye, 'episode', episode);

                  var qualities = Object.keys(episode);
                  //if (qualities) qualities = qualities.filter( function (elem) { return parseInt(elem) <= parseInt(????) && parseInt(elem) !== 0 });
                  var qualitie = Math.max.apply(null, qualities);
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
                  };

              })
              extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };
            })
          } else if (translation.serial == 0) {
            var qualities = (translation.playlists == undefined ? [] : Object.keys(translation.playlists));
            if (qualities.length > 0) {
              var qualitie = qualities.slice().pop();
              var link = translation.playlists[qualitie];
              extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            } else {
              var qualitie = translation.quality;
              var link = 'link';
              extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            }
          }
        })
        //console.log('extract', extract);
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

        //console.log('element', element, 'max_quality', max_quality);
        if (element.season) {
          file = extract[element.translation].json[element.season].folder[element.episode].file;
          qualities = extract[element.translation].json[element.season].folder[element.episode].qualities;
          quality = results[element.translation].playlists[element.season][element.episode];
          // file = quality[max_quality];
        }
        else {
          file = extract[element.translation].file;
          qualities = extract[element.translation].qualities;
          quality = results[element.translation].playlists
          // file = quality[max_quality];
        }
        // console.log('file', file, 'quality', quality, 'qualities', qualities);

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
          voice_info: [],
          quality : []
        };
        extract.forEach( function (translation, keyt) {
          if (translation.serial == 0) {

          } else if (translation.serial == 1) {

            var s = translation.last_season;
            while (s--) {
              if (filter_items.season.indexOf(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s)) == -1)
                filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s));
            }

            if (translation.json[choice.season + 1]) {
              if (filter_items.voice.indexOf(translation.translation) == -1) {
                filter_items.voice[keyt] = translation.translation;
                filter_items.voice_info[keyt] = { id: keyt };
              }
            }

          }

        })
        //console.log('choice.voice', choice.voice, 'filter_items',filter_items);
        if (filter_items.voice_info.length > 0 && !filter_items.voice_info[choice.voice]) {
          choice.voice = undefined;
          filter_items.voice_info.forEach( function (voice_info) {
            if (choice.voice == undefined) choice.voice = voice_info.id;
          })
        }
        if (filter_items.voice_info.length == 0 && (choice.season+1) < filter_items.season.length) { choice.season++; filter(); return; }
        component.filter(filter_items, choice);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        extract.forEach(function (translation, keyt) {
          if (translation == null) return;
          if (translation.serial == 1) {
            translation.json.forEach(function (seasons, keys) {
              if ( keys == filter_data.season + 1 ) {
                seasons.folder.forEach(function (episode, keye) {
                  if (episode.translation == filter_items.voice_info[filter_data.voice].id) {
                    filtred.push({
                      episode: parseInt(episode.episode),
                      season: episode.season,
                      title: episode.episode + (episode.title ? ' - ' + episode.title : ''),
                      //quality: episode.quality + 'p',
                      // quality: (episode.qualities.length > 1 ? episode.quality+'p' : results[keyt].quality ),
                      quality: (episode.qualities.length > 1 ? episode.quality+'p' : '' ),
                      translation: episode.translation
                    });
                  }
                })
              }
            })
          } else {
            filtred.push({
              title: translation.translation,
              // quality: (translation.qualities.length > 1 ? translation.quality+'p' : results[keyt].quality ),
              quality: (translation.qualities.length > 1 ? translation.quality+'p' : '' ),
              translation: keyt,
              subtitles: parseSubtitles(translation.subtitles),
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


      function append(items) {
        if (object.seasons == undefined) object.seasons = {};
        if (object.movie.number_of_seasons && object.seasons[choice.season+1] == undefined) {
          object.seasons[choice.season+1] = [];
          component.getEpisodes(choice.season+1, function (episodes) {
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
          element.info = element.season ? quality_info + Lampa.Utils.shortText(filter_items.voice[choice.voice], 50) : '';

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
            item.find('.online__quality').append(Lampa.Timeline.details(view, (element.season ? ' / ' : quality_info)));
          }

          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);

            if (element.loading) return;
            element.loading = true;
            getStream(element, function (extra) {
              extra = getFile(extra, extra.quality);
              var first = {
                title: element.title,
                url: extra.file,
                quality: extra.quality,
                timeline: view,
                subtitles: element.subtitles,
              };

              if (element.season && Lampa.Platform.version) {
                var playlist = [];
                items.forEach(function (elem) {
                  // var cell = {
                  //   url: function url(call) {
                  //     getStream(elem, function (extra) {
                  //       extra = getFile(extra, extra.quality);
                  //       cell.url = extra.file;
                  //       cell.quality = extra.quality;
                  //       call();
                  //     }, function () {
                  //       cell.url = '';
                  //       call();
                  //     });
                  //   },
                  //   timeline: elem.timeline,
                  //   title: elem.title
                  // };
                  // if (elem == element) cell.url = extra.file;
                  // playlist.push(cell);
                  var ex = getFile(elem, elem.quality);
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
            // file: function file(call) {
            //   getStream(element, function (extra) {
            //     extra = getFile(extra, extra.quality);
            //     call({
            //       file: extra.file,
            //       quality: extra.quality,
            //     });
            //   }, function (error) {
            //     element.loading = false;
            //     Lampa.Noty.show(error || 'Не удалось извлечь ссылку');
            //   });
            // }
            file: function file(call) {
              call(getFile(element, element.quality));
            }
          });
        });
        component.start(true);      }


      function getStream(element, call, error) {
        if (element.season)
          element.link = extract[element.translation].json[element.season].folder[element.episode].file;
        else element.link = extract[element.translation].file;

        //console.log('element', element);
        if (element.link.startsWith('http') && (element.link.substr(-5) === ".m3u8" || element.link.substr(-4) === ".mp4")) {
          if ( results[element.translation].serial == 0 &&  Object.keys(results[element.translation].playlists).length > 1)
            return call(element);
          if ( results[element.translation].serial == 1 &&  Object.keys(results[element.translation].playlists[ element.season ][ element.episode ]).length > 1)
            return call(element);
        } else {
          var url = backend;
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&filmId=' + results[element.translation].filmId;
          url += '&translation='+element.translation + '&season='+element.season + '&episode='+element.episode + '&link='+element.link;
          network.clear();
          network.timeout(10000);
          //console.log('url', url);
          network.silent( url, function (json) {
              //console.log('json', json);

            json = (typeof(json) === "string" ? JSON.parse(json) : json);
            if (json && json.result) {
              if (json.action === 'done') {
                results = json.data;
                success(results);
                // element.link = extract[element.translation].file;
                // element.quality = extract[element.translation].quality;
                // element.subtitles = parseSubtitles(json.subtitles);
                if ( results[element.translation].serial == 1 && results[element.translation].playlists[ element.season ][ element.episode ] == undefined) { error('episode translation not found'); return; }
                return call(element);
              }
            }

          }, function (a, c) {
            return error(network.errorDecode(a, c));
          },
            false, { dataType: 'text' }
          );
        }
      };


      function parseSubtitles(subtitle) {
        //console.log('subtitle', subtitle);
        if (subtitle == 'false' || subtitle == undefined) return null;
        if (subtitle) {
          var index = -1;
          return subtitle.split(',').map(function (sb) {
            var sp = sb.split(']');
            index++;
            return {
              label: sp[0].slice(1),
              url: sp.pop(),
              index: index
            };
          });
        }
      }

    };

    function ZetFlix(component, _object) {
      var network = new Lampa.Reguest();
      var extract = [];
      var results = [];
      var object = _object;
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        quality: 0
      };
        var translations = [];
        var backend = backendhost+'/lampa/zetflixurl?v=333';
      /**
       * Поиск
       * @param {Object} _object
       */


      this.search = function (_object, kinopoisk_id, similar) {
        object = _object;
        // console.log('kinopoisk_id', kinopoisk_id, 'similar', similar);

        var title = object.search;
        if (typeof(similar) == 'object' && similar.slice().pop().link) title = kinopoisk_id;

        var url = backend;
        if (isNaN(title) == true || similar == undefined) {
          if (title.length < 3) { component.empty('title (' + title + ') is smoll'); return; }
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&title=' + title;
          var relise = /*object.search_date ||*/ (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
          var year = parseInt((relise + '').slice(0, 4));
          url += '&year=' + year;
        } else {
          var title = similar.slice().pop();
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&link=' + title.link;
        }

        component.loading(true);
        network.clear(); network.timeout(20000);
        network.silent( url, function (found) {
          // console.log('found',found);
          if (found && found.result) {
            if (found.action === 'select') {
              var json = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
              var similars = [];
              json.forEach(function (film) {
                similars.push({
                  id: film.id,
                  title: film.title + (film.year ? ', '+film.year : '') + (film.country ? ', '+film.country : '') + (film.category ? ', '+film.category : ''),
                  year: film.year,
                  link: film.link,
                  filmId: film.id
                });
              });
              component.similars(similars);
              component.loading(false);
              return;
            } else if (found.action === 'done') {
              results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
              //console.log('results', results);
              success(results);
            }
          }
          component.loading(false);
          if (!Object.keys(results).length) component.empty(found.error ? found.error : 'По запросу ('+object.search+') нет результатов');
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
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
        // уже присвоен results = json;
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
        extract = [];
        translations = [];
        results.forEach( function (translation, keyt) {
          if (translation == null) return;
          //console.log('translation', translation);

          if (translations.indexOf(translation) == -1) { translations[keyt] = translation; }
          if (translation.serial == 1) {
            extract[keyt] = { json : [], "file": translation.link, 'serial': translation.serial, translation : translation.translation }
            translation.playlists.forEach(function (seasons, keys) {
              if (seasons == null) return;
              //console.log('keys', keys, 'seasons', seasons);

              extract[keyt].last_season = keys;
              var folder = [];
              seasons.forEach(function (episode, keye) {
                if (episode == null) return;
                //console.log('keye', keye, 'episode', episode);

                  var qualities = Object.keys(episode);
                  //if (qualities) qualities = qualities.filter( function (elem) { return parseInt(elem) <= parseInt(????) && parseInt(elem) !== 0 });
                  var qualitie = Math.max.apply(null, qualities);
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
                  };

              })
              extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };
            })
          } else if (translation.serial == 0) {
            var qualities = (translation.playlists == undefined ? [] : Object.keys(translation.playlists));
            if (qualities.length > 0) {
              var qualitie = qualities.slice().pop();
              var link = translation.playlists[qualitie];
              extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            } else {
              var qualitie = translation.quality;
              var link = 'link';
              extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            }
          }
        })
        //console.log('extract', extract);
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

        //console.log('element', element, 'max_quality', max_quality);
        if (element.season) {
          file = extract[element.translation].json[element.season].folder[element.episode].file;
          qualities = extract[element.translation].json[element.season].folder[element.episode].qualities;
          quality = results[element.translation].playlists[element.season][element.episode];
          // file = quality[max_quality];
        }
        else {
          file = extract[element.translation].file;
          qualities = extract[element.translation].qualities;
          quality = results[element.translation].playlists
          // file = quality[max_quality];
        }
        // console.log('file', file, 'quality', quality, 'qualities', qualities);

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
          voice_info: [],
          quality : []
        };
        extract.forEach( function (translation, keyt) {
          if (translation.serial == 0) {

          } else if (translation.serial == 1) {

            var s = translation.last_season;
            while (s--) {
              if (filter_items.season.indexOf(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s)) == -1)
                filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s));
            }

            if (translation.json[choice.season + 1]) {
              if (filter_items.voice.indexOf(translation.translation) == -1) {
                filter_items.voice[keyt] = translation.translation;
                filter_items.voice_info[keyt] = { id: keyt };
              }
            }

          }

        })
        //console.log('choice.voice', choice.voice, 'filter_items',filter_items);
        if (filter_items.voice_info.length > 0 && !filter_items.voice_info[choice.voice]) {
          choice.voice = undefined;
          filter_items.voice_info.forEach( function (voice_info) {
            if (choice.voice == undefined) choice.voice = voice_info.id;
          })
        }
        if (filter_items.voice_info.length == 0 && (choice.season+1) < filter_items.season.length) { choice.season++; filter(); return; }
        component.filter(filter_items, choice);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        extract.forEach(function (translation, keyt) {
          if (translation == null) return;
          if (translation.serial == 1) {
            translation.json.forEach(function (seasons, keys) {
              if ( keys == filter_data.season + 1 ) {
                seasons.folder.forEach(function (episode, keye) {
                  if (episode.translation == filter_items.voice_info[filter_data.voice].id) {
                    filtred.push({
                      episode: parseInt(episode.episode),
                      season: episode.season,
                      title: episode.episode + (episode.title ? ' - ' + episode.title : ''),
                      //quality: episode.quality + 'p',
                      // quality: (episode.qualities.length > 1 ? episode.quality+'p' : results[keyt].quality ),
                      quality: (episode.qualities.length > 1 ? episode.quality+'p' : '' ),
                      translation: episode.translation
                    });
                  }
                })
              }
            })
          } else {
            filtred.push({
              title: translation.translation,
              // quality: (translation.qualities.length > 1 ? translation.quality+'p' : results[keyt].quality ),
              quality: (translation.qualities.length > 1 ? translation.quality+'p' : '' ),
              translation: keyt,
              subtitles: parseSubtitles(translation.subtitles),
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


      function append(items) {
        if (object.seasons == undefined) object.seasons = {};
        if (object.movie.number_of_seasons && object.seasons[choice.season+1] == undefined) {
          object.seasons[choice.season+1] = [];
          component.getEpisodes(choice.season+1, function (episodes) {
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
          element.info = element.season ? quality_info + Lampa.Utils.shortText(filter_items.voice[choice.voice], 50) : '';

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
            item.find('.online__quality').append(Lampa.Timeline.details(view, (element.season ? ' / ' : quality_info)));
          }

          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);

            if (element.loading) return;
            element.loading = true;
            getStream(element, function (extra) {
              extra = getFile(extra, extra.quality);
              var first = {
                url: extra.file,
                timeline: view,
                quality: extra.quality,
                title: element.title
              };
              Lampa.Player.play(first);

              if (element.season && Lampa.Platform.version) {
                var playlist = [];
                items.forEach(function (elem) {
                  var cell = {
                    url: function url(call) {
                      getStream(elem, function (extra) {
                        extra = getFile(extra, extra.quality);
                        cell.url = extra.file;
                        cell.quality = extra.quality;
                        call();
                      }, function () {
                        cell.url = '';
                        call();
                      });
                    },
                    timeline: elem.timeline,
                    title: elem.title
                  };
                  if (elem == element) cell.url = extra.file;
                  playlist.push(cell);
                });
                Lampa.Player.playlist(playlist);
              } else {
                Lampa.Player.playlist([first]);
              }

              element.loading = false;
              if (element.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(element.subtitles);

              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
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
            file: function file(call) {
              getStream(element, function (extra) {
                extra = getFile(extra, extra.quality);
                call({
                  file: extra.file,
                  quality: extra.quality,
                });
              }, function (error) {
                element.loading = false;
                Lampa.Noty.show(error || 'Не удалось извлечь ссылку');
              });
            }
          });
        });
        component.start(true);      }


      function getStream(element, call, error) {
        if (element.season)
          element.link = extract[element.translation].json[element.season].folder[element.episode].file;
        else element.link = extract[element.translation].file;

        //console.log('element', element);
        if (element.link.startsWith('http') && (element.link.substr(-5) === ".m3u8" || element.link.substr(-4) === ".mp4")) {
          if ( results[element.translation].serial == 0 &&  Object.keys(results[element.translation].playlists).length > 1)
            return call(element);
          if ( results[element.translation].serial == 1 &&  Object.keys(results[element.translation].playlists[ element.season ][ element.episode ]).length > 1)
            return call(element);
        } else {
          var url = backend;
          url += '&id=' + object.movie.id + '&kinopoisk_id=' + (object.kinopoisk_id || 0) + '&filmId=' + results[element.translation].filmId;
          url += '&translation='+element.translation + '&season='+element.season + '&episode='+element.episode + '&link='+element.link;
          network.clear();
          network.timeout(10000);
          //console.log('url', url);
          network.silent( url, function (json) {
              //console.log('json', json);

            json = (typeof(json) === "string" ? JSON.parse(json) : json);
            if (json && json.result) {
              if (json.action === 'done') {
                results = json.data;
                success(results);
                // element.link = extract[element.translation].file;
                // element.quality = extract[element.translation].quality;
                // element.subtitles = parseSubtitles(json.subtitles);
                if ( results[element.translation].serial == 1 && results[element.translation].playlists[ element.season ][ element.episode ] == undefined) { error('episode translation not found'); return; }
                return call(element);
              }
            }

          }, function (a, c) {
            return error(network.errorDecode(a, c));
          },
            false, { dataType: 'text' }
          );
        }
      };


      function parseSubtitles(subtitle) {
        //console.log('subtitle', subtitle);
        if (subtitle == 'false' || subtitle == undefined) return null;
        if (subtitle) {
          var index = -1;
          return subtitle.split(',').map(function (sb) {
            var sp = sb.split(']');
            index++;
            return {
              label: sp[0].slice(1),
              url: sp.pop(),
              index: index
            };
          });
        }
      }

    };

    function Kodik(component, _object) {
      var network = new Lampa.Reguest();
      var extract = [];
      var results = [];
      var object = _object;
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        quality: 0
      };
        var translations = [];
        var backend = backendhost+'/kodikurl?v=333&kinopoisk_id=';
      /**
       * Поиск
       * @param {Object} _object
       */


      this.search = function (_object, kinopoisk_id) {
        object = _object;
        // console.log('kinopoisk_id', kinopoisk_id);

        if (isNaN(kinopoisk_id)) { component.empty("kinopoisk_id is null"); return; } else { if (object.kinopoisk_id == undefined) object.kinopoisk_id = kinopoisk_id }

        network.clear(); network.timeout(20000);
        network.silent( backend+kinopoisk_id+'&title='+encodeURI(object.search) , function (found) {
          // console.log('found',found);
          if (found && found.result) {
            if (found.action === 'done') {
              results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data);
              // console.log('results', results);
              success(results);
            }
          }
          component.loading(false);
          if (!Object.keys(results).length) { component.empty(found.error ? found.error : 'По запросу (' + 'kinopoisk_id='+kinopoisk_id + ') нет результатов'); }
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
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
        getEpisodes(choice.voice, function () {
          component.reset();
          filter();
          append(filtred());
          component.saveChoice(choice);
        });
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
        // уже присвоен results = json;
        getEpisodes(choice.voice, function () {
          extractData(results);
          filter();
          append(filtred());
          component.saveChoice(choice);
        });
      }
      /**
       * Получить список серий озвучки
       * @param {Int} voice
       * @param {function} call
       * @returns null
       */


      function getEpisodes(voice, call) {
        // console.log('getEpisodes', results[voice].getEpisodes, results[voice].serial, Object.keys(results[voice].playlists).length);
        if (results[voice] == undefined) return;
        if (results[voice].serial == 0 || results[voice].getEpisodes || Object.keys(results[voice].playlists).length > 0) {
          call();
        } else {
          results[voice].getEpisodes = true;
          network.clear();
          network.timeout(20000);
          var url = backend + object.kinopoisk_id + '&link=' + results[voice].link + '&translation=' + results[voice]./*translation_*/id;
          network.silent(url, function (found) {
            //console.log('found', found);
            if (found.error) { component.empty(found.error); return; }
            if (found.action === 'done') {
              results = (typeof(found.data) === "string" ? JSON.parse(found.data) : found.data); results[voice].getEpisodes = true;
              //console.log('results', results);
              extractData(results);
            }
            call();
            setTimeout(component.closeFilter, 25);
          }, function (a, c) {
            component.empty(network.errorDecode(a, c));
          });
        }
      }
      /**
       * Получить потоки
       * @param {String} str
       * @param {Int} max_quality
       * @returns string
       */


      function extractData(json) {
        extract = [];
        results.forEach( function (translation, keyt) {
          if (translation == null) return;
          // console.log('translation', translation);
          if (translations[translation.translation] == undefined) translations[ translation.translation ] = { };

          if (translation.serial == 1) {
            if (translations[ translation.translation ][ translation.last_season ] == undefined) {
              translations[ translation.translation ][ translation.last_season ] = { key: keyt };
            } else {
              var trs = translation.translation +'-'+ translation.id.split('-').pop();
              translations[ trs ] = { };
              translations[ trs ][ translation.last_season ] = { key: keyt };
            }
            extract[keyt] = { json : [], "file": translation.link, 'serial': translation.serial, translation : translation.translation, id : translation.id, last_season: translation.last_season }
            translation.playlists.forEach(function (seasons, keys) {
              if (seasons == null) return;
              // console.log('keys', keys, 'seasons', seasons);

              extract[keyt].last_season = keys;
              var folder = [];
              seasons.forEach(function (episode, keye) {
                if (episode == null) return;
                // console.log('keye', keye, 'episode', episode);

                  var qualities = Object.keys(episode);
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
                    "translation": keyt,
                    'subtitles': translation.subtitles[keys + '_' + keye],
                  };
              })
              extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };
            })
          } else if (translation.serial == 0) {
            var qualities = (translation.playlists == undefined ? [] : Object.keys(translation.playlists));
            if (qualities.length > 0) {
              var qualitie = qualities.slice(-1).pop();
              var link = translation.playlists[qualitie];
              extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            } else {
              var qualitie = translation.quality;
              var link = 'link';
              extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial, subtitles: translation.subtitles };
            }
          }
        });
        // console.log('extract', extract);
      }

      function parseSubtitles(subtitle) {
        //console.log('subtitle', subtitle);
        if (subtitle === 'false' || subtitle === undefined || Object.keys(subtitle).length === 0) return null;
        if (subtitle) {
          var index = -1;
          return subtitle.split(',').map(function (sb) {
            var sp = sb.split(']');
            index++;
            return {
              label: sp[0].slice(1),
              url: sp.pop(),
              index: index
            };
          });
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

        //console.log('element', element, 'max_quality', max_quality);
        if (element.season) {
            file = extract[element.translation].json[element.season].folder[element.episode].file;
            qualities = extract[element.translation].json[element.season].folder[element.episode].qualities;
            quality = results[element.translation].playlists[element.season][element.episode];
        }
        else {
            file = extract[element.translation].file;
            qualities = extract[element.translation].qualities;
            quality = results[element.translation].playlists;
        }
        //console.log('file', file, 'qualities', qualities);

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
          voice_info: [],
          quality : [],
        };
        extract.forEach( function (translation, keyt) {
          if (translation.serial == 0) {

          } else if (translation.serial == 1) {

            var s = translation.last_season;
            while (s--) {
              if (filter_items.season.indexOf(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s)) == -1) {
                filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s));
              }
            }

            var trs = translation.translation +'-'+ translation.id.split('-').pop();
            // console.log('season', season, 'translations', translations[translation.translation][ choice.season + 1 ] );
            if (translations[ translation.translation ][ choice.season + 1 ] != undefined && translations[translation.translation][ choice.season + 1 ].key == keyt) {
                filter_items.voice[keyt] = translation.translation;
                filter_items.voice_info[keyt] = { id: keyt };
            } else if (translations[ trs ] != undefined && translations[ trs ][ choice.season + 1 ] != undefined) {
                filter_items.voice[keyt] = translation.translation;
                filter_items.voice_info[keyt] = { id: keyt };
            }

          }

        })
        if (filter_items.voice_info.length > 0 && filter_items.voice_info[choice.voice] == undefined) {
            var voice_name = extract[choice.voice].translation;
            if (translations[voice_name][choice.season + 1] != undefined) {
              choice.voice = translations[voice_name][choice.season + 1].key;
              success(results);
              return;
            }
        }
        if (filter_items.voice_info.length == 0 && (choice.season+1) < filter_items.season.length) { choice.season++; filter(); return; }
        // console.log('filter', choice);
        component.filter(filter_items, choice);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');
        // console.log('filter_data', filter_data, 'filter_items',filter_items);

        extract.forEach(function (translation, keyt) {
          if (translation == null) return;
          if (translation.serial == 1) {
            translation.json.forEach(function (seasons, keys) {
              if ( keys == filter_data.season + 1 ) {
                seasons.folder.forEach(function (episode, keye) {
                  if (filter_items.voice_info[filter_data.voice] && episode.translation == filter_items.voice_info[filter_data.voice].id) {
                    filtred.push({
                      episode: parseInt(episode.episode),
                      season: episode.season,
                      title: episode.episode + (episode.title ? ' - ' + episode.title : ''),
                      //quality: episode.quality + 'p',
                      quality: (episode.qualities.length > 1 ? episode.quality+'p' : results[keyt].quality ),
                      translation: episode.translation,
                      subtitles: parseSubtitles(episode.subtitles),
                    });
                  }
                })
              }
            })
          } else {
            filtred.push({
              title: translation.translation,
              quality: (translation.qualities.length > 1 ? translation.quality : results[keyt].quality ),
              translation: keyt,
              subtitles: parseSubtitles(translation.subtitles),
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


      function append(items) {
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var last_episode = component.getLastEpisode(items);
        items.forEach(function (element) {
          if (element.season) element.title = 'S' + element.season + ' / ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.title;
          element.info = element.season ? ' / ' + filter_items.voice[choice.voice] : '';
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
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }

          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);

            if (element.loading) return;
            element.loading = true;
            getStream(element, function (extra) {
              extra = getFile(extra, extra.quality);
              var first = {
                url: extra.file,
                timeline: view,
                quality: extra.quality,
                title: element.title,
                subtitles: element.subtitles,
              };
              Lampa.Player.play(first);

              if (element.season && Lampa.Platform.version) {
                var playlist = [];
                items.forEach(function (elem) {
                  var cell = {
                    url: function url(call) {
                      getStream(elem, function (extra) {
                        extra = getFile(extra, extra.quality);
                        cell.url = extra.file;
                        cell.quality = extra.quality;
                        cell.title = elem.title;
                        cell.subtitles = elem.subtitles;
                        call();
                      }, function () {
                        cell.url = '';
                        call();
                      });
                    },
                    timeline: elem.timeline,
                    title: elem.title
                  };
                  if (elem == element) cell.url = extra.file;
                  playlist.push(cell);
                });
                Lampa.Player.playlist(playlist);
              } else {
                Lampa.Player.playlist([first]);
              }

              element.loading = false;

              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
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
            file: function file(call) {
              getStream(element, function (extra) {
                extra = getFile(extra, extra.quality);
                call({
                  file: extra.file,
                  quality: extra.quality
                });
              }, function (error) {
                element.loading = false;
                Lampa.Noty.show(error || 'Не удалось извлечь ссылку');
              });
            }
          });
        });
        component.start(true);
      }
      /**
       * Извлеч поток из ссылки
       * @param {Object} element
       * @returns {function} call
       * @returns {function} error
       */

      function getStream(element, call, error) {
        if (element.season)
          element.link = extract[element.translation].json[element.season].folder[element.episode].file;
        else element.link = extract[element.translation].file;

        // console.log('element', element);
        if (element.link.startsWith('http') && (element.link.substr(-5) === ".m3u8" || element.link.substr(-4) === ".mp4")) {
          if ( results[element.translation].serial == 0 &&  Object.keys(results[element.translation].playlists).length > 1)
            return call(element);
          if ( results[element.translation].serial == 1 &&  Object.keys(results[element.translation].playlists[ element.season ][ element.episode ]).length > 1)
            return call(element);
        } else {
          var url = backend + object.kinopoisk_id + '&translation=' + results[element.translation]./*translation_*/id;
          if (element.season) url += '&season=' + element.season + '&episode=' + element.episode;
          url += '&link=' + results[element.translation].link;
          network.clear();
          network.timeout(20000);
          network.silent( url, function (str) {
            // console.log('str', str);

            if (str.indexOf('error') >= 0) { return error(str); }
            var json = JSON.parse(str);
            if (json.playlists && Object.keys(json.playlists).length === 0) return error('Ссылки на видео не получены');

            var result = results[element.translation];
            if (result.serial == 1) {
              result.playlists[ element.season ][ element.episode ] = json.playlists;
              result.subtitles[ element.season+'_'+element.episode ] = json.subtitles;
              success(results);
              element.link = extract[element.translation].json[ element.season ].folder[ element.episode ].file;
              element.quality = extract[element.translation].json[ element.season ].folder[ element.episode ].quality;
              element.subtitles = parseSubtitles(json.subtitles);
              return call(element);
            } else {
              result.playlists = json.playlists;
              result.subtitles = json.subtitles;
              success(results);
              element.link = extract[element.translation].file;
              element.quality = extract[element.translation].quality;
              element.subtitles = parseSubtitles(json.subtitles);
              return call(element);
            }

          }, function (a, c) {
            return error(network.errorDecode(a, c));
          },
            false, { dataType: 'text' }
          );
        }
      };

    };

    function Bazon(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var results = [];
      var object = _object;
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        quality: 0,
        hlsproxy: 0
      };
        var translations = [];
        // var url = 'https://bazon.cc/api/search?token=93c3474cbfe2c87d96fcf0d4d020ac98&kp=1005878';
        var url = 'http://back.freebie.tom.ru/bazon/api/search?kp=';
        // var backend = 'https://bazon.cc/api/playlist?token=93c3474cbfe2c87d96fcf0d4d020ac98&kp=1005878&ref=&ip=freebie.tom.ru';
        var backend = backendhost+'/bazonurl?v=333&kpid=';
        var hlsproxy = { use: false, link: 'http://back.freebie.tom.ru:8888/', extension: '.m3u8' };
      /**
       * Поиск
       * @param {Object} _object
       */


      this.search = function (_object, kinopoisk_id) {
        object = _object;
        //console.log('kinopoisk_id', kinopoisk_id);

        if (isNaN(kinopoisk_id)) { component.empty("kinopoisk_id is null"); return; } else { if (object.kinopoisk_id == undefined) object.kinopoisk_id = kinopoisk_id }

        if (!window.whois) {
          component.whois(kinopoisk_id); component.loading(false); return;
        } else if (window.whois.ip.startsWith('192.168.1')) window.whois.hlsproxy = false; else window.whois.hlsproxy = true;

        network.clear();
        network.timeout(30000);
        network.silent(url + kinopoisk_id, function (found) {
          //console.log('found',found);
          if (found && found.results) {
            results = (typeof(found) === "string" ? JSON.parse(found) : found).results;
            success(results);
          }
          component.loading(false);
          if (!Object.keys(results).length) component.empty(found.error ? found.error : 'По запросу (' + 'kinopoisk_id='+kinopoisk_id + ') нет результатов');
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
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
       * Успешно, есть данные``
       * @param {Object} json
       */


      function success(json) {
        // уже присвоен results = json;
        extractData(json);
        filter();
        append(filtred());
        Lampa.Noty.show('Работает только во встроенном плеере или MX (для Android на 102+ версии). Иначе "Фильтр => HLSProxy => On"');
      }
      /**
       * Получить потоки
       * @param {String} str
       * @param {Int} max_quality
       * @returns string
       */


      function extractData(json) {
        extract = [];
        results.forEach( function (translation, keyt) {
          //console.log('translation', translation);
          if (translations.indexOf(translation.translation) == -1) { translations[translation.translation] = keyt; }
          if (translation.serial == 1) {
            extract[keyt] = { json : [], "file": translation.link, 'serial': translation.serial }

            var playlists = translation.playlists || translation.episodes;
            for( var keys in playlists ) {
              var seasons = playlists[keys];
              //console.log('keys', keys, 'seasons', seasons);
              var folder = [];
              for( var keye in seasons) {
                var episode = seasons[keye];
                //console.log('keye', keye, 'episode', episode);

                var qualities = Object.keys(episode);
                //if (qualities) qualities = qualities.filter( function (elem) { return parseInt(elem) <= parseInt(????) && parseInt(elem) !== 0 });
                var qualitie = Math.max.apply(null, qualities);
                var link = episode[qualitie] || translation.link;

                if (!translation.playlists) {
                  qualitie = episode;
                  qualities = [ episode ];
                }

                folder[keye] = {
                  "id": keys + '_' + keye,
                  "comment": keye + ' серия<br><i>' + qualitie + '</i>',
                  "file": link,
                  "episode": keye,
                  "season": keys,
                  "quality": qualitie,
                  "qualities": qualities,
                  "translation": keyt,
                };
              }
              extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };

            }
          } else if (translation.serial == 0) {
            if (translation.playlists) {
              for( var keym in translation.playlists) {
                var movie =  translation.playlists[keym];

                var qualities = Object.keys(translation.playlists);
                // if (qualities) qualities = qualities.filter( function (elem) { return parseInt(elem) <= parseInt(????) && parseInt(elem) !== 0 });
                var qualitie = Math.max.apply(null, qualities);
                var link = movie;

                extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial };
              }
            } else {
              var qualities = ['480','720','1080','2160'].filter( function (elem) { return parseInt(elem) <= parseInt(translation.max_qual) && parseInt(elem) !== 0 });
              // var qualities = [ translation.max_qual ];
              extract[keyt] = { json : {}, "file": translation.link, translation : translation.translation, "quality": translation.max_qual, "qualities": qualities, 'serial': translation.serial };
            }
          }
        })
        //console.log('extract', extract);
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
        var playlists;

        // console.log('element', element);
        if (element.season) {
          file = extract[element.translation].json[element.season].folder[element.episode].file;
          qualities = extract[element.translation].json[element.season].folder[element.episode].qualities;
          max_quality = extract[element.translation].quality;
          if (results[element.translation] != undefined && results[element.translation].playlists &&
              results[element.translation].playlists[element.season] != undefined && results[element.translation].playlists[element.season][element.episode] != undefined)
              playlists = results[element.translation].playlists[element.season][element.episode];
        }
        else {
          file = extract[element.translation].file;
          qualities = extract[element.translation].qualities;
          max_quality = extract[element.translation].quality;
          if (results[element.translation] != undefined && results[element.translation].playlists != undefined) playlists = results[element.translation].playlists;
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
              // quality[qualities[n]+'p'] = file.replace( new RegExp(max_quality+'.mp4', 'ig'), qualities[n]+'.mp4');
              if (playlists != undefined && playlists[ qualities[n] ] != undefined) quality[qualities[n]+'p'] = playlists[qualities[n]]; else quality[qualities[n]+'p'] = file_filtred;
              if (hlsproxy.use) quality[qualities[n]+'p'] = hlsproxy.link + '?link=' + quality[qualities[n]+'p'];
                  else if (choice.hlsproxy == 2) quality[qualities[n]+'p'] = quality[qualities[n]+'p'];
                  else quality[qualities[n]+'p'] = backendhost + '/corsproxy/' + quality[qualities[n]+'p'];
              file_filtred = quality[qualities[n]+'p'];
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
          quality : [],
          hlsproxy : ['Off', 'On', 'On + api']
        };

        results.forEach( function (translation, keyt) {

          if (translation.serial == 0) {

            var qualities = ['480','720','1080','2160'];
            if (translation.max_qual) {
              for( var key in qualities)
                if (parseInt(translation.max_qual)  >= parseInt(qualities[key]))
                  if (filter_items.quality.indexOf(qualities[key]) == -1) filter_items.quality.unshift(qualities[key]);
            }
            if (filter_items.quality.length == 0) filter_items.quality.push('720');

          } else if (translation.serial == 1) {

            var s = translation.last_season;
            while (s--) {
              if (filter_items.season.indexOf(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s)) == -1)
                filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s));
            }

            var playlists = translation.playlists || translation.episodes;
            if (playlists[choice.season + 1]) {
              if (filter_items.voice.indexOf(translation.translation) == -1) {
                filter_items.voice[keyt] = translation.translation;
                filter_items.voice_info[keyt] = { id: keyt };
              }
            }

          }

        })
        //console.log('choice.voice', choice.voice, 'filter_items',filter_items);
        if (filter_items.voice_info.length > 0 && !filter_items.voice_info[choice.voice]) {
          choice.voice = undefined;
          filter_items.voice_info.forEach( function (voice_info) {
            if (choice.voice == undefined) choice.voice = voice_info.id;
          })
        }
        component.filter(filter_items, choice);
        //console.log('filter_items', filter_items);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');
        if (filter_data)
          if (filter_data.hlsproxy == 0) hlsproxy.use = false;
          else if (filter_data.hlsproxy == 1) hlsproxy.use = true;
          else if (filter_data.hlsproxy == 2 && window.whois.hlsproxy == false) hlsproxy.use = false;
          else hlsproxy.use = true;
          // console.log('hlsproxy.use', hlsproxy.use);

        for( var keym in extract) {
          var movie = extract[keym];
          if (movie.serial == 1) {
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
          } else {
            var select_quality = parseInt(filter_items.quality[filter_data.quality]);
            var qualities = movie.qualities.filter( function (elem) { return parseInt(elem) <= select_quality });
            var qualitie = Math.max.apply(null, qualities);
            if (qualitie) {
              filtred.push({
                title: movie.translation,
                quality: movie.quality + 'p => ' + qualitie + 'p',
                translation: keym,
              });
            }
          };
        }
        //console.log('filtred', filtred);
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
          component.getEpisodes(choice.season+1, function (episodes) {
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

            if (element.loading) return;
            element.loading = true;
            getStream(element, function (extra) {

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

                element.loading = false;
                if (playlist.length > 1) first.playlist = playlist;
                Lampa.Player.play(first);
                Lampa.Player.playlist(playlist);

                if (viewed.indexOf(hash_file) == -1) {
                  viewed.push(hash_file);
                  item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                  Lampa.Storage.set('online_view', viewed);
                }
              }

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
            file: function file(call) {
              call(getFile(element, element.quality));
            }
          });
        });
        component.start(true);
      }

      function getStream(element, call, error) {
        if (hlsproxy.hlsproxy_last != undefined && choice.hlsproxy != hlsproxy.hlsproxy_last) return error('Нужно перезайти в карточку, т.к. сменился HLSProxy');

        if (element.season)
            element.link = extract[element.translation].json[element.season].folder[element.episode].file
        else element.link = extract[element.translation].file

        if (element.link.substr(-4) === ".mp4" || element.link.indexOf('index.m3u8') > 0) return call(element);
        //console.log('element', element);

        var link = backend + object.kinopoisk_id;
        if (element.season != undefined) link += '&season=' + element.season + '&episode=' + element.episode;
        link += '&quality=' + element.quality.split('p')[0] + '&proxy=' + hlsproxy.use + '&link=' + element.link;
        if (choice.hlsproxy == 2) link = backend.replace('bazonurl','bazonurl2') + object.kinopoisk_id;
        network.clear();
        network.timeout(15000);
        network.silent( link, function (found) {

          //console.log('found', found);
          if (found == undefined) return error('found == undefined');
          if (typeof(found) === "string") found = JSON.parse(found);
          if (found.error   !== undefined) return error(found.error);
          hlsproxy.hlsproxy_last = choice.hlsproxy;

          if (choice.hlsproxy == 2) {
            if (found.results === undefined) return error('found.results === undefined)');
            found.results.forEach( function (translation, keyt) {
              var key = translations[translation.translation];
              if (results[key]) results[key].playlists = translation.playlists;
            })
          } else {
            results[element.translation].playlists = found;
          }

          extractData(results);
          return call(element);

        }, function (a, c) {
          return error(network.errorDecode(a, c))
        }, false, {
          dataType: 'text'
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


      function getFile(element) {
        var file = '';
        var quality = false;
        var max_quality = 1080;
        var path = element.slice(0, element.lastIndexOf('/')) + '/';

        if (file.split('/').pop().replace('.mp4', '') !== max_quality) {
          file = path + max_quality + '.mp4';
        }

        quality = {};
        var mass = [1080, 720, 480, 360];
        mass = mass.slice(mass.indexOf(max_quality));
        mass.forEach(function (n) {
          quality[n + 'p'] = path + n + '.mp4';
        });
        var preferably = Lampa.Storage.get('video_quality_default', '1080') + 'p';
        if (quality[preferably]) file = quality[preferably];
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
                    filtred.push({
                      file: eps.file,
                      episode: parseInt(se.title.match(/\d+/)),
                      season: parseInt(t.title.match(/\d+/)),
                      quality: '',
                      info: ' / ' + Lampa.Utils.shortText(eps.title, 50)
                    });
                  }
                });
              });
            }
          });
        } else {
          extract.forEach(function (data) {
            filtred.push({
              file: data.file,
              title: data.title,
              quality: '',
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
          component.getEpisodes(choice.season+1, function (episodes) {
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

    function Kinobase(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var embed = component.proxy('kinobase') + 'https://kinobase.org/';
      var object = _object;
      var select_title = '';
      var select_id = '';
      var filter_items = {};
      var choice = {
        season: 0,
        voice: -1,
        quality: -1
      };
      var is_playlist = false;
      var translation = '';
      var quality_type = '';

      /**
       * Поиск
       * @param {Object} _object
       * @param {String} kinopoisk_id
       */

      this.search = function (_object, kp_id, sim) {
        var _this = this;

        if (this.wait_similars && sim) return getPage(sim[0].link);
        object = _object;
        select_title = object.movie.title;
        var url = embed + "search?query=" + encodeURIComponent(cleanTitle(select_title));
        network["native"](url, function (str) {
          str = str.replace(/\n/, '');
          var links = object.movie.number_of_seasons ? str.match(/<a href="\/serial\/(.*?)">(.*?)<\/a>/g) : str.match(/<a href="\/film\/(.*?)" class="link"[^>]+>(.*?)<\/a>/g);
          var relise = object.search_date || (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
          var need_year = parseInt((relise + '').slice(0, 4));
          var found_url = '';

          if (links) {
            var cards = [];
            links.filter(function (l) {
              var link = $(l),
                  titl = link.attr('title') || link.text() || '';
              var year = parseInt(titl.split('(').pop().slice(0, -1));
              if (year > need_year - 2 && year < need_year + 2) cards.push({
                year: year,
                title: titl.split(/\(\d{4}\)/)[0].trim(),
                link: link.attr('href')
              });
            });
            var card = cards.find(function (c) {
              return c.year == need_year;
            });
            if (!card) card = cards.find(function (c) {
              return c.title == select_title;
            });
            if (!card && cards.length == 1) card = cards[0];
            if (card) found_url = cards[0].link;
            if (found_url) getPage(found_url);else if (links.length) {
              _this.wait_similars = true;
              var similars = [];
              links.forEach(function (l) {
                var link = $(l),
                    titl = link.attr('title') || link.text();
                similars.push({
                  title: titl,
                  link: link.attr('href'),
                  filmId: 'similars'
                });
              });
              component.similars(similars);
              component.loading(false);
            } else component.emptyForQuery(select_title);
          } else component.emptyForQuery(select_title);
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
          voice: -1
        };
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
        extract = null;
      };

      function cleanTitle(str) {
        return str.replace('.', '').replace(':', '');
      }

      function parsePlaylist(str) {
        var pl = [];

        try {
          if (str.charAt(0) === '[') {
            str.substring(1).split(',[').forEach(function (item) {
              var label_end = item.indexOf(']');

              if (label_end >= 0) {
                var label = item.substring(0, label_end);

                if (item.charAt(label_end + 1) === '{') {
                  item.substring(label_end + 2).split(';{').forEach(function (voice_item) {
                    var voice_end = voice_item.indexOf('}');

                    if (voice_end >= 0) {
                      var voice = voice_item.substring(0, voice_end);
                      pl.push({
                        label: label,
                        voice: voice,
                        links: voice_item.substring(voice_end + 1).split(' or ')
                      });
                    }
                  });
                } else {
                  pl.push({
                    label: label,
                    links: item.substring(label_end + 1).split(' or ')
                  });
                }
              }

              return null;
            });
          }
        } catch (e) {}

        return pl;
      }

      function filter() {
        filter_items = {
          season: [],
          voice: []
        };

        if (is_playlist) {
          extract.forEach(function (item, i) {
            if (item.playlist) {
              filter_items.season.push(item.comment || item.title);

              if (i == choice.season) {
                item.playlist.forEach(function (eps) {
                  if (eps.file) {
                    parsePlaylist(eps.file).forEach(function (el) {
                      if (el.voice && filter_items.voice.indexOf(el.voice) == -1) {
                        filter_items.voice.push(el.voice);
                      }
                    });
                  }
                });
              }
            } else if (item.file) {
              parsePlaylist(item.file).forEach(function (el) {
                if (el.voice && filter_items.voice.indexOf(el.voice) == -1) {
                  filter_items.voice.push(el.voice);
                }
              });
            }
          });
        }

        if (!filter_items.season[choice.season]) choice.season = 0;
        if (!filter_items.voice[choice.voice]) choice.voice = 0;
        component.filter(filter_items, choice);
      }

      function filtred() {
        var filtred = [];

        if (is_playlist) {
          var playlist = extract;
          var season = object.movie.number_of_seasons && 1;

          if (extract[choice.season] && extract[choice.season].playlist) {
            playlist = extract[choice.season].playlist;
            season = parseInt(extract[choice.season].comment || extract[choice.season].title);
            if (isNaN(season)) season = 1;
          }

          playlist.forEach(function (eps, episode) {
            var items = extractItems(eps.file, filter_items.voice[choice.voice]);

            if (items.length) {
              var alt_voice = ( eps.comment ? eps.comment.match(/\d+ серия (.*)$/i) : eps.file.match(/{\s*(.*?)\s*}\s*http/i));
              var info = items[0].voice || alt_voice && alt_voice[1].trim() || translation;
              if (info == (eps.comment || eps.title)) info = '';
              filtred.push({
                file: eps.file,
                title: (eps.comment || eps.title),
                quality: (quality_type && window.innerWidth > 480 ? quality_type + ' - ' : '') + items[0].quality + 'p',
                season: season,
                episode: episode + 1,
                info: info,
                voice: items[0].voice,
                voice_name: info,
                subtitles: parseSubs(eps.subtitle || '')
              });
            }
          });
        } else {
          filtred = extract;
        }

        return filtred;
      }

      function extractItems(str, voice) {
        try {
          var list = parsePlaylist(str);

          if (voice) {
            var tmp = list.filter(function (el) {
              return el.voice == voice;
            });

            if (tmp.length) {
              list = tmp;
            } else {
              list = list.filter(function (el) {
                return typeof el.voice == 'undefined';
              });
            }
          }

          var items = list.map(function (item) {
            var quality = item.label.match(/(\d\d\d+)p/);
            return {
              label: item.label,
              voice: item.voice,
              quality: quality ? parseInt(quality[1]) : NaN,
              file: item.links[0]
            };
          });
          items.sort(function (a, b) {
            if (b.quality > a.quality) return 1;
            if (b.quality < a.quality) return -1;
            if (b.label > a.label) return 1;
            if (b.label < a.label) return -1;
            return 0;
          });
          return items;
        } catch (e) {}

        return [];
      }

      function parseSubs(vod) {
        var subtitles = [];
        vod.split(',').forEach(function (s) {
          var nam = s.match("\\[(.*?)]");

          if (nam) {
            var url = s.replace(/\[.*?\]/, '').split(' or ')[0];

            if (url) {
              subtitles.push({
                label: nam[1],
                url: url
              });
            }
          }
        });
        return subtitles.length ? subtitles : false;
      }
      /**
       * Получить данные о фильме
       * @param {String} str
       */

      function extractData(str, page) {
        var quality_match = page.match(/<li><b>Качество:<\/b>([^<,]+)<\/li>/i);
        var translation_match = page.match(/<li><b>Перевод:<\/b>([^<,]+)<\/li>/i);
        quality_type = quality_match ? quality_match[1].trim() : '';
        translation = translation_match ? translation_match[1].trim() : '';
        var vod = str.split('|');

        if (vod[0] == 'file') {
          var file = vod[1];
          var found = [];
          var subtiles = parseSubs(vod[2]);

          if (file) {
            var voices = {};
            parsePlaylist(file).forEach(function (item) {
              var prev = voices[item.voice || ''];
              var quality_str = item.label.match(/(\d\d\d+)p/);
              var quality = quality_str ? parseInt(quality_str[1]) : NaN;

              if (!prev || quality > prev.quality) {
                voices[item.voice || ''] = {
                  quality: quality
                };
              }
            });

            for (var voice in voices) {
              var el = voices[voice];
              found.push({
                file: file,
                title: voice || translation || object.movie.title,
                quality: (quality_type && window.innerWidth > 480 ? quality_type + ' - ' : '') + el.quality + 'p',
                info: '',
                voice: voice,
                subtitles: subtiles,
                voice_name: voice || translation || ''
              });
            }
          }

          extract = found;
          is_playlist = false;
        } else if (vod[0] == 'pl') {
          extract = Lampa.Arrays.decodeJson(vod[1], []);
          is_playlist = true;
        } else component.emptyForQuery(select_title);
      }

      function getPage(url) {
        network.clear();
        network.timeout(1000 * 10);
        network["native"](embed + url, function (str) {
          str = str.replace(/\n/g, '');
          var MOVIE_ID = str.match('var MOVIE_ID = ([^;]+);');
          var IDENTIFIER = str.match('var IDENTIFIER = "([^"]+)"');
          var PLAYER_CUID = str.match('var PLAYER_CUID = "([^"]+)"');

          if (MOVIE_ID && IDENTIFIER && PLAYER_CUID) {
            select_id = MOVIE_ID[1];
            var identifier = IDENTIFIER[1];
            var player_cuid = PLAYER_CUID[1];
            var data_url = "user_data";
            data_url = Lampa.Utils.addUrlComponent(data_url, "page=movie");
            data_url = Lampa.Utils.addUrlComponent(data_url, "movie_id=" + select_id);
            data_url = Lampa.Utils.addUrlComponent(data_url, "cuid=" + player_cuid);
            data_url = Lampa.Utils.addUrlComponent(data_url, "device=DESKTOP");
            data_url = Lampa.Utils.addUrlComponent(data_url, "_=" + Date.now());
            network.clear();
            network.timeout(1000 * 10);
            network["native"](embed + data_url, function (user_data) {
              if (typeof user_data.vod_hash == "string") {
                var file_url = "vod/" + select_id;
                file_url = Lampa.Utils.addUrlComponent(file_url, "identifier=" + identifier);
                file_url = Lampa.Utils.addUrlComponent(file_url, "player_type=new");
                file_url = Lampa.Utils.addUrlComponent(file_url, "file_type=mp4");
                file_url = Lampa.Utils.addUrlComponent(file_url, "st=" + user_data.vod_hash);
                file_url = Lampa.Utils.addUrlComponent(file_url, "e=" + user_data.vod_time);
                file_url = Lampa.Utils.addUrlComponent(file_url, "_=" + Date.now());
                network.clear();
                network.timeout(1000 * 10);
                network["native"](embed + file_url, function (files) {
                  component.loading(false);
                  extractData(files, str);
                  filter();
                  append(filtred());
                }, function (a, c) {
                  component.doesNotAnswer();
                }, false, {
                  dataType: 'text'
                });
              } else component.doesNotAnswer(L);
            }, function (a, c) {
              component.doesNotAnswer();
            });
          } else component.doesNotAnswer();
        }, function (a, c) {
          component.doesNotAnswer();
        }, false, {
          dataType: 'text'
        });
      }

      function getFile(element) {
        var quality = {},
            first = '';

        var items = extractItems(element.file, element.voice);
        if (items && items.length) {
          first = items[0].file;
          quality = {};
          items.forEach(function (item) {
            quality[item.label] = item.file;
          });
        }

        var preferably = Lampa.Storage.get('video_quality_default', '1080');
        if (quality[preferably]) first = quality[preferably];

        element.stream = first;
        element.qualitys = quality;
        return {
          file: first,
          quality: quality
        };
      }
      /**
       * Показать файлы
       */

      function append(items) {
        if (object.seasons == undefined) object.seasons = {};
        if (object.movie.number_of_seasons && object.seasons[choice.season+1] == undefined) {
          object.seasons[choice.season+1] = [];
          component.getEpisodes(choice.season+1, function (episodes) {
            object.seasons[choice.season+1] = episodes;
            append(items);
            setTimeout(component.closeFilter, 25);
          })
          return;
        }
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        items.forEach(function (element, index) {
          if (typeof element.episode == 'undefined') element.episode = index + 1;
          if (element.season) element.title = 'S' + element.season + '-E' + element.episode + ' / ' + element.title;
          if (element.voice) element.title = element.voice;
          if (element.season != undefined && object.seasons[choice.season+1] != undefined && object.seasons[choice.season+1][element.episode-1] != undefined)
              element.title = 'S' + element.season + '-E' + element.episode + ' / ' + object.seasons[choice.season+1][element.episode-1].name;
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('online', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, element.title, 'kinobase'].join('') : object.movie.original_title + element.quality + 'kinobase');
          element.timeline = view;
          item.append(Lampa.Timeline.render(view));

          if (Lampa.Timeline.details) {
            item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
          }

          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            getFile(element);

            if (element.stream) {
              var playlist = [];
              var first = {
                url: element.stream,
                timeline: view,
                title: element.season ? element.title : element.voice ? object.movie.title + ' / ' + element.title : element.title,
                subtitles: element.subtitles,
                quality: element.qualitys
              };

              if (element.season) {
                items.forEach(function (elem) {
                  getFile(elem);
                  playlist.push({
                    title: elem.title,
                    url: elem.stream,
                    timeline: elem.timeline,
                    subtitles: elem.subtitles,
                    quality: elem.qualitys
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
              call(getFile(element));
            }
          });
        });
        component.start(true);
      }

    }

    function IFrame(component, _object) {
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
        var translator = {};
        var url = 'https://iframe.video/api/v2/search?kp=';
        // var url = 'https://videoframe.space/frameindex.php?kp_id=';
        var backend = backendhost+'/iframeurl?v=333&id_kp=';
        var hlsproxy = { use: true, link: 'http://back.freebie.tom.ru:8888/', extension: '.m3u8' };
      /**
       * Поиск
       * @param {Object} _object
       */


      this.search = function (_object, kinopoisk_id) {
        object = _object;
        //console.log('kinopoisk_id', kinopoisk_id);

        if (!window.whois) {
            component.whois(kinopoisk_id); component.loading(false); return;
        } else if (window.whois.ip.startsWith('192.168.1')) hlsproxy.use = false;

        if (isNaN(kinopoisk_id)) { component.empty("kinopoisk_id is null"); return; } else { if (object.kinopoisk_id == undefined) object.kinopoisk_id = kinopoisk_id }
        if (backend.substr(-6) === "id_kp=") backend += kinopoisk_id;

        network.clear(); network.timeout(20000);
        network["native"](url + kinopoisk_id, function (found) {
            //console.log('found',found);
            if (found && found.results != null) {
                (typeof(found) === "string" ? JSON.parse(found) : found).results.forEach( function (result, key) {
                    search_ext(kinopoisk_id, result, key);
                })
            } else {
                component.loading(false);
                if (!Object.keys(results).length) component.empty(found.error ? found.error : 'По запросу (' + 'kinopoisk_id='+kinopoisk_id + ') нет результатов');
            }
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
        });
      };

      function search_ext(kinopoisk_id, result, key) {
        result.link = result.path;

        result.serial = (result.type == 'serial' ? 1 : 0);
        result.max_qual = '2160';
        result.quality = '360~1080';

        network.clear(); network.timeout(10000);
        network["native"](result.path, function (found) {
        //console.log('found',found);
            if (found) {

                var obj = { translation: 0 }
                obj.id = Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000;

                obj.type = found.match(/data-type='([^']+)'/); if (obj.type) obj.type = obj.type[1];
                obj.token = found.match(/data-token='([^']+)'/); if (obj.token) obj.token = obj.token[1];
                obj.season = found.match(/var\s*season\s*=\s*'([^']+)'/); if (obj.season) obj.season = obj.season[1]; else obj.season = '';
                obj.episode = found.match(/var\s*episode\s*=\s*'([^']+)'/); if (obj.episode) obj.episode = obj.episode[1]; else obj.episode = '';

                //obj.data = `token=${obj.token}&type=${obj.type}&season=${obj.season}&episode=${obj.episode}&mobile=false&id=${obj.id}&qt=720`;
                //console.log('data', obj);

                if (result.serial == 1) {
                    result.playlists = [];
                    result.last_season = result.seasons_count;

                    var translator = found.match(/<a\s+href='([^']+)'\s+class='[^']+'><span title='([^']+)'>.*<\/span><\/a>/g);
                    if (translator) {
                        translator.forEach( function (translation, keyt) {
                            //console.log('keyt', keyt, 'translation', translation);
                            result.playlists = [];

                            var match = translation.match(/<a\s+href='([^']+)'\s+class='[^']+'><span title='([^']+)'>.*<\/span><\/a>/);
                            result.translation_id = keyt;
                            result.href = match[1];
                            result.translation = match[2];

                            var id = Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000;
                            match = result.href.match(/\/(movie|serial)\/(.*)\/iframe[?&]track_hash=/);
                            result.token = match[2];
                            if (obj.token == result.token) obj.translation = keyt;

                            result.link = result.path.split('/serial').shift() + result.href;

                            translator[result.translation] = result.translation_id;
                            results[result.translation_id] = Object.assign({}, result);
                        })
                    } else {
                        result.translation_id = 0;
                        result.translation = 'Оригинал';
                        results[result.translation_id] = Object.assign({}, result);
                    }

                    var seasons = found.match(/<a\s*href='([^']+)'\s*class='[^']+'>\S+\s*(\d+)<\/a>/g);
                    if (seasons)
                        seasons.forEach( function (season, keys) {
                            //console.log('keys', keys, 'season', season);
                            var match = season.match(/<a\s*href='([^']+)'\s*class='[^']+'>\S+\s*(\d+)<\/a>/);
                            results[ obj.translation ].playlists[ match[2] ] = { link: result.path.split('/serial').shift() + match[1] };
                        })

                    var episodes = found.match(/<a\s*href='([^']+)'\s*class='[^']+'>(\d+)\s*\S+<\/a>/g);
                    if (episodes) {
                        results[ obj.translation ].playlists[ obj.season ] = [];
                        episodes.forEach( function (episode, keye) {
                            //console.log('keye', keye, 'episode', episode);
                            var match = episode.match(/<a\s*href='([^']+)'\s*class='[^']+'>(\d+)\s*\S+<\/a>/);

                            var token = match[1].match(/\/(movie|serial)\/(.*)\/iframe\?episode=\d+&track_hash=/);
                            var id = Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000;

                            results[ obj.translation ].playlists[ obj.season ][ match[2] ] = {}
                            results[ obj.translation ].playlists[ obj.season ][ match[2] ][ result.max_qual ]  =
                                'token='+ token[2] +'&type='+ result.type +'&season='+ obj.season +'&episode='+ match[2] +'&mobile=false&id='+ id +'&qt=720';
                        })
                    }

                } else {

                    var translator = found.match(/<a\s+href='([^']+)'\s+class='[^']+'><span title='([^']+)'>.*<\/span><\/a>/g);
                    if (translator)
                        translator.forEach( function (translation, keyt) {
                            //console.log('keyt', keyt, 'translation', translation);

                            var match = translation.match(/<a\s+href='([^']+)'\s+class='[^']+'><span title='([^']+)'>.*<\/span><\/a>/);
                            result.translation_id = keyt;
                            result.href = match[1];
                            result.translation = match[2];

                            match = result.href.match(/\/(movie|serial)\/(.*)\/iframe[?&]track_hash=/);
                            result.token = match[2];

                            var id = Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000;
                            result.link = 'token='+ result.token +'&type='+ result.type +'&season='+ '' +'&episode='+ '' +'&mobile=false&id='+ id +'&qt=720';

                            result.playlists = {  };
                            result.playlists[ result.max_qual ] = result.link;

                            translator[result.translation] = result.translation_id;
                            results[result.translation_id] = Object.assign({}, result);
                        })


                }
                //console.log('results', results);
                success(results);
            }
            component.loading(false);
            if (!Object.keys(results).length) component.empty(found.error ? found.error : 'По запросу (' + 'kinopoisk_id='+kinopoisk_id + ') нет результатов');
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
        // уже присвоен results = json;
        extractData(json);
        filter();
        append(filtred());
      }
      /**
       * Получить потоки
       * @param {String} str
       * @param {Int} max_quality
       * @returns string
       */


      function extractData(json) {
        extract = [];
        results.forEach( function (translation, keyt) {
        //console.log('translation', translation);
        if (translation.serial == 1) {
            extract[keyt] = { json : [], "file": translation.link, 'serial': translation.serial }

            for( var keys in translation.playlists) {
                var seasons = translation.playlists[keys];
                //console.log('keys', keys, 'seasons', seasons);
                var folder = [];
                for( var keye in seasons) {
                    var episode = seasons[keye];
                    //console.log('keye', keye, 'episode', episode);
                    if (episode.link) continue;

                    var qualities = Object.keys(episode);
                    //if (qualities) qualities = qualities.filter( function (elem) { return parseInt(elem) <= parseInt(????) && parseInt(elem) !== 0 });
                    var qualitie = Math.max.apply(null, qualities);
                    var link = episode[qualitie];

                    folder[keye] = {
                        "id": keys + '_' + keye,
                        "comment": keye + ' серия<br><i>' + qualitie + '</i>',
                        "file": link,
                        "episode": keye,
                        "season": keys,
                        "quality": qualitie,
                        "qualities": qualities,
                        "translation": keyt,
                    };
                }
                extract[keyt].json[keys] = { "id": keys, "comment": keys + " сезон", "folder": folder, "translation": keyt };

            }
        } else if (translation.serial == 0) {
            for( var keym in translation.playlists) {
                var movie =  translation.playlists[keym];

                var qualities = Object.keys(translation.playlists);
                if (qualities) qualities = qualities.filter( function (elem) { return parseInt(elem) <= parseInt(keym) && parseInt(elem) !== 0 });
                var qualitie = Math.max.apply(null, qualities);
                var link = movie;

                extract[keyt] = { json : {}, "file": link, translation : translation.translation, "quality": qualitie, "qualities": qualities, 'serial': translation.serial };
            }
        }
        })
        //console.log('extract', extract);
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
            max_quality = extract[element.translation].quality;
        }
        else {
            file = extract[element.translation].file;
            qualities = extract[element.translation].qualities;
            max_quality = extract[element.translation].quality;
            // var filter_data = Lampa.Storage.get('online_filter', '{}');
            // select_quality = parseInt(filter_items.quality[filter_data.quality]);
        }
        //console.log('file', file, 'qualities', qualities);

        var file_filtred = file;
        if (file) {
          quality = {};
          for (var n in qualities) {
            if (parseInt(qualities[n]) <= parseInt(select_quality)  && qualities.length > 1) {
                quality[qualities[n]+'p'] = file.replace('/hls.m3u8','/'+ qualities[n] +'.mp4:hls:manifest.m3u8');
              } else {
                quality[qualities[n]+'p'] = file;
              }
            if (hlsproxy.use) quality[qualities[n]+'p'] = hlsproxy.link + '?link=' + quality[qualities[n]+'p'];
            file_filtred = quality[qualities[n]+'p'];
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

        results.forEach( function (translation, keyt) {
            if (translation.serial == 0) {
                // var qualities = ['480','720','1080','2160'];
                // if (translation.max_qual) {
                //     for( var key in qualities)
                //         if (parseInt(translation.max_qual)  >= parseInt(qualities[key]))
                //             if (filter_items.quality.indexOf(qualities[key]) == -1) filter_items.quality.unshift(qualities[key]);
                // }
                // if (filter_items.quality.length == 0) filter_items.quality.push('720');
            } else if (translation.serial == 1) {

                var s = translation.last_season;
                while (s--) {
                    if (filter_items.season.indexOf(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s)) == -1)
                        filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (translation.last_season - s));
                }

                //if (translation.playlists[choice.season + 1]) {
                    if (filter_items.voice.indexOf(translation.translation) == -1) {
                        filter_items.voice[keyt] = translation.translation;
                        filter_items.voice_info[keyt] = { id: keyt };
                    }
                //}

            }

        })
        component.filter(filter_items, choice);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        var filter = { 'voice': (filter_items.voice_info.length === 0 ? 0 : filter_items.voice_info[filter_data.voice].id), 'season': filter_data.season + 1, 'quality': filter_items.quality[filter_data.quality] }
        //console.log('filter', filter);
        if (extract[filter.voice].serial == 1) {

            if (results[ filter.voice ].playlists.length === 0 || results[ filter.voice ].playlists[ filter.season ].link) {
                getEmbed( (results[ filter.voice ].playlists.length === 0 ? results[ filter.voice ].link : results[ filter.voice ].playlists[ filter.season ].link), filter);
                return filtred;
            }

            if (extract[filter.voice].json[filter.season])
                extract[filter.voice].json[filter.season].folder.forEach( function (media) {
                    filtred.push({
                      episode: parseInt(media.episode),
                      season: media.season,
                      title: media.episode + (media.title ? ' - ' + media.title : ''),
                      //quality: media.quality + 'p',
                      quality: (media.qualities.length > 1 ? media.quality+'p' : results[media.translation].quality ),
                      translation: media.translation
                    });
                })
        } else {
            for( var keyt in extract ) {
                var movie = extract[keyt];

                var select_quality = parseInt(filter.quality);
                var qualities = movie.qualities.filter( function (elem) { return parseInt(elem) <= select_quality });
                var qualitie = Math.max.apply(null, qualities);
                if (qualitie) {
                    filtred.push({
                        title: movie.translation,
                        //quality: '~' + movie.quality + 'p / ' + qualitie + 'p',
                        quality: (movie.qualities.length > 1 ? movie.quality+'p' : results[keyt].quality ),
                        translation: keyt,
                    });
                }
            }
        }
        //console.log('filtred', filtred);
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
          component.getEpisodes(choice.season+1, function (episodes) {
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

            if (element.loading) return;
            element.loading = true;
            getStream(element, function (extra) {
              extra = getFile(extra, extra.quality);
              var first = {
                url: extra.file,
                timeline: view,
                quality: extra.quality,
                title: element.title
              };
              Lampa.Player.play(first);

              if (element.season && Lampa.Platform.version) {
                var playlist = [];
                items.forEach(function (elem) {
                  var cell = {
                    url: function url(call) {
                      getStream(elem, function (extra) {
                        extra = getFile(extra, extra.quality);
                        cell.url = extra.file;
                        cell.quality = extra.quality;
                        call();
                      }, function () {
                        cell.url = '';
                        call();
                      });
                    },
                    timeline: elem.timeline,
                    title: elem.title
                  };
                  if (elem == element) cell.url = extra.file;
                  playlist.push(cell);
                });
                Lampa.Player.playlist(playlist);
              } else {
                Lampa.Player.playlist([first]);
              }

              element.loading = false;
              if (element.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(element.subtitles);

              if (viewed.indexOf(hash_file) == -1) {
                viewed.push(hash_file);
                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                Lampa.Storage.set('online_view', viewed);
              }
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
            file: function file(call) {
              getStream(element, function (extra) {
                extra = getFile(extra, extra.quality);
                call({
                  file: extra.file,
                  quality: extra.quality,
                });
              });
            }
          });
        });
        component.start(true);
      }


      function getEmbed(url, filter) {
        var result = results[ filter.voice ];
        network.clear();
        network.timeout(10000);
        network.silent(url, function (found) {
            //console.log('found', found);

            var obj = { translation: filter.voice }
            obj.id = Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000;

            obj.type = found.match(/data-type='([^']+)'/); if (obj.type) obj.type = obj.type[1];
            obj.token = found.match(/data-token='([^']+)'/); if (obj.token) obj.token = obj.token[1];
            obj.season = found.match(/var\s*season\s*=\s*'([^']+)'/); if (obj.season) obj.season = obj.season[1]; else obj.season = '';
            obj.episode = found.match(/var\s*episode\s*=\s*'([^']+)'/); if (obj.episode) obj.episode = obj.episode[1]; else episode = '';

            var seasons = found.match(/<a\s*href='([^']+)'\s*class='[^']+'>\S+\s*(\d+)<\/a>/g);
            if (seasons && result.playlists.length == 0)
                seasons.forEach( function (season, keys) {
                    //console.log('keys', keys, 'season', season);
                    var match = season.match(/<a\s*href='([^']+)'\s*class='[^']+'>\S+\s*(\d+)<\/a>/);
                    result.playlists[ match[2] ] = { link: result.path.split('/serial').shift() + match[1] };
                })

            var episodes = found.match(/<a\s*href='([^']+)'\s*class='[^']+'>(\d+)\s*\S+<\/a>/g);
            if (episodes) {
                result.playlists[ obj.season ] = [];
                episodes.forEach( function (episode, keye) {
                    //console.log('keye', keye, 'episode', episode);
                    var match = episode.match(/<a\s*href='([^']+)'\s*class='[^']+'>(\d+)\s*\S+<\/a>/);

                    var token = match[1].match(/\/(movie|serial)\/(.*)\/iframe\?episode=\d+&track_hash=/);
                    var id = Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000;

                    result.playlists[ obj.season ][ match[2] ] = {}
                    result.playlists[ obj.season ][ match[2] ][ result.max_qual ]  =
                        'token='+ token[2] +'&type='+ result.type +'&season='+ obj.season +'&episode='+ match[2] +'&mobile=false&id='+ id +'&qt=720';
                })
            }
            //console.log('results', results);

            extractData(results);
            append(filtred());

        }, function (a, c) {
            var str = network.errorDecode(a, c);
            if (str.match(/<div class="title">.*<\/div>/)) str = str.match(/<div class="title">(.*)<\/div>/)[1];
            component.empty(str);
        }, false, {
            dataType: 'text'
        });
      }

      function getStream(element, call, error) {
        if (element.season)
            element.link = extract[element.translation].json[element.season].folder[element.episode].file
        else element.link = extract[element.translation].file

        //console.log('element', element);
        if (element.link.substr(-5) === ".m3u8") return call(element);

        network.clear();
        network.timeout(10000);
        network.silent( backend + '&' + element.link , function (str) {
            //console.log('str', str);
            if (str && typeof(str) === "string") str = JSON.parse(str);
            if (str.src) {

                var result = results[element.translation];
                if (result.serial == 1) {
                    result.playlists[ element.season ][ element.episode ][ result.max_qual ] = str.src;
                    //result.playlists[ element.season ][ element.episode ] = {};
                    element.link = str.src;
                }
                else {
                    result.playlists[ result.max_qual ] = str.src;
                    //result.playlists = {};
                    element.link = str.src;
                }

            }
            extractData(results);

            if (results) {
                network.clear();
                network.timeout(10000);
                network.silent( backend + '&link=' + element.link, function (plist) {
                    //console.log('plist', plist);
                    if (results[element.translation].serial == 1) results[element.translation].playlists[ element.season ][ element.episode ] = {}; else results[element.translation].playlists = {};
                    ['2160', '1080', '720', '480', '360'].forEach(function (elem) {
                        if (plist.replace(/\n/,'').indexOf('/'+elem+'.mp4') > 0)
                            if (results[element.translation].serial == 1)
                                results[element.translation].playlists[ element.season ][ element.episode ][ elem ] = element.link;
                            else
                                results[element.translation].playlists[ elem ] = element.link;
                    })
                    //console.log('results', results);

                    extractData(results);
                    append(filtred());
                    call(element);

                }, function (a, c) {
                    return error(network.errorDecode(a, c));
                },
                    false, { dataType: 'text' }
                );

            }

          }, function (a, c) {
              return error(network.errorDecode(a, c));
          },
              false, { dataType: 'text' }
          );
      }

    };

    function component(object) {
      var network = new Lampa.Reguest();
      var scroll = new Lampa.Scroll({
        mask: true,
        over: true
      });
      var files = new Lampa.Files(object);
      var filter = new Lampa.Filter(object);
      var balanser = Lampa.Storage.get('online_balanser', 'Filmix');
      var last_bls = Lampa.Storage.cache('online_last_balanser', 200, {});

      if (last_bls[object.movie.id]) {
        balanser = last_bls[object.movie.id];
      }

      this.proxy = function (name) {
        var prox = Lampa.Storage.get('online_proxy_all');
        var need = Lampa.Storage.get('online_proxy_' + name);
        if (name === 'kinobase') need = 'http://back.freebie.tom.ru/proxy/';
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
        Bazon: new Bazon(this, object),
        Kodik: new Kodik(this, object),
        CDNMovies: new CDNMovies(this, object),
        Kinobase: new Kinobase(this, object),
        // IFrame: new IFrame(this, object),
      };
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
      var filter_sources = ['Filmix', 'HDRezka', 'HDVB', 'CDNMovies', 'Alloha', 'VideoDB', /*'Bazon', 'ZetFlix', 'Kinobase',*/ 'Kodik', /*'IFrame',*/ ];

      if (filter_sources.indexOf(balanser) == -1) {
        balanser = 'Filmix';
        Lampa.Storage.set('online_balanser', 'Filmix');
      }

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
          }

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
          if ((object.movie.source == 'tmdb' || object.movie.source == 'cub') &&  balanser != 'videocdn'){
            network["native"](backendhost+'/lampa/kinopoiskId?v=333&tmdb_id=' + object.movie.id +'&serial=' + (object.movie.number_of_seasons ? 1 : 0) + '&title=' + encodeURIComponent(object.search), function (kinopoisk_id) {
                // console.log('object.movie.id', object.movie.id, 'kinopoisk_id', kinopoisk_id);
                if (kinopoisk_id) {
                    object.kinopoisk_id = kinopoisk_id;
                    sources[balanser].search(object, kinopoisk_id);
                } else if (balanser == 'HDRezka' || balanser == 'ZetFlix') {
                    sources[balanser].search(object, 0);
                }
                else pillow();
              }, pillow.bind(_this2), false, { dataType: 'text' }
            );
          } else {
            // ???
          }
        };

        network.clear();
        network.timeout(1000 * 15);

        if (object.search_new) { object.search_new = false; object.filmix_id = undefined; object.kinopoisk_id = undefined; }
        if (object.movie.source != 'tmdb' && object.movie && object.movie.kinopoisk_id) object.kinopoisk_id = object.movie.kinopoisk_id;

        if (balanser == 'Filmix') {
            _this2.extendChoice();
            sources[balanser].search(object, (object.filmix_id ? object.filmix_id : object.search));
        } else if (balanser == 'Kinobase') {
            _this2.extendChoice();
            sources[balanser].search(object, object.search);
        } else if ((object.movie.source == 'tmdb' || object.movie.source == 'cub') && balanser != 'videocdn') {
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
            if (Navigator.canmove('right')) Navigator.move('right');else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
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
        sources.Filmix.destroy();
        sources.HDRezka.destroy();
        sources.HDVB.destroy();
        sources.Alloha.destroy();
        sources.VideoDB.destroy();
        sources.ZetFlix.destroy();
        sources.Bazon.destroy();
        sources.Kodik.destroy();
        sources.CDNMovies.destroy();
        sources.Kinobase.destroy();
        // sources.IFrame.destroy();
        window.removeEventListener('resize', minus);
      };

      this.getEpisodes = function (season, call) {
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

      this.whois = function (param) {
        window.whois = { ip : '127.0.0.1' };
        network["native"](backendhost+'/lampa/whois?v=333', function (json) {
          window.whois.ip = json.ip;
          sources[balanser].search(object, param);
      }, function (a, c) {
          sources[balanser].search(object, param);
        });
      };

    }

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
        en: 'Balancer'
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
        en: 'Will be used for all balancers'
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
    }); ///////ONLINE/////////

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
      if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="filmix"]').length) {
        var field = $("<div class=\"settings-folder selector\" data-component=\"filmix\">\n                <div class=\"settings-folder__icon\">\n                    <svg height=\"57\" viewBox=\"0 0 58 57\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M20 20.3735V45H26.8281V34.1262H36.724V26.9806H26.8281V24.3916C26.8281 21.5955 28.9062 19.835 31.1823 19.835H39V13H26.8281C23.6615 13 20 15.4854 20 20.3735Z\" fill=\"white\"/>\n                    <rect x=\"2\" y=\"2\" width=\"54\" height=\"53\" rx=\"5\" stroke=\"white\" stroke-width=\"4\"/>\n                    </svg>\n                </div>\n                <div class=\"settings-folder__name\">Filmix</div>\n            </div>");
        Lampa.Settings.main().render().find('[data-component="more"]').after(field);
        Lampa.Settings.main().update();
      }
    }

    if (window.appready) addSettingsFilmix();else {
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

    // Lampa.Storage.set('is_true_mobile', 'false');

})();
