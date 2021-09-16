$(document).ready(function(){
    var step = 1;
    var game_payload = {name:null, rounds:6, content:null, matrix:null};
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
    $('.game-name-field').focus();
    setTimeout(function(){
        format_progress_bar();
    }, 100);
    $('body').on('input', '.game-name-field', function(){
        game_payload.name = $(this).val();
        $("#empty-game-name-error").css('display', 'none');
    });
    $('body').on('input', '.round-number-field', function(){
        var r = parseInt($(this).val())
        if (r < 1){
            $(this).val('1')
            r = 1;
        }
        game_payload.rounds = r;
    });
    function render_content_block(block){
        if (block === null){
            return '';
        }
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
    function adjust_content_card_height(){
        var m = Math.max(...Array.from(document.querySelectorAll('.content-card')).map(function(x){return parseInt($(x).css('height').match('\\d+'))}));
        for (var i of document.querySelectorAll('.content-card')){
            var h = parseInt($(i).css('height').match('\\d+'));
            $(i.querySelector('.content-spacer')).css('height', (m - h + 10).toString()+'px');
        }
    }
    function step_1(){
        if (game_payload.name === null || game_payload.name.length === 0){
            $("#empty-game-name-error").css('display', 'block');
            $("#empty-game-name-error").html('Please enter a name for the game');
        }
        else{
            $("#step-progress-col2 .process-circle").addClass('progress-circle-complete');
            $("#step-progress-col2 .process-circle").html(`<div class="progress-complete-check"></div>`)
            $("#step-progress-col4 .process-circle").removeClass('progress-circle-not-completed');
            step = 2;
            $('.main-entry-col').html(`
                <div class="field-wrapper">
                    <div class="step-header step-main">Choose content</div>
                    <div style="height:10px"></div>
                    <div class="step-description">Content provides background information and further resources for your game players</div>
                    <div style="height:30px"></div>
                    <div class='choose-content-wrapper'>
                        <div class='loader'></div>
                    </div>
                    <div class='field-error-message' id='no-content-chosen-error'></div>
                    <div style="height:40px"></div>
                    <div class="next-step-outer">
                        <div class="next-step-button step-progress-button">Next</div>
                        <div class="next-icon"></div>
                    </div>
                    <div style="height:100px"></div>
                </div>
            `);
            $.ajax({
                url: "/get-all-content",
                type: "post",
                data: {payload: ''},
                success: function(response) {
                    $('.choose-content-wrapper').html(`
                    <div class="content-type-prompt">Add existing content or <span class="create-new-content">create new content</span></div>
                    <div style="height:20px"></div>
                    <div class="user-own-content">
                    </div>
                    `)
                    var _content = JSON.parse(response.content);
                    if (_content.length === 0){
                        $('.content-type-prompt').html(`<span class="create-new-content">Create new content</span>`)
                    }
                    else{
                        for (var [id, name, desc, content] of _content){
                            $('.user-own-content').append(`
                                <div class="content-col">
                                    <div class="content-card" data-card="${id}" id="content-card${id}">
                                        <div class="content-title">${name}</div>
                                        <div style="height:10px"></div>
                                        <div class="content-description" id="content-description${id}">${render_content_block(desc)}</div>
                                        <div class='content-spacer' style="height:10px"></div>
                                        <div class="add-content-to-game add-game-content" data-cid='${id}'>Choose</div>
                                    </div>
                                </div>
                            `);
                        }
                        adjust_content_card_height();
                    }
                },
                error: function(xhr) {
                    //Do Something to handle error
                }
            });
            
        }
    }
    function step_2(){
        if (game_payload.content === null){
            $('#no-content-chosen-error').css('display', 'block');
            $('#no-content-chosen-error').html('Please choose a content block');
        }
        else{
            $("#step-progress-col4 .process-circle").addClass('progress-circle-complete');
            $("#step-progress-col4 .process-circle").html(`<div class="progress-complete-check"></div>`)
            $("#step-progress-col6 .process-circle").removeClass('progress-circle-not-completed');
            step = 3;
            $('.main-entry-col').html(`
                <div class='field-wrapper'>
                    <div class='step-header step-main'>Choose matrix</div>
                    <div style='height:10px'></div>
                    <div class='step-description'>The matrix specifies the game's actors, reactions, and payoffs</div>
                    <div style='height:30px'></div>
                    <div class='choose-matrix-wrapper'>
                        <div class='loader'></div>
                    </div>
                    <div class='field-error-message' id='no-matrix-chosen-error'></div>
                    <div style='height:80px'></div>
                    <div class='next-step-button step-progress-button' data-tolink='/create-game-3'>Create game</div>
                </div>
            `);
            $.ajax({
                url: "/get-all-matrices",
                type: "post",
                data: {payload: ''},
                success: function(response) {
                    $('.choose-matrix-wrapper').html(`
                    <div class='content-type-prompt'>Add an existing matrix or <span class='create-new-content'>create new matrix</span></div>
                    <div style='height:20px'></div>
                    <div class="user-own-content">
                    </div>
                    `)
                    var _matrices = JSON.parse(response.matrices);
                    if (_matrices.length === 0){
                        $('.content-type-prompt').html(`<span class="create-new-matrix">Create new matrix</span>`)
                    }
                    else{
                        for (var i of _matrices){
                            $('.user-own-content').append(`
                            <div class='content-col'>
                                <div class='content-card matrix-card' data-card='${i.id}' id='content-card${i.id}'>
                                    <div class='content-title'>${i.name}</div>
                                    <div style='height:10px'></div>
                                    <div class='matrix-actor-header'>Actors</div>
                                    <div style='height:5px'></div>
                                    <div class='matrix-actor-outer'><span class='matrix-actor'>#Police</span>, <span class='matrix-actor'>#Protestors</span></div>
                                    <div style='height:10px'></div>
                                    <div class='content-description' id='content-description${i.id}'>${render_content_block(i.dsc)}</div>
                                    <div class='content-spacer' style="height:10px"></div>
                                    <div class='add-content-to-game add-game-matrix' data-mid='${i.id}'>Choose</div>
                                </div>
                            </div>
                            `);
                        }
                        adjust_content_card_height();
                    }
                },
                error: function(xhr) {
                    //Do Something to handle error
                }
            });
        }
    }
    var step_handlers = {1:step_1, 2:step_2};
    $('body').on('click', '.next-step-button', function(){
        step_handlers[step]()
    });
    $('body').on('click', '.create-new-content', function(){
        window.location.replace('/create/content');
    });
    $('body').on('click', '.create-new-matrix', function(){
        window.location.replace('/create/matrix');
    });
    $('body').on('click', '.add-game-content', function(){
        if (!$(this).hasClass('content-chosen')){
            for (var i of document.querySelectorAll('.add-game-content')){
                $(i).removeClass('content-chosen')
                $(i).html('Choose')
            }
            $(this).addClass('content-chosen')
            $(this).html('Chosen')
            $('#no-content-chosen-error').css('display', 'none');
            game_payload.content = parseInt($(this).data('cid'));

        }
    });
    $('body').on('click', '.add-game-matrix', function(){
        if (!$(this).hasClass('content-chosen')){
            for (var i of document.querySelectorAll('.add-game-matrix')){
                $(i).removeClass('content-chosen')
                $(i).html('Choose')
            }
            $(this).addClass('content-chosen')
            $(this).html('Chosen')
            $('#no-matrix-chosen-error').css('display', 'none');
            game_payload.matrix = parseInt($(this).data('mid'));

        }
    });
});