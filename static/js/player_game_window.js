$(document).ready(function(){
    var meta_payload = null;
    var game_payload = null;
    var user_payload = null;
    var content_payload = null;
    var matrix_payload = null;
    var gameplay_payload = null;
    var closed_content = false;
    var current_card = null;
    var walkthrough_disabled = false;
    var closed_walkthrough = false;
    $('body').on('click', '.game-content-close-top', function(){
        $('.game-content-modal').css('display', 'none');
        on_content_close()
    });
    $('body').on('click', '.close-content-modal', function(){
        $('.game-content-modal').css('display', 'none');
        on_content_close()
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
    function next_content_block(sid){
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
        return inds;
    }
    function previous_slide(sid){
        var slide = null;
        for (var i of content_payload.content){
            if (parseInt(i.id) === sid){
                return slide
            }
            slide = i;
        }
        return slide;
    }
    $('body').on('click', '.content-back-toggle', function(){
        if (!$(this).hasClass('content-toggle-disabled')){
            var sid = parseInt($(Array.from(document.querySelectorAll('.content-slide-name')).filter(function(x){return $(x).hasClass('content-slide-chosen')})[0]).data('sid'))
            $('.content-next-toggle').removeClass('content-toggle-disabled');
            $('.content-next-toggle').html('Next');
            var slide = previous_slide(sid);
            if (slide != null){
                for (var i of document.querySelectorAll(':is(.content-slide-marker, .content-slide-name)')){
                    $(i).removeClass('content-marker-chosen');
                    $(i).removeClass('content-slide-chosen');
                }
                $(`.content-slide-name[data-sid="${slide.id}"]`).addClass('content-slide-chosen');
                $(`.content-slide-marker[data-sid="${slide.id}"]`).addClass('content-marker-chosen'); 
                $('.content-slide-title').html(slide.title);
                $('.content-slide-body').html(render_content_block(slide))
            }
            if (previous_slide(parseInt(slide.id)) === null){
                $('.content-back-toggle').addClass('content-toggle-disabled')
            }
        }
    });
    $('body').on('click', '.content-next-toggle', function(){
        if (!$(this).hasClass('content-toggle-disabled')){
            $('.content-back-toggle').removeClass('content-toggle-disabled')
            var sid = parseInt($(Array.from(document.querySelectorAll('.content-slide-name')).filter(function(x){return $(x).hasClass('content-slide-chosen')})[0]).data('sid'))
            var inds = next_content_block(sid);
            if (inds.length > 0){
                var n_ind = Math.min(...inds);
                for (var i of document.querySelectorAll(':is(.content-slide-marker, .content-slide-name)')){
                    $(i).removeClass('content-marker-chosen');
                    $(i).removeClass('content-slide-chosen');
                }
                $(`.content-slide-name[data-sid="${content_payload.content[n_ind].id}"]`).addClass('content-slide-chosen');
                $(`.content-slide-marker[data-sid="${content_payload.content[n_ind].id}"]`).addClass('content-marker-chosen'); 
                $('.content-slide-title').html(content_payload.content[n_ind].title);
                $('.content-slide-body').html(render_content_block(content_payload.content[n_ind]))
                if (next_content_block(content_payload.content[n_ind].id).length === 0){
                    if (!closed_content){
                        $('.content-next-toggle').html('Start game');
                    }
                    else{
                        $('.content-next-toggle').addClass('content-toggle-disabled')
                    }
                }
            }
            else{
                if (!closed_content){
                    $('.game-content-modal').css('display', 'none');
                    on_content_close()
                }
            }
        }
    });
    $('body').on('click', '.resource-item', function(){
        if ($(this).data('resource') === 'content'){
            $('.game-content-modal').css('display', 'block');
            load_content_modal();
        }
    }); 
    function on_content_close(){
        if (!closed_content){
            start_walkthrough(1);
            closed_content = true;
        }
    }
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
        $('.content-back-toggle').addClass('content-toggle-disabled');
        $('.content-next-toggle').removeClass('content-toggle-disabled')
        $('.content-next-toggle').html('Next');
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
        $('.what-you-need-to-know:nth-of-type(2)').html(`-In a moment, you will be assigned to a team, either <span class="side-hashtag">#${matrix_payload.actors[1].name}</span> or <span class="side-hashtag">#${matrix_payload.actors[2].name}</span>`)
        $('.what-you-need-to-know:nth-of-type(3)').html(`-This game is ${game_payload.rounds} round${game_payload.rounds === 1 ? "" : "s"}. In each round, you and your teammates will choose a reaction as a response to your opponent's reaction`)
        $('.game-content-modal').css('display', 'block');
        /*new addition*/
        $('.side-score-outer:nth-of-type(1) .side-score-name').html(matrix_payload.actors[1].name)
        $('.side-score-outer:nth-of-type(3) .side-score-name').html(matrix_payload.actors[2].name)
        $('.score-box').css('display', 'block')
        $('.scoreboard-spacer').css('display', 'block')
        /*new addition*/
        $('.round-by-round-header-entry > .round-by-round-actor:nth-of-type(2)').html(`#${matrix_payload.actors[1].name}`);
        $('.round-by-round-header-entry > .round-by-round-actor:nth-of-type(3)').html(`#${matrix_payload.actors[2].name}`);
        $('.round-by-round').css('display', 'block');
        $('.round-by-round-spacer').css('display', 'block');
        load_content_modal();
        next_step();

    }
    function load_start(){
        meta_payload = $('.main').data('pld')
        $.ajax({
            url: "/load-game-instance-player",
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
                //invite_demo_players();
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    load_start();
    var walkthrough_steps = {
        path:[1],
        start:1,
        steps:{
            1:{
                elem:'.score-box',
                card:1,
                orient:1,
                next:2,
            },
            2:{
                elem:'.round-by-round',
                card:2,
                orient:1,
                next:4,
            },
            3:{
                elem:'.resources-box',
                card:3,
                orient:1,
                next:null,
            },
            4:{
                elem:'.main-col-gameplay',
                card:4,
                orient:2,
                next:3
            },
            5:{
                elem:'#reaction-poll-message',
                card:5,
                orient:1,
                next:null
            }
        },
        cards:{
            1:`<div class='walkthrough-card'>
                    <div class='walkthrough-card-inner'>
                        <div class='w-card-title'>This is the game scoreboard</div>
                        <div style='height:20px'></div>
                        <div class='w-card-desc'>The scoreboard displays the current round and points for both sides during the game.</div>
                        <div style='height:30px'></div>
                        <div class='w-card-nav-outer'>
                            <div class='hide-w-cards-toggle'>
                                <div class='hide-w-card-icon'></div>
                                <div class='hide-w-cards'>Hide these tips</div>
                            </div>
                            <div class='w-next-card-col'><div class='next-card-walkthrough'>Next</div></div>
                        </div>
                    </div>
                    <div class='walkthrough-arrow-1'></div>
                </div>`,
            2:`<div class='walkthrough-card'>
                    <div class='walkthrough-card-inner'>
                        <div class='w-card-title'>This is the round results box</div>
                        <div style='height:20px'></div>
                        <div class='w-card-desc'>The round results box displays the reactions and points earned by both sides after each round.</div>
                        <div style='height:30px'></div>
                        <div class='w-card-nav-outer'>
                            <div class='hide-w-cards-toggle'>
                                <div class='hide-w-card-icon'></div>
                                <div class='hide-w-cards'>Hide these tips</div>
                            </div>
                            <div class='w-next-card-col'><div class='next-card-walkthrough'>Next</div></div>
                        </div>
                    </div>
                    <div class='walkthrough-arrow-2'></div>
                </div>`,
            3:`<div class='walkthrough-card'>
                    <div class='walkthrough-card-inner'>
                        <div class='w-card-title'>Find help and resources here</div>
                        <div style='height:20px'></div>
                        <div class='w-card-desc'>In this box, you can find the game content (the background information on the game) and the scoring rules for your side.</div>
                        <div style='height:30px'></div>
                        <div class='w-card-nav-outer'>
                            <div class='hide-w-cards-toggle'>
                                <div class='hide-w-card-icon'></div>
                                <div class='hide-w-cards'>Hide these tips</div>
                            </div>
                            <div class='w-next-card-col'><div class='next-card-walkthrough'>Next</div></div>
                        </div>
                    </div>
                    <div class='walkthrough-arrow-3'></div>
                </div>`,
            4:`<div class='walkthrough-card'>
                    <div class='walkthrough-card-inner'>
                        <div class='w-card-title'>This is where you play the game</div>
                        <div style='height:20px'></div>
                        <div class='w-card-desc'>Here, you will recieve game updates and make your moves against your opponent.</div>
                        <div style='height:30px'></div>
                        <div class='w-card-nav-outer'>
                            <div class='hide-w-cards-toggle'>
                                <div class='hide-w-card-icon'></div>
                                <div class='hide-w-cards'>Hide these tips</div>
                            </div>
                            <div class='w-next-card-col'><div class='next-card-walkthrough'>Next</div></div>
                        </div>
                    </div>
                    <div class='walkthrough-arrow-4'></div>
                </div>`,
            5:`<div class='walkthrough-card'>
                    <div class='walkthrough-card-inner'>
                        <div class='w-card-title'>Make your move here</div>
                        <div style='height:20px'></div>
                        <div class='w-card-desc'>Choose one of the reactions from the poll here.</div>
                        <div style='height:30px'></div>
                        <div class='w-card-nav-outer'>
                            <div class='hide-w-cards-toggle'>
                                <div class='hide-w-card-icon'></div>
                                <div class='hide-w-cards'>Hide these tips</div>
                            </div>
                            <div class='w-next-card-col'><div class='next-card-walkthrough'>Next</div></div>
                        </div>
                    </div>
                    <div class='walkthrough-arrow-5'></div>
                </div>`
        }
    }
    function render_walkthrough_step(s_step){
        $('.walkthrough-card').remove();
        $('.walkthrough-highlight').removeClass('walkthrough-highlight')
        var t_obj = document.querySelector(walkthrough_steps.steps[s_step].elem);
        $(t_obj).addClass('walkthrough-highlight');
        $('body').append(walkthrough_steps.cards[walkthrough_steps.steps[s_step].card]);
        current_card = s_step;
        var t = t_obj.offsetTop;
        var l = t_obj.offsetLeft;
        var w = parseInt($(t_obj).css('width').match('\\d+'));
        var y = parseInt($(t_obj).css('height').match('\\d+'));
        var w1 = parseInt($('.walkthrough-card').css('width').match('\\d+'));
        var y1 = parseInt($('.walkthrough-card').css('height').match('\\d+'));
        if (walkthrough_steps.steps[s_step].orient === 1){
            //arrow tooltip centered vertically on the target
            $('.walkthrough-card').css('left', (l - w1-35).toString());
            var a_obj = document.querySelector(`.walkthrough-arrow-${s_step}`)
            $('.walkthrough-card').css('top', (t+y/2 - parseInt($(a_obj).css('top').match('\\d+')) - parseInt($(a_obj).css('height').match('\\d+'))/2 - 20).toString());

        }
        else if (walkthrough_steps.steps[s_step].orient === 2){
            $('.walkthrough-card').css('left', (l - w1-35).toString());
            var a_obj = document.querySelector(`.walkthrough-arrow-${s_step}`)
            $('.walkthrough-card').css('top', (t+y/5 - parseInt($(a_obj).css('top').match('\\d+')) - parseInt($(a_obj).css('height').match('\\d+'))/2 - 20).toString());
        }

    }
    function start_walkthrough(s_step){
        $('.walkthrough-outer').css('display', 'block');
        render_walkthrough_step(s_step)
    }
    function end_walkthrough(){
        $('.walkthrough-card').remove();
        $('.walkthrough-highlight').removeClass('walkthrough-highlight')
        $('.walkthrough-outer').css('display', 'none');
        if (!closed_walkthrough){
            /*
            setTimeout(function(){
                post_message({poster:10, name:"Plexus", handle:'plexus', body:'Preparing demo.... The game will begin in a moment.', is_player:0, reply:null, special_class:'message-pinned-stream'})
                setTimeout(function(){
                    assign_player_roles();
                }, 1000);
            }, 500);
            */
            closed_walkthrough = true;
        }
    }
    $('body').on('click', '.next-card-walkthrough', function(){
        if (walkthrough_steps.steps[current_card].next != null){
            render_walkthrough_step(walkthrough_steps.steps[current_card].next);
        }
        else{
            end_walkthrough();

        }
    });
    $('body').on('click', '.hide-w-cards-toggle', function(){
        end_walkthrough();
        walkthrough_disabled = true;
        current_card = null;
    }); 
});