$(document).ready(function(){
    var full_content_payload = {title:'', desc:null, content:null};
    function content_title_set(_){
        $("#content-title-error").css('display', 'none');
        full_content_payload.title = $('.content-title-field[data-handler="content-title"]').val();
    }
    function content_slide_title_set(elem){
        $("#content-slide-title-error").css('display', 'none');
        content_block.title = $(elem).val();
    }
    var input_handlers = {'content-title':content_title_set, 'content-block':content_block_set, 'content-slide-title':content_slide_title_set};
    $('body').on('input', '.content-title-field', function(){
        input_handlers[$(this).data('handler')](this);
    });
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
    var content_block = {text:'', title:'', links:[]};
    var mouse_down = false;
    var mouse_move = false;
    var current_step = 1;
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
        input_handlers[$(this).data('handler')](this);
    
    });
    function content_block_set(elem){
        content_block.text = $(elem).text();
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
                    //console.log('all offset stuff here')
                    //console.log(offset_count)
                    selected_link_piece = {start:offset_count+new_r.startOffset, end:offset_count+new_r.endOffset, link:null};
                    //console.log(selected_link_piece)
                    
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
        //console.log('payload test in here')
        //console.log(JSON.stringify(payload))
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
        //console.log('content block after incrementation detection')
        //console.log(JSON.stringify(content_block))
    });
    function step_1(){
        if (full_content_payload.title.length === 0){
            $("#content-title-error").css('display', 'block');
            $("#content-title-error").html('Please add a name for this content');
        }
        else{
            if (content_block.text.length > 0){
                full_content_payload.desc = content_block;
            }
            selected_link_piece = null;
            content_block = {text:'', title:'', links:[]};
            $("#step-progress-col2 .process-circle").addClass('progress-circle-complete')
            $("#step-progress-col2 .process-circle").html(`<div class="progress-complete-check"></div>`)
            $("#step-progress-col4 .process-circle").removeClass('progress-circle-not-completed')
            $('.field-wrapper').html(`
                <div class="step-header step-main">Add a slide</div>
                <div style="height:10px"></div>
                <div class="step-description">A slide consists of a title and content body</div>
                <div style="height:30px"></div>
                <div class='step-header'>Slide title</div>
                <div style='height:15px'></div>
                <input type='text' class='content-title-field' data-handler='content-slide-title'>
                <div class='field-error-message' id='content-slide-title-error' style='display:none'></div>
                <div style='height:50px'></div>
                <div class='step-header'>Slide content</div>
                <div style='height:20px'></div>
                <!--
                <div class='step-description'>Every round, each actor will move. Sequential play will occur until the round limit is reached</div>
                -->
                <div class='content-textarea'>
                    <div class='content-input-area' contenteditable="true" id='content-input-area1' data-handler='content-block'>
                        <div class='content-input-placeholder'>Describe the outlay of this content...</div>
                    </div>
                    <div class='content-input-footer'>
                        <div class='attach-link'></div>
                    </div>
                </div>
                <div style='height:40px'></div>
                <div class="progress-controls progress-controls-start">
                    <div class="next-step-button step-progress-button add-slide-button" data-step="2">Add slide</div>
                    <div class="progress-control-dividor"></div>
                    <div class="next-step-button step-progress-button" data-step="3">Finish</div>
                </div>
            `);
            current_step = 2
            
        }   
    }
    function step_2(){
        if (content_block.title.length === 0){
            $("#content-slide-title-error").css('display', 'block');
            $("#content-slide-title-error").html('Please add a title for this content slide');
        }
        else{
            $('.content-title-field[data-handler="content-slide-title"]').val('')
            full_content_payload.content = full_content_payload.content === null ? [content_block] : [...JSON.parse(JSON.stringify(full_content_payload.content)), content_block]
            console.log('full content payload')
            console.log(full_content_payload)
            selected_link_piece = null;
            content_block = {text:'', title:'', links:[]};
            var _c_b = document.querySelector('#content-input-area1');
            for (var i of _c_b.childNodes){
                if (i.nodeType === 3 || !$(i).hasClass('content-input-placeholder')){
                    _c_b.removeChild(i);
                }
            }
            $('.content-block-link').each(function(){
                $(this).remove();
            });
            $('.content-input-placeholder').text('Describe the outlay of this content...');
            
            if (full_content_payload.content.length === 1){
                $('div[data-sid="7"].step-listing-col > .step-spacer').addClass('step-spacer-slide-display')
                $("#step-progress-col7 .progress-bar").css('height', '20px')
            }
            var nid = 7+full_content_payload.content.length;
            $('.progress-main').append(`<div class="step-listing-col" data-sid="${nid}" data-circle="true">
                <div class='slide-title-progress'>${full_content_payload.content[full_content_payload.content.length-1].title}</div>
            </div>`);
            $('.progress-main').append(`<div class="step-progress-col" id="step-progress-col${nid}">
                <div class='slide-dot-display'></div>
            </div>`);
            var nh = (parseInt($(`div[data-sid="${nid}"].step-listing-col`).css('height').match('\\d+')) - parseInt($(`#step-progress-col${nid} > .slide-dot-display`).css('height').match('\\d+')))/2;
            $(`<div class='progress-bar' style='height:${nh}px'></div>`).insertBefore(`#step-progress-col${nid} > .slide-dot-display`)
            $(`<div class='progress-bar' style='height:${nh}px'></div>`).insertAfter(`#step-progress-col${nid} > .slide-dot-display`)
            $('.progress-main').append(`<div class="step-listing-col" data-circle="true">
                <div class="step-spacer step-spacer-trailing step-spacer-slide-display"></div>
            </div>`);
            $('.progress-main').append(`<div class="step-progress-col">
                <div class="progress-bar" style="height: 20px;"></div>
            </div>`);
            $('.progress-controls').removeClass('progress-controls-start')
        }
    }
    function step_3(){
        
    }
    var step_handlers = {1:step_1, 2:step_2, 3:step_3};
    $('body').on('click', '.next-step-button', function(){
        step_handlers[parseInt($(this).data('step'))]()
    });
});