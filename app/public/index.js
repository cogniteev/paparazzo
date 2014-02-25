$(function(){
  $('form').on('submit', function(evt){
    evt.preventDefault();
    $('button[type=submit]').attr('disabled', 'disabled').find('i')
    .removeClass('fa-camera').addClass('fa-spinner fa-spin');
    $('input[type=text]').attr('disabled', 'disabled');
    $('figure').hide();
    $.ajax({
      url: '/snap',
      method: 'POST',
      data: {
        targetUrl: $.trim($('input').val())
      },
      success: function(data){
        $('button[type=submit]').removeAttr('disabled').find('i')
        .removeClass('fa-spinner fa-spin').addClass('fa-camera');
        $('input[type=text]').removeAttr('disabled');
        $('figure img').attr('src', data.laptop);
        $('figure a').attr('href', data.snap);
        $('figure').show();
      }, error: function(err){
        console.log(err);
      }
    });
    return false;
  });
});
