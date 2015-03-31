setInterval(slide, 2000);
function slide() {
    $(".image ").each(function () {
        if ($( this ).css("display") !== "none") {
            $(this).animate({opacity: 'toggle'});
            var next = parseInt($(this).attr('value'),10) < 4 ? parseInt($(this).attr('value'),10) + 1 : 1;
            console.log(next);
            $('#img'+next).animate({opacity: 'toggle'});
            return false;
        }
    });
    // 
    // console.log('hi');
}