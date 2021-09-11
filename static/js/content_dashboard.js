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
    $('body').on('input', '.content-title-field', function(){
        content_block.title = $(this).val();
    }); 
    var selected_link_piece = null;
    var content_block = {text:'asdfasfdsadffsad', title:'', links:[]};
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
        $(`.delete-slide[data-fid="${_fid}"]`).css('visibility', 'visible')
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
        $(`#delete-slide${$(this).data('fid')}`).css('visibility', 'hidden')
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
        if ($(this).data('fid') === 'basic'){
            $(`.game-setting-field.input-entry-field[data-fid="${$(this).data('fid')}"]`).val(content_payload.name);
            $(`#content-input-area${$(this).data('fid')}`).html(`${render_content_block(content_payload.desc)}<div class="content-input-placeholder"></div>`);
        }
        else{
            var fid = parseInt($(this).data('fid'))
            $(`.game-setting-field.input-entry-field[data-fid="${$(this).data('fid')}"]`).val(content_payload.content.filter(x => x.id === fid)[0].title);
            $(`#content-input-area${$(this).data('fid')}`).html(`${render_content_block(content_payload.content.filter(x => x.id === fid)[0])}<div class="content-input-placeholder"></div>`);
        }
    });
    $('body').on('click', '.save-edits', function(){
        if (!$(this).hasClass('save-edits-disabled')){
            $(`#entry-control-edit${$(this).data('fid')}`).html(`
                <div class='edit-entries' data-fid='${$(this).data('fid')}'>
                    <div>Edit</div>
                    <div class='edit-entry'></div>
                </div>
            `);
            $(`#cancel-edit${$(this).data('fid')}`).css('visibility', 'hidden');
            $(`#delete-slide${$(this).data('fid')}`).css('visibility', 'hidden');
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
    });
    $('body').on('click', '.delete-slide', function(){
        if (Array.from(document.querySelectorAll('.content-slide-name')).length > 1){
            var fid = parseInt($(this).data('fid'));
            content_payload.content = content_payload.content.filter(x => parseInt(x.id) != fid);
            $(`[data-content="${fid}"]`).remove();
            var c = 1;
            for (var i of document.querySelectorAll('.content-slide-name')){
                $(i).text(`Slide ${c}`);
                c++;
            }
            console.log('content_payload after deletion')
            console.log(content_payload)
        }
    });
    function render_content_block(block){
        var last_ind = 0;
        var build_string = '';
        for (var {link:l_link, start:_start, end:_end, lid:_lid} of block.links){
            build_string += block.text.substring(last_ind, _start)
            build_string += `<a href='${l_link}' class='content-block-link' id='content-block-link${_lid}' data-lid='${_lid}'>${block.text.substring(_start, _end)}</a>`;
            last_ind = end;
        }
        build_string += block.text.substring(last_ind);
        return build_string
    }
    var content_payload = null;
    function load_payload(){
        content_payload = $('.dashboard-toggle-header').data('payload');
        $('.content-settings').html(`
        <div class='game-settings-outer'>
        <div class='edit-section-outer'>
            <div class='section-edit-name'>Basic</div>
            <div class="make-edits">
                <div class="edit-entry-outer entry-control-edit" id='entry-control-editbasic'>
                    <div class="edit-entries" data-fid='basic'>
                        <div>Edit</div>
                        <div class="edit-entry"></div>
                    </div>
                </div>
                <div class="edit-entry-outer">
                    <div class="cancel-edit" data-fid='basic' id='cancel-editbasic'>Cancel</div>
                </div>
            </div>
        </div>
        <div></div>
        <div class="game-setting-entry">Name</div>
        <input type="text" value="${content_payload.name}" class="game-setting-field game-setting-field-disabled input-entry-field" data-fid="basic" readonly="">
        <div class="game-setting-entry">Description</div>
        <div class="content-textarea content-textarea-disabled input-entry-field" data-fid='basic'>
            <div class="content-input-area" contenteditable="true" id="content-input-areabasic" data-fid='basic'>${render_content_block(content_payload.desc)}<div class="content-input-placeholder"></div>
            </div>
            <div class="content-input-footer">
                <div class="attach-link"></div>
            </div>
        </div>
        </div>
        `);
        var _c = 1;
        for (var {title:_title, text:_text, links:_links, id:_id} of content_payload.content){
            $('.game-settings-outer').append(`
                <div class='edit-section-outer' data-content='${_id}'>
                    <div class='section-edit-name content-slide-name'>Slide ${_c}</div>
                    <div class="make-edits make-edits-content">
                        <div class="edit-entry-outer entry-control-edit" id='entry-control-edit${_id}'>
                            <div class="edit-entries" data-fid='${_id}'>
                                <div>Edit</div>
                                <div class="edit-entry"></div>
                            </div>
                        </div>
                        <div class='edit-entry-outer'>
                            <div class='delete-slide' data-fid='${_id}' id='delete-slide${_id}'>Delete</div>
                        </div>
                        <div class="edit-entry-outer">
                            <div class="cancel-edit" data-fid='${_id}' id='cancel-edit${_id}'>Cancel</div>
                        </div>
                    </div>
                </div>
                <div data-content='${_id}'></div>
                <div class="game-setting-entry" data-content='${_id}'>Title</div>
                <input type="text" value="${_title}" class="game-setting-field game-setting-field-disabled input-entry-field" data-fid="${_id}" readonly="" data-content='${_id}'>
                <div class="game-setting-entry" data-content='${_id}'>Content</div>
                <div class="content-textarea content-textarea-disabled input-entry-field" data-fid='${_id}' data-content='${_id}'>
                    <div class="content-input-area" contenteditable="true" id="content-input-area${_id}" data-fid='${_id}'>${render_content_block({title:_title, text:_text, links:_links, id:_id})}<div class="content-input-placeholder"></div>
                    </div>
                    <div class="content-input-footer">
                        <div class="attach-link"></div>
                    </div>
                </div>
            `);
            _c++;
        }
    
    }
    load_payload()
});