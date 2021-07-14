$(document).ready(function(){
    function format_progress_bar(){
        for (var i of document.querySelectorAll('.step-listing-col')){
            if (!$(i).data('circle')){
                $(`#step-progress-col${$(i).data('sid')} > .progress-bar`).css('height', $(i).css('height'));
            }
            else{
                var nh = (parseInt($(i).css('height').match('\\d+')) - parseInt($(`#step-progress-col${$(i).data('sid')} > .process-circle`).css('height').match('\\d+')))/2;
                $(`<div class='progress-bar' style='height:${nh}px'></div>`).insertBefore(`#step-progress-col${$(i).data('sid')} > .process-circle`)
                $(`<div class='progress-bar' style='height:${nh}px'></div>`).insertAfter(`#step-progress-col${$(i).data('sid')} > .process-circle`)
                
            }
        }
    }
    function display_content_cards(){
        for (var i of document.querySelectorAll('.content-card')){
            var _h = parseInt($(i).css('height').match('\\d+'));
            var _desc_path = `#content-card${$(i).data('card')} > .content-description`
            if (_h < 170){
                $(`<div style='height:${170-_h}px'></div>`).insertAfter(_desc_path);
            }
            else if (_h > 170){
                var cid = $(i).data('card');
                var _desc = $(_desc_path).text();
                var last_d = null;
                for (var i = 0; i < _desc.length; i++){
                    var t_ld = _desc.substring(0, i)+'...';
                    $(_desc_path).html(`${t_ld}(<span class='see-more-desc'>see more</span>)`);
                    if (parseInt($(`#content-card${cid}`).css('height').match('\\d+')) > 170){
                        break;
                    }
                    last_d = t_ld;
                }

            }
        }
    }
    setTimeout(function(){
        format_progress_bar();
        display_content_cards();
    }, 100)
    $('body').on('click', '.step-progress-button', function(){
        window.location.replace($(this).data('tolink'))
    });
});