/* globals $ */
$(function() {
  $('form').on('submit', function(evt) {
    var formDict = $('form')
      // get form data in an Array of Objects with name and value keys
      .serializeArray()
      // map it to small Objects with one key and its value
      .map(function(elem) {
        var a = {};
        a[elem.name] = elem.value;
        return a;
      })
      // reduce it to a single object holding all keys and values
      .reduce(function(last, current) {
        return Object.assign(last, current);
      }, {});
    evt.preventDefault();

    $('button[type=submit]').attr('disabled', 'disabled').find('i')
      .removeClass('fa-camera').addClass('fa-spinner fa-spin');
    $('input[type=text]').attr('disabled', 'disabled');
    $('figure').hide();
    $.ajax({
      url: '/snap',
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(formDict),
      success: function(data) {
        $('button[type=submit]').removeAttr('disabled').find('i')
          .removeClass('fa-spinner fa-spin').addClass('fa-camera');
        $('input[type=text]').removeAttr('disabled');
        $('figure img').attr('src', data.laptop);
        $('figure a').attr('href', data.snap);
        $('figure').show();
      },
      error: function(err) {
        console.error(err);
      }
    });
    return false;
  });
});