$(document).ready(function(){
    //<span class="see-more-desc">see more</span>
    function adjust_content_card_heights(){
        for (var i of document.querySelectorAll('.content-card')){
            var c_path = `#content-description${$(i).data('card')}`;
            if (parseInt($(c_path).css('height').match('\\d+')) > 150){
                var c = null;
                var content = $(c_path).text();
                for (var j = 0; j < content.length; j++){
                    $(c_path).html(`${content.substring(0, j)}...<span class="see-more-desc">see more</span>`)
                    if (parseInt($(c_path).css('height').match('\\d+')) > 150){
                        break;
                    }
                    c = j;
                }
                $(c_path).html(`${content.substring(0, c)}...<span class="see-more-desc">see more</span>`)
            }
        }
    }
    setTimeout(function(){
        adjust_content_card_heights();
    }, 300);
});