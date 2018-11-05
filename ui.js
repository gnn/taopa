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
});

