$(document).ready(function(){
    function disable_contentarea_fields(){
        for (var i of document.querySelectorAll('.content-textarea-disabled')){
            $(i.querySelector('.content-input-area')).attr('contenteditable', false);
        }
    }
    disable_contentarea_fields()
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
    function game_field_1(){
        
    }
    function game_field_2(){

    }
    var game_setting_field_handlers = {1:game_field_1, 2:game_field_2}
    $('body').on('input', '.game-setting-field', function(){
        var fid = parseInt($(this).data('fid'));
        $(this).removeClass('input-entry-field-error');
        if (fid in game_setting_field_handlers){
            game_setting_field_handlers[fid]()
        }
    }); 
    var selected_link_piece = null;
    var content_block = {text:null, title:'', links:[]};
    var matrix_payload = null;
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
        $('#insert-content-link').css('display', 'block');
        $('.text-to-display-field').val(content_block.text.substring(selected_link_piece.start, selected_link_piece.end));
        $('.link-to-display-field').val('');
        $('.link-to-display-field').focus();
    });
    $('#insert-content-link').on('click', '.cancel-link-to', function(){
        selected_link_piece = null;
        $('#insert-content-link').css('display', 'none');
    });
    $('#insert-content-link').on('click', '.add-link-to', function(){
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
            $('#insert-content-link').css('display', 'none');
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
    $('body').on('input', ".input-entry-field", function(){
        $(`#save-edits${$(this).data('fid')}`).removeClass('save-edits-disabled')
    });
    $('body').on('click', '.edit-entries', function(){
        var _fid=$(this).data('fid');
        $(`#entry-control-edit${_fid}`).html(`<div class='save-edits save-edits-disabled' data-fid="${_fid}" id='save-edits${_fid}'>Save</div>`);
        $(`.cancel-edit[data-fid="${_fid}"]`).css('visibility', 'visible')
        for (var i of document.querySelectorAll(`.input-entry-field[data-fid="${_fid}"]`)){
            if ($(i).hasClass('game-setting-field')){
                $(i).removeClass('game-setting-field-disabled')
                $(i).attr('readonly', false)
            }
            else{
                $(i).removeClass('content-textarea-disabled')
                $(i.querySelector('.content-input-area')).attr('contenteditable', true);
            }
        }
    });
    $('body').on('click', '.cancel-edit', function(){
        $(`#entry-control-edit${$(this).data('fid')}`).html(`
            <div class='edit-entries' data-fid='${$(this).data('fid')}'>
                <div>Edit</div>
                <div class='edit-entry'></div>
            </div>
        `);
        $(`#cancel-edit${$(this).data('fid')}`).css('visibility', 'hidden')
        for (var i of document.querySelectorAll(`.input-entry-field[data-fid="${$(this).data('fid')}"]`)){
            if ($(i).hasClass('game-setting-field')){
                $(i).addClass('game-setting-field-disabled')
                $(i).attr('readonly', true)
            }
            else{
                $(i).addClass('content-textarea-disabled')
                $(i.querySelector('.content-input-area')).attr('contenteditable', false);
            }
        }
    });
    function update_matrix_settings(){
        //run ajax here
    }
    function save_updates(fid){
        if (parseInt(fid) === 1){
            var n_name = $('.game-setting-field[data-fid="1"]').val();
            if (n_name.length === 0){
                $('.game-setting-field[data-fid="1"]').addClass('input-entry-field-error')
                return true;
            }
            matrix_payload.name = n_name;
            if (content_block.text != null){
                matrix_payload.dsc = content_block;
            }
            selected_link_piece = null;
            content_block = {text:null, title:'', links:[]};
            attach_link_fid = null;
            update_matrix_settings();
        } 
        else if (parseInt(fid) === 2){
            var a_name_1 = $('.game-setting-field[data-fid="2"][data-aid="1"]').val();
            var a_name_2 = $('.game-setting-field[data-fid="2"][data-aid="2"]').val();
            if (a_name_1.length === 0 || a_name_2.length === 0){
                $(`.game-setting-field[data-fid="2"][data-aid="${a_name_1.length === 0 ? "1" : "2"}"]`).addClass('input-entry-field-error')
                return true;
            }
            matrix_payload.actors[1].name = a_name_1;
            matrix_payload.actors[2].name = a_name_2;
            $("#actor-entry1").html(a_name_1);
            $("#actor-entry2").html(a_name_2);
            update_matrix_settings();
        }
        return false;
    }
    $('body').on('click', '.save-edits', function(){
        if (!$(this).hasClass('save-edits-disabled')){
            var saving_error = save_updates($(this).data('fid'));
            if (!saving_error){
                $(`#entry-control-edit${$(this).data('fid')}`).html(`
                    <div class='edit-entries' data-fid='${$(this).data('fid')}'>
                        <div>Edit</div>
                        <div class='edit-entry'></div>
                    </div>
                `);
                $(`#cancel-edit${$(this).data('fid')}`).css('visibility', 'hidden')
                for (var i of document.querySelectorAll(`.input-entry-field[data-fid="${$(this).data('fid')}"]`)){
                    if ($(i).hasClass('game-setting-field')){
                        $(i).addClass('game-setting-field-disabled')
                        $(i).attr('readonly', true)
                    }
                    else{
                        $(i).addClass('content-textarea-disabled')
                        $(i.querySelector('.content-input-area')).attr('contenteditable', false);
                    }
                }
            }
        }
    });
    $('body').on('click', '.edit-reactions-icon', function(){
        $('.modal-side-reaction-edit').html(`#${$(this).data('name')}`);
        $("#edit-side-reactions").css('display', 'block');
    });
    $('#edit-side-reactions').on('click', '.cancel-edit-reactions', function(){
        $("#edit-side-reactions").css('display', 'none');
    });
    $('body').on('click', ".edit-entries-payoffs", function(){
        $("#edit-side-payoffs").css('display', 'block')
    });
    var reactions = [];
    function add_reaction(){
        var _reaction = $('.add-reaction-field').val();
        if (_reaction.length > 0){
            var _r_id = (reactions.length > 0 ? Math.max(...reactions) : 0)+1;
            reactions.push(_r_id)
            $('.add-reaction-outer').append(`
                <div class='reaction-entry' data-rid='${_r_id}'>${_reaction}</div>
                <div class='remove-reaction' data-rid='${_r_id}'></div>
            `);
            $('.add-reaction-field').val('');
        }
    }
    $('body').on('click', '.add-reaction', function(){
        add_reaction();
    });
    $('body').on('click', '.remove-reaction', function(){
        var _rid = $(this).data('rid');
        reactions = reactions.filter(x => x != parseInt(_rid));
        $(`div[data-rid="${_rid}"]`).remove()
    });
    $('body').on('keypress', '.add-reaction-field', function(e){
        if (e.keyCode === 13){
            add_reaction();
        }
    });
    $('#edit-side-reactions').on('click', '.cancel-link-to', function(){
        $('#edit-side-reactions').css('display', 'none');
    });
    $('#edit-side-reactions').on('click', '.add-link-to', function(){
        $('#edit-side-reactions').css('display', 'none');
    });
    $('#edit-side-payoffs').on('click', '.cancel-modal', function(){
        $('#edit-side-payoffs').css('display', 'none');
    });
    function render_content_block(block){
        var last_ind = 0;
        var build_string = '';
        for (var {link:l_link, start:_start, end:_end, lid:_lid} of block.links){
            build_string += block.text.substring(last_ind, _start)
            build_string += `<a href='${l_link}' class='content-block-link' id='content-block-link${_lid}' data-lid='${_lid}'>${block.text.substring(_start, _end)}</a>`;
            last_ind = _end;
        }
        build_string += block.text.substring(last_ind);
        return build_string
    }
    function load_payload(){
        matrix_payload = $('.matrix-settings-wrapper').data('payload');
        console.log(matrix_payload)
        $('.matrix-settings-wrapper').html(`
        <div class='game-settings-outer'>
            <div class='edit-section-outer'>
                <div class='section-edit-name'>Basic</div>
                <div class="make-edits">
                    <div class="edit-entry-outer entry-control-edit" id='entry-control-edit1'>
                        <div class="edit-entries" data-fid='1'>
                            <div>Edit</div>
                            <div class="edit-entry"></div>
                        </div>
                    </div>
                    <div class="edit-entry-outer">
                        <div class="cancel-edit" data-fid='1' id='cancel-edit1'>Cancel</div>
                    </div>
                </div>
            </div>
            <div></div>
            <div class="game-setting-entry">Name</div>
            <input type="text" value="${matrix_payload.name}" class="game-setting-field game-setting-field-disabled input-entry-field" data-fid="1" readonly="">
            <div class="game-setting-entry">Description</div>
            <div class="content-textarea content-textarea-disabled input-entry-field" data-fid='1'>
                <div class="content-input-area" id="content-input-area1" data-fid='1'>${render_content_block(matrix_payload.dsc)}<div class="content-input-placeholder"></div>
                </div>
                <div class="content-input-footer">
                    <div class="attach-link"></div>
                </div>
            </div>
            <div class='edit-section-outer'>
                <div class='section-edit-name'>Actors</div>
                <div class="make-edits">
                    <div class="edit-entry-outer entry-control-edit" id='entry-control-edit2'>
                        <div class="edit-entries" data-fid='2'>
                            <div>Edit</div>
                            <div class="edit-entry"></div>
                        </div>
                    </div>
                    <div class="edit-entry-outer">
                        <div class="cancel-edit" data-fid='2' id='cancel-edit2'>Cancel</div>
                    </div>
                </div>
            </div>
            <div></div>
            <div class="game-setting-entry">Actor 1</div>
            <input type="text" value="${matrix_payload.actors[1].name}" class="game-setting-field game-setting-field-disabled input-entry-field" data-fid="2" readonly="" data-aid="1">
            <div class="game-setting-entry">Actor 2</div>
            <input type="text" value="${matrix_payload.actors[2].name}" class="game-setting-field game-setting-field-disabled input-entry-field" data-fid="2" readonly="" data-aid="2">
            <div style='height:20px'></div>
            <div style='height:20px'></div>
            <div class='edit-section-outer'>
                <div class='section-edit-name'>Reactions</div>
                <div class="make-edits">
                    
                </div>
            </div>
            <div></div>
            <div class="actor-entry" id='actor-entry1'>#${matrix_payload.actors[1].name}</div>
            <div class='edit-reactions-outer'>
                <div class='edit-reactions-entry'>2 reactions</div>
                <div class='edit-reactions-icon' data-name='${matrix_payload.actors[1].name}' data-aid='1'></div>
            </div>
            <div class="actor-entry" id='actor-entry2'>#${matrix_payload.actors[2].name}</div>
            <div class='edit-reactions-outer'>
                <div class='edit-reactions-entry'>2 reactions</div>
                <div class='edit-reactions-icon' data-name='${matrix_payload.actors[2].name}' data-aid='2'></div>
            </div>
            
        </div>
        
        <div style='height:40px'></div>
        <div class='edit-section-outer'>
            <div class='section-edit-name'>Payoffs</div>
            <div class="make-edits">
                <div class="edit-entry-outer entry-control-edit">
                    <div class="edit-entries-payoffs">
                        <div>Edit</div>
                        <div class="edit-entry"></div>
                    </div>
                </div>
            </div>
        </div>
        `);
    }   
    load_payload();
}); 