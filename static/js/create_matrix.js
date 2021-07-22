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
    $('.matrix-title-field').focus();
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
    $('body').on('input', '.content-title-field', function(){
        content_block.title = $(this).val();
    }); 
    var selected_link_piece = null;
    var content_block = {text:'', title:'', links:[]};
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
    $('body').on('input', '.content-input-area', function(){
        content_block.text = $(this).text();
    });
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
                    selected_link_piece = {start:offset_count+new_r.startOffset, end:offset_count+new_r.endOffset, link:null};
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
        $('.text-to-display-field').val(content_block.text.substring(selected_link_piece.start, selected_link_piece.end));
        $('.link-to-display-field').val('');
        $('.link-to-display-field').focus();
    });
    $('body').on('click', '.cancel-link-to', function(){
        selected_link_piece = null;
        $('.modal').css('display', 'none');
    });
    $('body').on('click', '.add-link-to', function(){
        var t_link = $('.link-to-display-field').val();
        if (t_link.length === 0){
            $("#link-to-display-error").html('Cannot be left empty');
        }
        if (t_link.length){
            content_block.links.push({...selected_link_piece, link:t_link, lid:(content_block.links.length === 0 ? 1 : Math.max(content_block.links.map(x => x.lid))+1)});
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
        console.log('payload test in here')
        console.log(JSON.stringify(payload))
        var last_index = 0;
        var build_up_text = `<div class='content-input-placeholder'></div>`;
        for (var {link:l_link, start:_start, end:_end, lid:_lid} of payload.links){
            build_up_text += payload.text.substring(last_index, _start);
            last_index = _end;
            build_up_text += `<a href='${l_link}' class='content-block-link' id='content-block-link${_lid}' data-lid='${_lid}'>${payload.text.substring(_start, _end)}</a>`;

        }
        build_up_text += payload.text.substring(last_index)
        $(`#content-input-area${id}`).html(build_up_text);
    }
    function increment_link_siblings(node, factor = 1){
        var s_node = node.nextSibling;
        while (s_node != null){
            if (s_node.nodeType != 3 && $(s_node).hasClass('content-block-link')){
                for (var j of content_block.links){
                    if (j.lid === parseInt($(s_node).data('lid'))){
                        j.start += factor;
                        j.end += factor;
                    }
                }
            }
            s_node = s_node.nextSibling;
        }
    }
    $('body').on('keydown', '.content-input-area', function(e){
        var r = window.getSelection().getRangeAt(0);
        //startContainer
        //startOffset
        if (e.keyCode === 8){
            //range = [r.startOffset - 2, r.startOffset-1];
            if ($(r.startContainer.parentNode).hasClass('content-input-area')){
                increment_link_siblings(r.startContainer, -1)
            }
            else{
                increment_link_siblings(r.startContainer.parentNode, -1);
                for (var j of content_block.links){
                    if (j.lid === parseInt($(r.startContainer.parentNode).data('lid'))){
                        j.end--;
                    }
                }
                content_block.links = content_block.links.filter(x => x.start < x.end);
            }
        }
        else if (/[a-zA-Z0-9-_ ]/.test(String.fromCharCode(e.keyCode))){
            if ($(r.startContainer.parentNode).hasClass('content-input-area')){
                increment_link_siblings(r.startContainer)
            }
            else{
                increment_link_siblings(r.startContainer.parentNode)
                for (var j of content_block.links){
                    if (j.lid === parseInt($(r.startContainer.parentNode).data('lid'))){
                        j.end++;
                    }
                }
                
            }   
            //add_link_content_block(1, content_block)
            //range = [r.startOffset-1, r.startOffset];
        }
        console.log('content block after incrementation detection')
        console.log(JSON.stringify(content_block))
    });
    $('body').on('click', '.radio-box', function(){
        if (!$(this).hasClass('radio-box-selected')){
            $('.radio-box-selected').removeClass('radio-box-selected')
            $(this).addClass('radio-box-selected')
        }
    });
});