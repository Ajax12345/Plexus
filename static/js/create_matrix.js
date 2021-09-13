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
    $('body').on('input', '.matrix-title-field', function(){
        full_matrix_payload.name = $(this).val();
        $('#content-title-error').css('display', 'none');
    });
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
    $('body').on('input', '.actor-name-field', function(){
        $("#actor-entry-error").css('display', 'none');
        $('.first-move-wrapper').css('display', 'none');
        $('.next-step-current').removeClass('next-step-filled');
        $('.next-step-current').html('1')
    });
    var selected_link_piece = null;
    var content_block = {text:'', title:'', links:[]};
    var mouse_down = false;
    var mouse_move = false;
    var full_matrix_payload = {name:null, desc:null, actors:null, move:null, reactions:null};
    var step = 1;
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
    var reactions = [];
    function add_reaction(a_id){
        var _reaction = $('.add-reaction-field').val();
        var f_reactions = [...full_matrix_payload.reactions[1], ...full_matrix_payload.reactions[2]];
        if (_reaction.length > 0){
            var _r_id = (f_reactions.length > 0 ? Math.max(...f_reactions.map(x => parseInt(x.id))) : 0)+1;
            full_matrix_payload.reactions[a_id].push({id:_r_id, reaction:_reaction});
            $('.add-reaction-outer').append(`
                <div class='reaction-entry' data-rid='${_r_id}'>${_reaction}</div>
                <div class='remove-reaction' data-rid='${_r_id}' data-aid='${a_id}'></div>
            `);
            $('.add-reaction-field').val('');
            $('.add-reaction-field').focus();
        }
    }
    $('body').on('click', '.add-reaction', function(){
        add_reaction(parseInt($(this).data('aid')));
    });
    $('body').on('click', '.remove-reaction', function(){
        var _rid = parseInt($(this).data('rid'));
        var a_id = parseInt($(this).data('aid'));
        full_matrix_payload.reactions[a_id] = full_matrix_payload.reactions[a_id].filter(x => parseInt(x.id) != _rid);
        $(`div[data-rid="${_rid}"]`).remove()
    });
    $('body').on('keypress', '.add-reaction-field', function(e){
        if (e.keyCode === 13){
            add_reaction();
        }
    });
    function step_1(){
        if (full_matrix_payload.name === null || full_matrix_payload.name.length === 0){
            $('#content-title-error').css('display', 'block');
            $('#content-title-error').html('Please enter a name for this matrix')
        }
        else{
            if (content_block.text.length > 0){
                full_matrix_payload.desc = content_block;
            }
            selected_link_piece = null;
            content_block = {text:'', title:'', links:[]};
            $("#step-progress-col2 .process-circle").addClass('progress-circle-complete');
            $("#step-progress-col2 .process-circle").html(`<div class="progress-complete-check"></div>`)
            $("#step-progress-col4 .process-circle").removeClass('progress-circle-not-completed');
            step = 2;
            $('.main-entry-col').html(`
            <div class='field-wrapper'>
                <div class="step-header step-main">Add actors</div>
                <div style="height:10px"></div>
                <div class="step-description">The actors are the two sides that will face off in the game.</div>
                <div style="height:30px"></div>
                <div class='add-actors-outer'>
                    <div class='actor-title-prompt'>Actor 1</div>
                    <div></div>
                    <div class='actor-title-prompt'>Actor 2</div>
                    <input type='text' class='actor-name-field' id='actor-field1'>
                    <div class='actor-title-prompt' style='font-size:20px'>vs.</div>
                    <input type='text' class='actor-name-field' id='actor-field2'>
                </div>
                <div class='field-error-message' id='actor-entry-error' style='display:none'></div>
                <div style='height:80px'></div>
                <div class='first-move-wrapper'>
                    <div class='actor-move-prompt'>Which actor moves first?</div>
                    <div style="height:30px"></div>
                    <div class='first-move-selection'>
                        <div class='radio-box radio-box-selected' data-aid='1'>
                            <div class='radio-box-inner'></div>
                        </div>
                        <div class='actor-name' data-aid='1'>Protestors</div>
                        <div></div>
                        <div class='radio-box' data-aid='2'>
                            <div class='radio-box-inner'></div>
                        </div>
                        <div class='actor-name' data-aid='2'>Police</div>
                    </div>
                    <div style='height:70px'></div>
                </div>
                <div class='next-step-outer'>
                    <div class='next-step-button step-progress-button'>Next (<span class='next-step-current'>1</span>/2)</div>
                    <div class='next-icon'></div>
                </div>
            </div>
            `);
            $('#actor-field1').focus();

        }
        console.log('full_matrix_payload');
        console.log(full_matrix_payload);
    }
    function step_2(){
        var a1 = $('#actor-field1').val();
        var a2 = $('#actor-field2').val();
        if (a1.length === 0 || a2.length === 0){
            $("#actor-entry-error").css('display', 'block');
            $("#actor-entry-error").html('Please enter the two actor names');
        }
        else{
            if ($('.first-move-wrapper').css('display') === 'none'){
                $('.actor-name[data-aid="1"]').html(a1);
                $('.actor-name[data-aid="2"]').html(a2);
                $('.first-move-wrapper').css('display', 'block');
                $('.next-step-current').addClass('next-step-filled');
                $('.next-step-current').html('2')
            }
            else{
                full_matrix_payload.actors = {1:{name:a1}, 2:{name:a2}};
                full_matrix_payload.reactions = {1:[], 2:[]};
                full_matrix_payload.move = parseInt($(document.querySelector('.radio-box.radio-box-selected')).data('aid'));
                step = 3;
                $("#step-progress-col4 .process-circle").addClass('progress-circle-complete');
                $("#step-progress-col4 .process-circle").html(`<div class="progress-complete-check"></div>`)
                $("#step-progress-col6 .process-circle").removeClass('progress-circle-not-completed');
                $('.main-entry-col').html(`
                    <div class='field-wrapper'>
                        <div class="step-header step-main">Add reactions</div>
                        <div style="height:10px"></div>
                        <div class="step-description">Reactions are the possible moves that an actors can make in the game.</div>
                        <div style="height:30px"></div>
                        <div class='actor-add-reactions-prompt'>Add reactions for <span class='actor-hashtag'>#${full_matrix_payload.actors[1].name}</span>:</div>
                        <div style='height:20px'></div>
                        <div class='add-reaction-outer'>
                            <input type='text' class='add-reaction-field' placeholder='i.e "non-violent"'>
                            <div class='add-reaction' data-aid='1'>Add</div>
                        </div>
                        <div style='height:80px'></div>
                        <div class='next-step-outer'>
                            <div class='next-step-button step-progress-button' data-aid='1'>Next (<span class='next-step-current'>1</span>/2)</div>
                            <div class='next-icon'></div>
                        </div>
                        
                    </div>
                `)
                $('.add-reaction-field').focus();
                console.log('full_matrix_payload');
                console.log(full_matrix_payload);
            }
        }
    }
    function step_3(){
        if (Object.keys(full_matrix_payload.reactions).every(function (x){return full_matrix_payload.reactions[x].length === 0})){
            //do something later
        }
        else{
            if (Object.keys(full_matrix_payload.reactions).every(function (x){return full_matrix_payload.reactions[x].length > 0})){
                $("#step-progress-col6 .process-circle").addClass('progress-circle-complete');
                $("#step-progress-col6 .process-circle").html(`<div class="progress-complete-check"></div>`)
                $("#step-progress-col8 .process-circle").removeClass('progress-circle-not-completed');
                step = 4;
            }
            else{
                $('.main-entry-col').html(`
                    <div class='field-wrapper'>
                        <div class="step-header step-main">Add reactions</div>
                        <div style="height:10px"></div>
                        <div class="step-description">Reactions are the possible moves that an actors can make in the game.</div>
                        <div style="height:30px"></div>
                        <div class='actor-add-reactions-prompt'>Add reactions for <span class='actor-hashtag'>#${full_matrix_payload.actors[2].name}</span>:</div>
                        <div style='height:20px'></div>
                        <div class='add-reaction-outer'>
                            <input type='text' class='add-reaction-field' placeholder='i.e "non-violent"'>
                            <div class='add-reaction' data-aid='2'>Add</div>
                        </div>
                        <div style='height:80px'></div>
                        <div class='next-step-outer'>
                            <div class='next-step-button step-progress-button' data-aid='2'>Next (<span class='next-step-current next-step-filled'>2</span>/2)</div>
                            <div class='next-icon'></div>
                        </div>
                        
                    </div>
                `)
                $('.add-reaction-field').focus();
            }
        }
        console.log('full_matrix_payload');
        console.log(full_matrix_payload);
    }
    var step_handlers = {1:step_1, 2:step_2, 3:step_3};
    $('body').on('click', '.next-step-button', function(){
        if (!$(this.parentNode).hasClass('next-step-disabled')){
            step_handlers[step]()
        }
    });
});