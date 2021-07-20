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
    var content_block = {text:'', links:[]};
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
    $('body').on('input', '.content-input-area', function(){
        content_block.text = $(this).text();
    });
    function deep_count(node){
        if (node.nodeType === 3){
            return node.length;
        }
        var _c = 0;
        for (var i of node.childNodes){
            _c += deep_count(i);
        }
        return _c;
    }
    function get_full_text_offset(node){
        var c_node = node.previousSibling;
        var c = 0;
        while (c_node != null){
            c += deep_count(c_node);
            c_node = c_node.previousSibling;
        }
        return c;
    }
    $('body').on('mouseup', '.content-textarea', function(){
        if (mouse_down && mouse_move){
            if (window.getSelection) {
                var range = window.getSelection();
                var r = range.toString();
                if (r.replace(/^\s+|\s+$/, '').length > 0){
                    var new_r = range.getRangeAt(0)
                    var offset_count = get_full_text_offset(new_r.startContainer)
                    console.log('all offset stuff here')
                    console.log(offset_count)
                    selected_link_piece = {text:r, start:offset_count+new_r.startOffset, end:offset_count+new_r.endOffset, link:null};
                    console.log(selected_link_piece)
                    
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
        selected_link_piece = null;
        $('.modal').css('display', 'none');
    });
    $('body').on('click', '.add-link-to', function(){
        var t_text = $('.text-to-display-field').val();
        var t_link = $('.link-to-display-field').val();
        if (t_text.length === 0){
            $("#text-to-display-error").html('Cannot be left empty');
        }
        if (t_link.length === 0){
            $("#link-to-display-error").html('Cannot be left empty');
        }
        if (t_text.length && t_link.length){
            content_block.links.push({...selected_link_piece, text:t_text, link:t_link});
            content_block.links.sort(function(a, b){
                if (a.end < b.start){
                    return -1
                }
                if (a.start > b.end){
                    return 1
                }
                return 0;
            });
            add_link_content_block(1, content_block)
            selected_link_piece = null;
            $('.modal').css('display', 'none');
        } 
    });
    $('body').on('input', '.link-to-box', function(){
        $(`#${$(this).data('fid')}`).html('');
    }); 
    function add_link_content_block(id, payload){
        var last_index = 0;
        var build_up_text = `<div class='content-input-placeholder'></div>`;
        for (var {text:t_text, link:l_link, start:_start, end:_end} of payload.links){
            build_up_text += payload.text.substring(last_index, _start);
            last_index = _end;
            build_up_text += `<a href='${l_link}' class='content-block-link'>${t_text}</a>`;

        }
        build_up_text += payload.text.substring(last_index)
        $(`#content-input-area${id}`).html(build_up_text);
    }
    var keydown_offset = null;
    $('body').on('mousedown', '.content-input-area', function(){
        keydown_offset = window.getSelection().getRangeAt(0).startOffset;
    });
    $('body').on('keydown', '.content-input-area', function(){
        
    });
});