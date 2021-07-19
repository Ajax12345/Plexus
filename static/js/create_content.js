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
    $('.content-title-field').focus();
    setTimeout(function(){
        format_progress_bar();
    }, 100)
    //$('.attach-link').addClass('attach-link-focus')
    //$('.attach-link').removeClass('attach-link-focus')
    $('body').on('focus', '.content-input-area', function(){
        if ($('.content-input-placeholder').text().length > 0){
           $('.content-input-placeholder').html('');
        }
    });
    $('body').on('blur', '.content-input-area', function(){
        if ($('.content-input-area').text().replace(/^\s+|\s+$/, '').length === 0){
            $('.content-input-placeholder').text('Describe the outlay of this content...');
        }
    });
    var selected_link_piece = null;
    var mouse_down = false;
    var mouse_move = false;
    $('body').on('mousedown', '.content-textarea', function(){
        mouse_down = true;
    });
    $('body').on('mousemove', '.content-textarea', function(){
        if (mouse_down){
            mouse_move = true;
        }
    });
    $('body').on('mouseup', '.content-textarea', function(){
        if (mouse_down && mouse_move){
            if (window.getSelection) {  // all browsers, except IE before version 9
                var range = window.getSelection ();
                var r = range.toString();
                if (r.replace(/^\s+|\s+$/, '').length > 0){
                    selected_link_piece = {text:r};
                    $('.attach-link').addClass('attach-link-focus')
                }
            }
            mouse_down = false; 
            mouse_move = false;
        }
    });
    $('body').on('click', '.attach-link-focus', function(){
        $(this).removeClass('attach-link-focus');
        $('.modal').css('display', 'block');
        $('.text-to-display-field').val(selected_link_piece.text);
        $('.link-to-display-field').val('');
        $('.link-to-display-field').focus();
    });
    $('body').on('click', '.cancel-link-to', function(){
        $('.modal').css('display', 'none');
    });
    $('body').on('click', '.add-link-to', function(){
        $('.modal').css('display', 'none');
    });
});