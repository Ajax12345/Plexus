$(document).ready(function(){
    $('body').on('click', '.game-content-close-top', function(){
        $('.game-content-modal').css('display', 'none');
    });
    $('body').on('click', '.close-content-modal', function(){
        $('.game-content-modal').css('display', 'none');
    });
    $('body').on('click', '.content-slide-name', function(){
        if (!$(this).hasClass('content-slide-chosen')){
            var sid = parseInt($(this).data('sid'));
            for (var i of document.querySelectorAll(':is(.content-slide-marker, .content-slide-name)')){
                $(i).removeClass('content-marker-chosen');
                $(i).removeClass('content-slide-chosen');
            }
            $(`.content-slide-name[data-sid="${sid}"]`).addClass('content-slide-chosen');
            $(`.content-slide-marker[data-sid="${sid}"]`).addClass('content-marker-chosen');
            var b = content_payload.content.filter(function(x){return parseInt(x.id) === sid})[0]
            $('.content-slide-title').html(b.title);
            $('.content-slide-body').html(render_content_block(b))
        }
    });
    $('body').on('click', '.content-next-toggle', function(){
        var sid = parseInt($(Array.from(document.querySelectorAll('.content-slide-name')).filter(function(x){return $(x).hasClass('content-slide-chosen')})[0]).data('sid'))
        var inds = [];
        var c = 0;
        var f = false;
        for (var i of content_payload.content){
            if (parseInt(i.id) === sid){
                f = true;
            }
            else if (f){
                inds.push(c);
            }
            c++;
        }
        var n_ind = inds.length === 0 ? 0 : Math.min(...inds);
        for (var i of document.querySelectorAll(':is(.content-slide-marker, .content-slide-name)')){
            $(i).removeClass('content-marker-chosen');
            $(i).removeClass('content-slide-chosen');
        }
        $(`.content-slide-name[data-sid="${content_payload.content[n_ind].id}"]`).addClass('content-slide-chosen');
        $(`.content-slide-marker[data-sid="${content_payload.content[n_ind].id}"]`).addClass('content-marker-chosen'); 
        $('.content-slide-title').html(content_payload.content[n_ind].title);
        $('.content-slide-body').html(render_content_block(content_payload.content[n_ind]))

    });
    $('body').on('click', '.resource-item', function(){
        
    });
    var meta_payload = null;
    var game_payload = null;
    var user_payload = null;
    var content_payload = null;
    var matrix_payload = null;
    var gameplay_payload = null;
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
    function load_content_modal(){
        console.log(content_payload)
        $('.content-slides').html('');
        var c = 0;
        for (var i of content_payload.content){
            $('.content-slides').append(`
            <div class='content-slide-marker ${c === 0 ? "content-marker-chosen" : ""}' data-sid='${i.id}'></div>
            <div class='content-slide-name ${c === 0 ? "content-slide-chosen" : ""}' data-sid='${i.id}'>${i.title}</div>
            `);
            c++;
        }
        $('.content-slide-title').html(content_payload.content[0].title);
        $('.content-slide-body').html(render_content_block(content_payload.content[0]))
    }
    function setup_start_screen(next_step = function(){}){
        $('.user-name-about').html(user_payload.name);
        $('.user-handle-about').html('@'+user_payload.name.replace(' ', '_').toLowerCase());
        $('.game-announcement-title').html(`Protest Set to Occur Between ${matrix_payload.actors[1].name} and ${matrix_payload.actors[2].name}.`);
        $('.game-announcement-body').html(`${matrix_payload.actors[1].name} and ${matrix_payload.actors[2].name} will face off in a pivotal confrontation.`)
        $('.what-you-need-to-know:nth-of-type(2)').html(`-In a moment, you will be assignmed to a team, either <span class="side-hashtag">#${matrix_payload.actors[1].name}</span> or <span class="side-hashtag">#${matrix_payload.actors[2].name}</span>`)
        $('.what-you-need-to-know:nth-of-type(3)').html(`-This game is ${game_payload.rounds} round${game_payload.rounds === 1 ? "" : "s"}. In each round, you and your teammates will choose a reaction as a response to your opponent's reaction`)
        $('.game-content-modal').css('display', 'block');
        load_content_modal();
        next_step();

    }
    function invite_demo_players(){
        $.ajax({
            url: "/invite-demo-players",
            type: "post",
            data: {payload: JSON.stringify({gid:game_payload.id})},
            success: function(response) {
                //pass
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
        
    }
    function load_start(){
        meta_payload = $('.main').data('pld')
        $.ajax({
            url: "/load-full-game-instance",
            type: "post",
            data: {payload: JSON.stringify(meta_payload)},
            success: function(response) {
                var payload = JSON.parse(response.payload);
                console.log(payload)
                game_payload = payload.game;
                user_payload = payload.user;
                content_payload = payload.content;
                matrix_payload = payload.matrix;
                gameplay_payload = payload.gameplay;
                setup_start_screen(function(){
                    $('.game-loading-state-display').css('display', 'none');
                
                });
                invite_demo_players();
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }

    load_start();
});