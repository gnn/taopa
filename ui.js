'use strict';

function fit_columns() {
  function columns(accumulator, x) {
    var columnpattern = /column-(.*)/;
    var classes = $(x).attr('class').split(' ');
    for (var c of classes) {
      if (columnpattern.test(c)) {
        var column = c.match(columnpattern)[1];
        (accumulator[column] = accumulator[column] || []).push(x);
      }
    };
    return accumulator;
  };
  $('.columns').map(
      // Reduces each columned div to an object containing mappings from
      // column name to column elements.
      function (i, e) {
        return $(e).find("[class^=column-]").toArray().reduce(columns, {});
      }).each(
      // Iterates over each column->elements mapping and fits the width of
      // each element to the maximum witdh.
      function (i, e) {
        for (var column in e) {
          var mw = Math.max.apply(
              null,
              e[column].map(function (o) { return $(o).width(); }));
          e[column].forEach(function (o) { $(o).width(mw); });
        };
      }
  );
};

$(document).ready(function () {
  var selected = "random";
  $('#palette').change(function (e) {
    selected = $('#palette')[0].value;
  });
  $('#start').click(function () { start(selected); });
  $('#delay').change(function () { delay = +$(this).val(); });
  $('#stride').change(function () { animate.stride = +$(this).val(); });
  for (var palette of palettes.keys()){
    $('#palette').append(
        '<option ' +
        (selected === palette ? "selected " : "") +
        '"value="' + palette +'">' +
        palette +
        '</option>');
  };
  fit_columns();
});

