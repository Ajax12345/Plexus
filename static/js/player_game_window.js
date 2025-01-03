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
    var roles = null;
    var response_template = null;
    var running_round = 1;
    var given_strategy_hint = false;
    var round_by_round_results = [];
    var allow_page_exit = false;
    window.onbeforeunload = on_exit_popup;

    function on_exit_popup() {
        if (!allow_page_exit){
            return 'Are you sure you want to leave the game?';
        }
    }
    class Template{
        constructor(template){
            this.template = template;
        }
        render_text(str, params){
            return str.replace(/\{\w+\}/g, function(match, ...p){
                return params[match.substring(1, match.length-1)];
            });
        }
        format(params){
            var self = this;
            if ((typeof self.template) === 'string'){
                return self.render_text(self.template, params)
            }
            return Object.fromEntries(Object.keys(self.template).map(function(x){return [x, self.render_text(self.template[x], params)]}))
        }
    }
    class TemplateCycle{
        constructor(options){
            this.options = options;
            this.ind = 0;
        }
        next(){
            var self = this;
            if (self.ind >= self.options.length){
                self.ind = 0;
            }
            self.ind++;
            return new Template(self.options[self.ind-1])
        }
        *[Symbol.iterator](){
            var self = this;
            for (var i of self.options){
                yield new Template(i);
            }
        }
    }
    class ResponseTemplate{
        static templatify(template){
            for (var i of Object.keys(template)){
                if (Array.isArray(template[i])){
                    template[i] = new TemplateCycle(template[i]);
                }
                else if ((typeof template[i]) === 'string'){
                    template[i] = new Template(template[i])
                }
                else{
                    ResponseTemplate.templatify(template[i])
                }
            }
        }
    }
    Pusher.logToConsole = true;

    var pusher = new Pusher('f7e3f6c14176cdde1625', {
      cluster: 'us2'
    });
    function start_game(payload){
        roles = payload.roles;
        gameplay_payload.id = payload.gpid;
        console.log('in start game handler')
        setup_play_stage();
    }
    function round_result_handler(payload){
        console.log('got in round result handler')
        console.log(payload)
        analyze_reaction_response(payload);
    }
    function stop_game_handler(payload){
        allow_page_exit = true
        window.location.replace('/')
    }
    function game_instructor_message_handler(payload){
        if (parseInt(payload.actor) === parseInt(player_role)){
            $('.instructor-message-outer').css('display', 'block');
            $('.instructor-message-inner').html(`<span class="side-hashtag" style='font-size:22px'>#${matrix_payload.actors[player_role].name}</span>: ${payload.message}`)
        }
    }
    function remove_player_handler(payload){
        if (parseInt(user_payload.id) === parseInt(payload.player_id)){
            allow_page_exit = true
            window.location.replace('/')
        }
        roles[parseInt(payload.side)] = roles[parseInt(payload.side)].filter(function(x){return parseInt(x.id) != parseInt(payload.player_id)})
    }
    var response_handlers = {2:start_game, 4:round_result_handler, 5:stop_game_handler, 6:game_instructor_message_handler, 7:remove_player_handler};
    function setup_pusher_handlers(){
        var channel = pusher.subscribe('game-events');
        channel.bind(`game-events-${game_payload.id}`, function(data) {
            console.log('got data from pusher game-events')
            console.log(data)
            if (data.handler in response_handlers){
                response_handlers[data.handler](data.payload)
            }
        });
    }
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
            document.querySelector('.content-slide-display-outer').scroll({top:0})
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
                document.querySelector('.content-slide-display-outer').scroll({top:0})
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
                document.querySelector('.content-slide-display-outer').scroll({top:0})
                if (next_content_block(content_payload.content[n_ind].id).length === 0){
                    if (!closed_content){
                        $('.content-next-toggle').html('Go to game');
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
    function analyze_reaction_response(response){
        console.log('basic response')
        console.log(response)
        console.log('response template')
        console.log(response_template)
        if (!response.round_finished){
            var start_template = response_template.actor_response.next().format(response)
            console.log('start template here')
            console.log(start_template)
            $('.game-announcement-title').html(all_caps(start_template.title));
            $('.game-announcement-body').html(only_start_caps(start_template.description));
        }
        else{
            var round_result_template = parseInt(response.a1_points) === parseInt(response.a2_points) ? response_template.round_by_round.round_results_tie : response_template.round_by_round.round_results
            var round_score_standing_text = parseInt(response.a1_total_score) === parseInt(response.a2_total_score) ? response_template.round_score_standing_text.tie : response_template.round_score_standing_text.non_tie;
            var start_template = round_result_template.next().format({...response, round_score_standing_text:round_score_standing_text.next().format(response).text})
            $('.side-score-outer:nth-of-type(1) .side-score-value').html(response.a1_total_score)
            $('.side-score-outer:nth-of-type(3) .side-score-value').html(response.a2_total_score)
            $('.game-announcement-title').html(all_caps(start_template.title));
            $('.game-announcement-body').html(only_start_caps(start_template.description));
            if (document.querySelector('.round-by-round-empty') != null){
                $('.round-by-round-header-entry > .round-by-round-actor:nth-of-type(2)').html(`#${matrix_payload.actors[1].name}`);
                $('.round-by-round-header-entry > .round-by-round-actor:nth-of-type(3)').html(`#${matrix_payload.actors[2].name}`);
                $('.round-by-round').css('display', 'block');
                $('.round-by-round-spacer').css('display', 'block');
                $('.round-by-round-main').html('');
            }
            $('.round-by-round-main').prepend(`
                <div class='round-by-round-entry'>
                    <div class='round-by-round-num'>${response.round_int}</div>
                    <div class='round-reaction-points-entry'>
                        <div class='actor-reaction-entry'>${response.a1_reaction}</div>
                        <div style='height:5px'></div>
                        <div class='actor-points-awarded-outer'>
                            <div class='actor-points-prompt-entry'>points</div>
                            <div class='actor-points-round-col'>
                                <div class='actor-awarded-point-by-round'>${response.a1_points}</div>
                            </div>
                        </div>
                    </div>
                    <div class='round-reaction-points-entry'>
                        <div class='actor-reaction-entry'>${response.a2_reaction}</div>
                        <div style='height:5px'></div>
                        <div class='actor-points-awarded-outer'>
                            <div class='actor-points-prompt-entry'>points</div>
                            <div class='actor-points-round-col'>
                                <div class='actor-awarded-point-by-round'>${response.a2_points}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            round_by_round_results.push(JSON.parse(JSON.stringify(response)));
            analyze_round_performance();
        }
        if (!response.round_finished || (running_round + 1 <= parseInt(game_payload.rounds))){
            if (response.round_finished){
                running_round++;
                $('.current-round').html(`Round ${running_round} of ${game_payload.rounds}`);
            }
            if (response.actor_move_next_id === player_role){
                setTimeout(function(){
                    player_side_move({actor:player_role, body:`Team <span class="side-hashtag">#${matrix_payload.actors[player_role].name}</span>: ${response_template.round_move_prompt.prompt.next().format({...response}).text} Make your move now!`});
                    setTimeout(function(){
                        if (running_round===1 || running_round%3 === 0){
                            display_strategy_hint();
                        }
                    }, 200);
                }, 500);
            }
            else{
                /*
                setTimeout(function(){
                    opponent_side_move();
                }, 500); 
                */   
            }
        }
        else{
            function most_common_reaction(reactions){
                var r_name = null;
                var f_c = null;
                for (var i of Object.keys(reactions)){
                    if (f_c === null || reactions[i] > f_c){
                        f_c = reactions[i];
                        r_name = i;
                    }
                }
                return r_name;
            }
            var reaction_counts = {1:{}, 2:{}};
            for (var i of round_by_round_results){
                reaction_counts[1][i.a1_reaction] = i.a1_reaction in reaction_counts[1] ? reaction_counts[1][i.a1_reaction] + 1 : 1;
                reaction_counts[2][i.a2_reaction] = i.a2_reaction in reaction_counts[2] ? reaction_counts[2][i.a2_reaction] + 1 : 1;
            }
            console.log('final response payload view')
            console.log(response);
            console.log(reaction_counts)
            var game_over_template = parseInt(response.a1_total_score) === parseInt(response.a2_total_score) ? response_template.game_over_responses.tie : response_template.game_over_responses.non_tie;
            var game_over_personalized = parseInt(player_role) === parseInt(response.actor_running_winner_id) ? response_template.game_over_personalize.player_wins : response_template.game_over_personalize.player_loses
            var game_over_text = game_over_template.next().format({...response, game_personalize_message:game_over_personalized.next().format().text});
            $('.game-announcement-title').html(all_caps(game_over_text.title));
            $('.game-announcement-body').html(only_start_caps(game_over_text.description));
            $('#message-container1').remove();
            $('#message-container2').remove();
            $("#section-block2").html(`
                <div class="header-section-text">What you need to know</div>
                <!--<div class="what-you-need-to-know">-The ${matrix_payload.actors[1].name} ${past_tense_to_be(matrix_payload.actors[1].name)} mostly ${most_common_reaction(reaction_counts[1])} and the ${matrix_payload.actors[2].name} ${past_tense_to_be(matrix_payload.actors[2].name)} mostly ${most_common_reaction(reaction_counts[2])}.</div>-->
                <div class='what-you-need-to-know-margin'></div>
            `)
            for (var i of response_template.what_you_need_to_know_end){
                $(`<div class="what-you-need-to-know">-${i.format({a1:matrix_payload.actors[1].name, a1_past_to_be_tense:past_tense_to_be(matrix_payload.actors[1].name), a1_most_common:most_common_reaction(reaction_counts[1]), a2:matrix_payload.actors[2].name, a2_past_to_be_tense:past_tense_to_be(matrix_payload.actors[2].name), a2_most_common:most_common_reaction(reaction_counts[2])})}</div>`).insertBefore('.what-you-need-to-know-margin')
            }
            
            setTimeout(function(){
                allow_page_exit = true
                display_feedback_survey();
            }, 2000)
        }
    }
    function display_feedback_survey(){
        $.ajax({
            url: "/get-survey",
            type: "post",
            data: {payload: JSON.stringify({id:game_payload.id})},
            success: function(response) {
                if (response.result){
                    $('.take-survey-prompt').html(`Please take our <a href='${response.link}' style='color:rgb(27, 149, 224)'>quick survey</a>. Thank you!`)
                    $('.take-survey-outer').css('display', 'block');
                }
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    function submit_side_reactions(reactions, side){
        $.ajax({
            url: "/submit-side-reactions",
            type: "post",
            data: {payload: JSON.stringify({id:game_payload.id, gid:gameplay_payload.id, side:side, reactions:reactions, round:running_round})},
            success: function(response) {
                analyze_reaction_response(JSON.parse(response.response));
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    } 
    function submit_reaction(reaction, side){
        console.log('submitting reaction')
        console.log(reaction)
        console.log(side)
        $.ajax({
            url: "/submit-reaction",
            type: "post",
            data: {payload: JSON.stringify({id:game_payload.id, gid:gameplay_payload.id, side:side, reaction:reaction, round:running_round})},
            success: function(response) {
                //analyze_reaction_response(JSON.parse(response.response));
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    $('body').on('click', '.reaction-poll-option', function(){
        if (!$(this.parentNode).hasClass('reaction-poll-disabled')){
            $(this).addClass('reaction-poll-chosen')
            $(this.parentNode).addClass('reaction-poll-disabled');
            var r_id = parseInt($(this).data('rid'));
            var r_name = $(this).data('rname')
            post_message({poster:10, name:"Plexus", handle:'plexus', body:`Your selection has been recorded. Please wait while the rest of your team submits their choices.`, is_player:0, reply:null, target_m_id:"wait-for-response", special_class:'message-pinned-stream', broadcast:0})
            submit_reaction({...roles[player_role].filter(function(x){return parseInt(x.id) === parseInt(user_payload.id)})[0], name:user_payload.name, reaction:r_id, reaction_name:r_name}, player_role);
        }
    });
    function player_side_move(payload){
        $("#reaction-poll-message").remove();
        $("#wait-for-response").remove();
        $('#message-container1').prepend(`<div class="message-main" id='reaction-poll-message' style='margin-top:-100px'>
            <div class="message-body">
                <div class="poster-icon-outer">
                    <div class="main-game-icon"></div>
                </div>
                <div class="main-message-body">
                    <div class="message-about-poster">
                        <div class="message-poster-name">Plexus</div>
                        <div class="message-poster-handle">@plexus</div>
                        <div class="message-dot"></div>
                        <div class="message-post-datetime">Just now</div>
                    </div>
                    <div class="message-body-content">${payload.body}</div>
                    <div class='reaction-poll-outer'>
                        ${matrix_payload.reactions[payload.actor].map(function(x){
                            return `<div class="reaction-poll-option" data-rid='${x.id}' data-rname='${x.reaction}'>${x.reaction}</div>`
                        }).join('\n')}
                    </div>
                    <div class="message-action-footer">
                        <div class="reply-message-outer">
                            <div class="reply-message-icon"></div>
                        </div>
                        <div class="message-reply-count">0</div>
                        <div></div>
                        <div class="like-message-outer">
                            <div class="like-message-icon"></div>
                        </div>
                        <div class="message-like-count">0</div>
                    </div>
                </div>
            </div>
        </div>`);
        setTimeout(function(){
            $(`#reaction-poll-message`).css('margin-top', `0px`);
        }, 50);
    }
    function setup_play_stage(){
        player_role = Object.keys(roles).filter(function(x){return roles[x].some(function(y){return parseInt(y.id) === parseInt(user_payload.id)})})[0]
        opponent =  Object.keys(matrix_payload.actors).filter(function(x){return parseInt(x) != parseInt(player_role)})[0]
        console.log('player role')
        console.log(player_role);
        $('.role-container .team-about-large').html('#'+matrix_payload.actors[player_role].name);
        for (var i of document.querySelectorAll('.how-to-play-container .how-to-play-desc > .adversary-hashtag')){
            $(i).html('#'+matrix_payload.actors[opponent].name);
        }
        $('.side-score-outer:nth-of-type(1) .side-score-name').html(matrix_payload.actors[1].name)
        $('.side-score-outer:nth-of-type(3) .side-score-name').html(matrix_payload.actors[2].name)
        $('.role-container').css('display', 'block');
        $('.how-to-play-container').css('display', 'block')
        $('.score-box').css('display', 'block')
        $('.scoreboard-spacer').css('display', 'block')
        $("#section-block2").html(`
            <div class="message-team-outer">
                <div class="message-team-prompt-outer">
                    <div class="team-messages-text"><span class="side-hashtag side-hashtag-header">#${matrix_payload.actors[player_role].name}</span> messages</div>
                </div>
                <div class="message-button-outer">
                    <div class="add-message">Message</div>
                </div>
            </div>
        `);
        $('.current-round').html(`Round 1 of ${game_payload.rounds}`);
        post_message({poster:10, name:"Plexus", handle:'plexus', body:`The game has begun! Your team is #${matrix_payload.actors[player_role].name}.`, is_player:0, reply:null, special_class:'message-pinned-stream'})
        var non_start = Object.keys(matrix_payload.actors).filter(function(x){return parseInt(x) != parseInt(matrix_payload.move)})[0]
        var first_move_a = matrix_payload.actors[matrix_payload.move].name;
        var second_move_a = matrix_payload.actors[non_start].name;
        var start_template = response_template.round_by_round.start.next().format({first_move_actor:first_move_a, second_move_actor:second_move_a, present_tense_to_be:present_tense_to_be(first_move_a), await_tense:is_singular(second_move_a) ? "awaits" : "await"})
        console.log('start template here')
        console.log(start_template)
        $('.game-announcement-title').html(all_caps(start_template.title));
        $('.game-announcement-body').html(only_start_caps(start_template.description));
        //submit_side_reactions([...choose_reactions(opponent)], opponent);
        if (parseInt(player_role) === parseInt(matrix_payload.move)){
            setTimeout(function(){
                player_side_move({actor:player_role, body:`Team <span class="side-hashtag">#${matrix_payload.actors[player_role].name}</span>: the game has begun. Make your move now!`});
                setTimeout(function(){
                    display_strategy_hint();
                }, 2000);
            }, 3000);
            
        }
        else{
            //opponent_side_move();
        }
    }
    function on_content_close(){
        if (!closed_content){
            start_walkthrough(1);
            closed_content = true;
        }
    }
    function new_paragraph_markup(block_text){
        return block_text.split('{NEW_PARA}').map(function(x){return `&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;${x}`}).join('<br>')
    }
    function render_content_markup(block_text){
        return new_paragraph_markup(block_text)
    }
    function render_content_block(block){
        var last_ind = 0;
        var build_string = '';
        for (var {link:l_link, start:_start, end:_end, lid:_lid} of block.links){
            build_string += block.text.substring(last_ind, _start)
            build_string += `<a href='${l_link}' class='content-block-link' id='content-block-link${_lid}' data-lid='${_lid}' target='_blank'>${block.text.substring(_start, _end)}</a>`;
            last_ind = _end;
        }
        build_string += block.text.substring(last_ind);
        return render_content_markup(build_string)
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
        document.querySelector('.content-slide-display-outer').scroll({top:0})
    }
    function setup_start_screen(next_step = function(){}){
        $('.user-name-about').html(user_payload.name);
        $('.user-handle-about').html('@'+user_payload.name.replace(' ', '_').toLowerCase());
        $('.game-announcement-title').html(response_template.game_announcement_title.format({a1:matrix_payload.actors[1].name, a2:matrix_payload.actors[2].name})); //$('.game-announcement-title').html(`Protest Set to Occur Between ${matrix_payload.actors[1].name} and ${matrix_payload.actors[2].name}.`);
        $('.game-announcement-body').html(response_template.game_announcement_body.format({a1:matrix_payload.actors[1].name, a2:matrix_payload.actors[2].name}))//$('.game-announcement-body').html(`${matrix_payload.actors[1].name} and ${matrix_payload.actors[2].name} will face off in a pivotal confrontation.`)
        /*
        $('.what-you-need-to-know:nth-of-type(2)').html(`-In a moment, you will be assigned to a team, either <span class="side-hashtag">#${matrix_payload.actors[1].name}</span> or <span class="side-hashtag">#${matrix_payload.actors[2].name}</span>`)
        $('.what-you-need-to-know:nth-of-type(3)').html(`-This game is ${game_payload.rounds} round${game_payload.rounds === 1 ? "" : "s"}. In each round, you and your teammates will choose a reaction as a response to your opponent's reaction`)
        */
        console.log('testing what you need to know')
        console.log(response_template.what_you_need_to_know)
        for (var i of response_template.what_you_need_to_know){
            $(`<div class='what-you-need-to-know'>-${i.format({a1:matrix_payload.actors[1].name, a2:matrix_payload.actors[2].name, round_num:game_payload.rounds})}</div>`).insertBefore('.what-you-need-to-know-margin')
        }
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
    function utc_now(){
        var d = new Date();
        return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
    }
    function all_caps(s){
        var ignore = ['a', 'and', 'an', 'the', 'or', 'but', 'yet', 'were', 'was', 'while', 'to']
        return s.replace(/^[a-zA-Z]|\b[a-zA-Z]/g, function(match, ...p){
            return !ignore.includes(match) ? match.toUpperCase() : match;
        });
    }
    function only_start_caps(s){
        var actor_names = Object.keys(matrix_payload.actors).map(function(x){return matrix_payload.actors[x].name}).map(function(x){return x.toLowerCase()})
        return s.toLowerCase().replace(/^[a-zA-Z]|(\.\s)[a-zA-Z]/g, function(match, ...p){
            return match.toUpperCase()
        }).replace(/[a-zA-Z]+/g, function(match, ...p){
            return actor_names.includes(match.toLowerCase()) ? match[0].toUpperCase() + match.substring(1).toLowerCase() : match
        });
    }
    function analyze_round_performance(){
        if (round_by_round_results.length > 1){
            if (round_by_round_results.slice(round_by_round_results.length-2, round_by_round_results.length).every(function(x){return parseInt(x.round_loser_id) === parseInt(player_role)})){
                display_strategy_reminder();
            }
        }
    }
    function post_message(payload, target='#message-container1'){
        var posted_date = utc_now();
        $.ajax({
            url: "/post-message",
            type: "post",
            data: {payload: JSON.stringify({poster:payload.poster, gid:gameplay_payload.id, is_player:payload.is_player, body:payload.body, reply:payload.reply, added:posted_date, broadcast:'broadcast' in payload ? payload.broadcast : 0})},
            success: function(response) {
                var message_id = 'target_m_id' in payload ? payload.target_m_id : `game-message${response.id}`
                $(target).prepend(`<div class="message-main ${'special_class' in payload ? payload.special_class : ""}" id='${message_id}' style='margin-top:-100px'>
                    <div class="message-body game-message" data-mid='${response.id}'>
                        <div class="poster-icon-outer">
                            <img class="message-poster-icon" src="https://www.gravatar.com/avatar/e527e2038eb5c6671be2820348cb72b2?d=identicon">
                        </div>
                        <div class="main-message-body">
                            <div class="message-about-poster">
                                <div class="message-poster-name">${payload.name}</div>
                                <div class="message-poster-handle">@${payload.handle}</div>
                                <div class="message-dot"></div>
                                <div class="message-post-datetime" data-posted='${posted_date}'>1 sec</div>
                            </div>
                            <div class="message-body-content">${find_handles(payload.body)}</div>
                            <div class="message-action-footer">
                                <div class="reply-message-outer">
                                    <div class="reply-message-icon"></div>
                                </div>
                                <div class="message-reply-count">0</div>
                                <div></div>
                                <div class="like-message-outer">
                                    <div class="like-message-icon"></div>
                                </div>
                                <div class="message-like-count">0</div>
                            </div>
                        </div>
                    </div>
                </div>`);
                //$(`#${message_id}`).css('margin-top', `-${$(`#${message_id}`).css('height')}`);
                setTimeout(function(){
                    $(`#${message_id}`).css('margin-top', `0px`);
                }, 50);
                
                //on_message_display(message_id);
                
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
        
    }
    function update_message_timestamps(){
        for (var i of document.querySelectorAll('.game-message .message-post-datetime')){
            var d1 = $(i).data('posted');
            var d2 = utc_now();
            var factors = [[1000, 'sec'], [1000*60, 'min']];
            var last = null;
            for (var [interval, t] of factors){
                var v = Math.floor((d2 - d1)/interval)
                if (v > 0){
                    last = {val:v, t_int:t};
                }
            }
            if (last != null){
                $(i).html(`${last.val} ${last.t_int}`);
            }

        }
    }
    function run_message_timestamp_updates(){
        setTimeout(function(){
            update_message_timestamps();
            run_message_timestamp_updates();
        }, 60000);
    }
    run_message_timestamp_updates()
    $('body').on('click', '.add-message', function(){
        $('.post-message-outer').css('display', 'block');
        $('.message-compose-field').html(`<div class='message-body-placeholder' style="display: inline;" contentEditable="false">Message your team</div>`)
        $('.message-compose-field').focus();
    });
    $('body').on('click', '.close-post-message', function(){
        $('.post-message-outer').css('display', 'none');
    });
    function* get_all_message_text(elem){
        if (elem.nodeType === 3){
            yield elem.textContent;
        }
        else if (!$(this).hasClass('message-body-placeholder')){
            for (var i of elem.childNodes){
                yield* get_all_message_text(i);
            }
        }
    }
    function find_handles(message){
        return message.replace(/#\w+|@\w+/g, function(match, ...p){
            return `<span class='side-hashtag'>${match}</span>`
        });
    }
    var hash_flag = false;
    $('body').on('input', '.message-compose-field', function(e){
        var t = Array.from(get_all_message_text(document.querySelector('.message-compose-field'))).join('');
        if (t.length === 0){
            $('.message-compose-field').html(`<div class='message-body-placeholder' style="display: inline;" contentEditable="false">Message your team</div>`)
        }
        else{
            $('.message-body-placeholder').remove();
            var change = false;
            if (e.originalEvent.data === '#'){
                hash_flag = true;
            }
            else if (e.originalEvent.data.match(/[^\w]+/)){
                hash_flag = false;
                change = true;
            }
            if (hash_flag || change){
                t = Array.from(get_all_message_text(document.querySelector('.message-compose-field'))).join('');
                $('.message-compose-field').html(find_handles(t))
                document.querySelector('.message-compose-field').focus();
                document.execCommand('selectAll', false, null);
                document.getSelection().collapseToEnd();
            }
        }
    });
    $('body').on('click', '.post-message-button', function(){
        var t = Array.from(get_all_message_text(document.querySelector('.message-compose-field'))).join('');
        $('.post-message-outer').css('display', 'none');
        post_message({poster:user_payload.id, name:user_payload.name, handle:user_payload.name.replace(' ', '_').toLowerCase(), body:t, is_player:1, reply:null}, '#message-container2')
    });
    var singularity = {'police':false};
    function is_singular(name){
        if (name.toLowerCase() in singularity){
            return singularity[name.toLowerCase()];
        }
        return name[name.length - 1] != 's'
    }
    function present_tense_to_be(name){
        return is_singular(name) ? 'is' : 'are'
    }
    function past_tense_to_be(name){
        return is_singular(name) ? 'was' : 'were'
    }
    function display_strategy_hint(){
        if (!given_strategy_hint){
            var optimal_payouts = matrix_payload.payoffs.filter(function(x){return x.payouts[player_role] > x.payouts[opponent]})
            if (optimal_payouts.length === 0){
                optimal_payouts = matrix_payload.payoffs.filter(function(x){return x.payouts[player_role] === x.payouts[opponent]})
            }
            if (optimal_payouts.length > 0){
                given_strategy_hint = true;
                //var full_strings = optimal_payouts.map(function(x){return `${x.reactions[player_role].reaction} when the #${matrix_payload.actors[opponent].name.toLowerCase()} ${present_tense_to_be(matrix_payload.actors[opponent].name)} ${x.reactions[opponent].reaction}`})
                //post_message({poster:10, name:"Plexus", handle:'plexus', body:find_handles(`Hint: you will have a scoring advantage when you are ${full_strings.length < 3 ? full_strings.join(' and ') : full_strings.slice(0, full_strings.length - 1).join(' , ')+' and '+full_strings[full_strings.length-1]}.`), is_player:0, reply:null, special_class:'message-pinned-stream', broadcast:0})
            
                var full_strings = optimal_payouts.map(function(x){return response_template.optimal_moves.reaction.format({your_reaction:x.reactions[player_role].reaction, opposing_side:matrix_payload.actors[opponent].name.toLowerCase(), present_tense_to_be:present_tense_to_be(matrix_payload.actors[opponent].name), opponent_reaction:x.reactions[opponent].reaction})})
                post_message({poster:10, name:"Plexus", handle:'plexus', body:find_handles(response_template.optimal_moves.hint.format({full_options:full_strings.length < 3 ? full_strings.join(' and ') : full_strings.slice(0, full_strings.length - 1).join(' , ')+' and '+full_strings[full_strings.length-1]})), is_player:0, reply:null, special_class:'message-pinned-stream', broadcast:0})
            }
        }
    }
    function display_strategy_reminder(){
        var optimal_payouts = matrix_payload.payoffs.filter(function(x){return x.payouts[player_role] > x.payouts[opponent]})
        if (optimal_payouts.length === 0){
            optimal_payouts = matrix_payload.payoffs.filter(function(x){return x.payouts[player_role] === x.payouts[opponent]})
        }
        if (optimal_payouts.length > 0){
            given_strategy_hint = true;
            //var full_strings = optimal_payouts.map(function(x){return `${x.reactions[player_role].reaction} when the #${matrix_payload.actors[opponent].name.toLowerCase()} ${present_tense_to_be(matrix_payload.actors[opponent].name)} ${x.reactions[opponent].reaction}`})
            //post_message({poster:10, name:"Plexus", handle:'plexus', body:find_handles(`Remember, you have a scoring advantage when you are ${full_strings.length < 3 ? full_strings.join(' and ') : full_strings.slice(0, full_strings.length - 1).join(' , ')+' and '+full_strings[full_strings.length-1]}.`), is_player:0, reply:null, special_class:'message-pinned-stream'})
        
            var full_strings = optimal_payouts.map(function(x){return response_template.optimal_moves.reaction.format({your_reaction:x.reactions[player_role].reaction, opposing_side:matrix_payload.actors[opponent].name.toLowerCase(), present_tense_to_be:present_tense_to_be(matrix_payload.actors[opponent].name), opponent_reaction:x.reactions[opponent].reaction})})
            post_message({poster:10, name:"Plexus", handle:'plexus', body:find_handles(response_template.optimal_moves.reminder.format({full_options:full_strings.length < 3 ? full_strings.join(' and ') : full_strings.slice(0, full_strings.length - 1).join(' , ')+' and '+full_strings[full_strings.length-1]})), is_player:0, reply:null, special_class:'message-pinned-stream'})
        }
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
                response_template = payload.response_template;
                ResponseTemplate.templatify(response_template);
                setup_pusher_handlers();
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
    $('body').on('click', '.close-instructor-message', function(){
        $('.instructor-message-outer').css('display', 'none');
    });
});